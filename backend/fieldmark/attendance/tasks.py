from celery import shared_task
from django.utils import timezone
from django.db import transaction

from fieldmark.workers.models import Worker
from .models import AttendanceRecord
from .anomaly_checks import (
    run_exif_check, run_photo_hash_check, run_speed_check,
    run_device_change_check, run_cutoff_pattern_check
)

@shared_task
def run_attendance_async_checks(record_id):
    """
    Asynchronous Celery worker task that executes image EXIF extraction, 
    duplicate hash matching, travel velocity check, device shifts, 
    and cutoff sequence patterns.
    """
    try:
        record = AttendanceRecord.objects.get(id=record_id)
    except AttendanceRecord.DoesNotExist:
        print(f"AttendanceRecord {record_id} does not exist for async checks")
        return False

    anomaly_flags = list(record.anomaly_flags)

    # 1. Run EXIF check
    exif_lat, exif_lng, exif_delta, exif_flags = run_exif_check(record)
    with transaction.atomic():
        # Update EXIF outputs in a transaction
        record.photo_exif_lat = exif_lat
        record.photo_exif_lng = exif_lng
        record.exif_gps_delta_meters = exif_delta
        record.save()
        
    for f in exif_flags:
        if f not in anomaly_flags:
            anomaly_flags.append(f)

    # 2. Run Photo Hash Check
    photo_hash, hash_flags = run_photo_hash_check(record)
    if photo_hash:
        record.photo_hash = photo_hash
        record.save()
        
    for f in hash_flags:
        if f not in anomaly_flags:
            anomaly_flags.append(f)

    # 3. Run Speed Check
    speed_flags = run_speed_check(record)
    for f in speed_flags:
        if f not in anomaly_flags:
            anomaly_flags.append(f)

    # 4. Run Device Change Check
    device_flags = run_device_change_check(record)
    for f in device_flags:
        if f not in anomaly_flags:
            anomaly_flags.append(f)

    # 5. Run Cutoff Pattern Check
    cutoff_flags = run_cutoff_pattern_check(record)
    for f in cutoff_flags:
        if f not in anomaly_flags:
            anomaly_flags.append(f)

    # Save final flag state & update status if flagged
    with transaction.atomic():
        record.anomaly_flags = anomaly_flags
        if anomaly_flags and record.status == AttendanceRecord.StatusChoices.PENDING:
            record.status = AttendanceRecord.StatusChoices.FLAGGED
        record.save()

    # Send Push Notification to admins on anomaly detection
    if anomaly_flags:
        from fieldmark.notifications.fcm import send_push_notification
        
        # Query all admins
        admins = Worker.objects.filter(is_superuser=True, fcm_token__isnull=False)
        for admin in admins:
            send_push_notification(
                token=admin.fcm_token,
                title="Anomaly Detected",
                body=f"Worker {record.worker.name} flagged with: {', '.join(anomaly_flags)}",
                data={'type': 'ANOMALY_ALERT', 'record_id': str(record.id)},
                lang=admin.preferred_language
            )

    return True


@shared_task
def weekly_storage_cleanup():
    """
    Weekly Celery task to delete verified attendance photos older than 7 days 
    to preserve storage capacity on Oracle Cloud Free Tier.
    """
    from datetime import timedelta
    import os
    from django.conf import settings
    
    seven_days_ago = timezone.now() - timedelta(days=7)
    old_records = AttendanceRecord.objects.filter(marked_at__lt=seven_days_ago)
    
    deleted_files_count = 0
    for record in old_records:
        if record.photo_url:
            # If stored locally in media directory
            file_path = os.path.join(settings.MEDIA_ROOT, record.photo_url)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    deleted_files_count += 1
                except Exception as e:
                    print(f"Failed to remove file {file_path}: {e}")
            record.photo_url = "deleted_weekly_cleanup"
            record.save()
            
    print(f"Weekly storage cleanup completed: Purged photos for {old_records.count()} records ({deleted_files_count} files removed).")
    return deleted_files_count
