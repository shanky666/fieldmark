from datetime import datetime
try:
    import pytz
    ist_tz = pytz.timezone('Asia/Kolkata')
except ImportError:
    from zoneinfo import ZoneInfo
    ist_tz = ZoneInfo('Asia/Kolkata')
from django.utils import timezone
from rest_framework import serializers
from fieldmark.workers.models import Worker, Zone, Shift
from fieldmark.workers.serializers import WorkerSerializer
from .models import AttendanceRecord
from .anomaly_checks import check_sync_gps_zone

class AttendanceRecordSerializer(serializers.ModelSerializer):
    worker_detail = WorkerSerializer(source='worker', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'worker', 'worker_detail', 'date', 'marked_at', 
            'latitude', 'longitude', 'photo_url', 'photo_hash', 
            'photo_exif_lat', 'photo_exif_lng', 'exif_gps_delta_meters', 
            'device_id', 'gps_match', 'status', 'verified_by', 
            'verified_by_name', 'verified_at', 'rejection_note', 
            'is_offline_submission', 'offline_queued_at', 'anomaly_flags'
        ]
        read_only_fields = [
            'id', 'gps_match', 'status', 'photo_hash', 'photo_exif_lat', 
            'photo_exif_lng', 'exif_gps_delta_meters', 'verified_by', 
            'verified_at', 'anomaly_flags'
        ]

    def validate(self, data):
        # The request context contains the authenticated user
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context missing")

        user = request.user
        data['worker'] = user

        # 1. Parse date from marked_at in IST
        marked_at = data.get('marked_at', timezone.now())
        marked_at_ist = marked_at.astimezone(ist_tz)
        
        # Populate date field from IST marked_at (prevents UTC timezone offsets shifting date)
        data['date'] = marked_at_ist.date()

        # 2. Duplicate Check: check if already submitted today (status != REJECTED)
        duplicate_check = AttendanceRecord.objects.filter(
            worker=user,
            date=data['date']
        ).exclude(status=AttendanceRecord.StatusChoices.REJECTED)
        
        if duplicate_check.exists():
            raise serializers.ValidationError({
                'error': 'already_marked_today',
                'existing_id': duplicate_check.first().id
            })

        return data

    def create(self, validated_data):
        # Instantiating the attendance record
        record = AttendanceRecord(**validated_data)

        # 4. Synchronous GPS Zone Check
        gps_match, sync_flags = check_sync_gps_zone(record)
        record.gps_match = gps_match
        record.anomaly_flags = sync_flags

        record.save()
        return record
