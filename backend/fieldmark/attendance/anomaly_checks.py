import hashlib
from datetime import timedelta, datetime, date
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.core.files.storage import default_storage

from fieldmark.workers.models import Worker, Zone
from fieldmark.settings_config.models import AnomalyRuleConfig
from .models import AttendanceRecord
from .haversine import haversine
from .exif_reader import extract_exif_gps

# Helper to get configuration values with static fallbacks
def get_rule_config(rule_name, default_val):
    try:
        cfg = AnomalyRuleConfig.objects.get(rule_name=rule_name)
        if cfg.is_enabled:
            return cfg.threshold_value
    except Exception:
        pass
    return default_val


def get_rule_enabled(rule_name, default_enabled=True):
    try:
        cfg = AnomalyRuleConfig.objects.get(rule_name=rule_name)
        return cfg.is_enabled
    except Exception:
        pass
    return default_enabled


def check_sync_gps_zone(record):
    """
    Check if the user is in their assigned zone.
    Runs synchronously during record submission.
    """
    worker = record.worker
    zone = worker.assigned_zone
    
    if not zone:
        # No zone assigned, cannot perform check
        return AttendanceRecord.GPSMatchChoices.MATCHED, []
        
    distance = haversine(
        record.latitude, 
        record.longitude, 
        zone.center_lat, 
        zone.center_lng
    )
    
    flags = []
    if distance > zone.radius_meters:
        match_status = AttendanceRecord.GPSMatchChoices.MISMATCH
        flags.append("OUTSIDE_ZONE")
    else:
        match_status = AttendanceRecord.GPSMatchChoices.MATCHED
        
    return match_status, flags


def run_exif_check(record):
    """Downloads photo, extracts GPS and computes delta compared to device coordinates."""
    if not get_rule_enabled('EXIF_MISMATCH', True):
        return None, None, None, []

    try:
        # Read file from storage
        with default_storage.open(record.photo_url) as img_file:
            # Extract coordinates
            exif_lat, exif_lng = extract_exif_gps(img_file)
            
        if exif_lat is None or exif_lng is None:
            # Image does not contain GPS tags, flag as mismatch/warning
            return None, None, None, ["EXIF_MISMATCH"]
            
        # Calculate delta
        delta = haversine(record.latitude, record.longitude, exif_lat, exif_lng)
        threshold = get_rule_config('GPS_MISMATCH_THRESHOLD_METERS', 100.0)
        
        flags = []
        if delta > threshold:
            flags.append("EXIF_MISMATCH")
            
        return exif_lat, exif_lng, delta, flags
    except Exception as e:
        print(f"Error in EXIF check task: {str(e)}")
        return None, None, None, ["EXIF_MISMATCH"]


def run_photo_hash_check(record):
    """Computes file hash and checks if it duplicates another upload."""
    if not get_rule_enabled('DUPLICATE_PHOTO', True):
        return None, []

    try:
        hasher = hashlib.md5()
        with default_storage.open(record.photo_url, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        photo_hash = hasher.hexdigest()
        
        # Look for duplicate MD5 hash on same day (exclude self)
        duplicates = AttendanceRecord.objects.filter(
            date=record.date,
            photo_hash=photo_hash
        ).exclude(id=record.id)
        
        flags = []
        if duplicates.exists():
            flags.append("DUPLICATE_PHOTO")
            
        return photo_hash, flags
    except Exception as e:
        print(f"Error computing photo hash: {str(e)}")
        return None, []


def run_speed_check(record):
    """Checks travel speed between today's submission and most recent previous submission."""
    if not get_rule_enabled('SPEED_VIOLATION', True):
        return []

    # Get most recent attendance record of this worker before current
    prior = AttendanceRecord.objects.filter(
        worker=record.worker,
        marked_at__lt=record.marked_at
    ).order_by('-marked_at').first()
    
    if not prior:
        return []

    # Calculate distance in km
    dist_m = haversine(record.latitude, record.longitude, prior.latitude, prior.longitude)
    dist_km = dist_m / 1000.0
    
    # Calculate time delta in hours
    time_delta = record.marked_at - prior.marked_at
    time_hours = time_delta.total_seconds() / 3600.0
    
    # Avoid division by zero
    if time_hours < 0.001:
        time_hours = 0.001
        
    speed_kmh = dist_km / time_hours
    threshold = get_rule_config('SPEED_VIOLATION_THRESHOLD_KMH', 50.0)
    
    if speed_kmh > threshold:
        return ["SPEED_VIOLATION"]
        
    return []


def run_device_change_check(record):
    """Flags if worker registers attendance using too many unique devices."""
    if not get_rule_enabled('DEVICE_CHANGE', True):
        return []

    days_window = int(get_rule_config('DEVICE_CHANGE_DAYS', 7))
    device_limit = int(get_rule_config('DEVICE_CHANGE_LIMIT', 3))
    
    start_date = record.marked_at - timedelta(days=days_window)
    
    # Query distinct devices used
    devices = AttendanceRecord.objects.filter(
        worker=record.worker,
        marked_at__gte=start_date,
        marked_at__lte=record.marked_at
    ).values_list('device_id', flat=True).distinct()
    
    if len(devices) > device_limit:
        return ["DEVICE_CHANGE"]
        
    return []


def run_cutoff_pattern_check(record):
    """Flags if the worker submits close to shift end consecutively."""
    if not get_rule_enabled('CUTOFF_PATTERN', True):
        return []

    # Get shift end
    shift = record.worker.shift
    if not shift and record.worker.assigned_zone:
        shift = record.worker.assigned_zone.shift
        
    if not shift:
        return [] # No shift, cannot verify cutoff

    cutoff_minutes = int(get_rule_config('CUTOFF_MINUTES_THRESHOLD', 5))
    consecutive_days = int(get_rule_config('CUTOFF_CONSECUTIVE_DAYS', 6))
    
    # Get last N days
    prior_records = AttendanceRecord.objects.filter(
        worker=record.worker,
        marked_at__lte=record.marked_at
    ).order_by('-marked_at')[:consecutive_days]
    
    if len(prior_records) < consecutive_days:
        return []
        
    close_calls = 0
    for r in prior_records:
        # Check marked_at time relative to shift end
        marked_time = r.marked_at.time()
        # Compute difference in minutes (assume same day)
        marked_dt = datetime.combine(date.today(), marked_time)
        end_dt = datetime.combine(date.today(), shift.window_end)
        
        diff = end_dt - marked_dt
        diff_mins = diff.total_seconds() / 60.0
        
        if 0 <= diff_mins <= cutoff_minutes:
            close_calls += 1
            
    if close_calls >= consecutive_days:
        return ["CUTOFF_PATTERN"]
        
    return []
