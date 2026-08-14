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
    worker = serializers.PrimaryKeyRelatedField(read_only=True)
    worker_detail = WorkerSerializer(source='worker', read_only=True)
    worker_name = serializers.CharField(source='worker.name', read_only=True)
    worker_employee_id = serializers.CharField(source='worker.employee_id', read_only=True)
    zone_name = serializers.CharField(source='worker.assigned_zone.name', default='Assigned Zone', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)
    duration_formatted = serializers.CharField(read_only=True)
    liveness_passed = serializers.BooleanField(read_only=True)
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'worker', 'worker_detail', 'worker_name', 'worker_employee_id', 'zone_name',
            'date', 'marked_at', 'check_out_at', 'duration_seconds', 'duration_formatted',
            'latitude', 'longitude', 'photo_url', 'photo_hash', 
            'photo_exif_lat', 'photo_exif_lng', 'exif_gps_delta_meters', 
            'device_id', 'gps_match', 'status', 'liveness_passed', 'verified_by', 
            'verified_by_name', 'verified_at', 'rejection_note', 
            'is_offline_submission', 'offline_queued_at', 'anomaly_flags'
        ]
        read_only_fields = [
            'id', 'gps_match', 'status', 'photo_hash', 'photo_exif_lat', 
            'photo_exif_lng', 'exif_gps_delta_meters', 'verified_by', 
            'verified_at', 'anomaly_flags', 'duration_seconds', 'duration_formatted', 'liveness_passed'
        ]

    def _should_use_https(self, url_str):
        from django.conf import settings
        if getattr(settings, 'DEBUG', True):
            return False
        import re
        if 'localhost' in url_str or '127.0.0.1' in url_str:
            return False
        if re.search(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url_str):
            return False
        return True

    def get_photo_url(self, obj):
        if not obj.photo_url:
            return None
        url = str(obj.photo_url)
        if url.startswith('http://') or url.startswith('https://') or url.startswith('data:'):
            if url.startswith('http://') and self._should_use_https(url):
                return url.replace('http://', 'https://', 1)
            return url
        
        # S3 / R2 Presigned GET URL handling for deployed environments
        from django.conf import settings
        if getattr(settings, 'AWS_ACCESS_KEY_ID', None) and getattr(settings, 'AWS_SECRET_ACCESS_KEY', None) and not settings.AWS_S3_ENDPOINT_URL.startswith("http://r2-endpoint-placeholder"):
            import boto3
            try:
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    config=boto3.session.Config(signature_version='s3v4')
                )
                res = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': settings.AWS_STORAGE_BUCKET_NAME, 'Key': url},
                    ExpiresIn=3600
                )
                if res.startswith('http://') and self._should_use_https(res):
                    return res.replace('http://', 'https://', 1)
                return res
            except Exception:
                pass
                
        # Local fallback
        relative_path = url
        if not relative_path.startswith('/media/'):
            if relative_path.startswith('/'):
                relative_path = f"/media{relative_path}"
            else:
                relative_path = f"/media/{relative_path}"

        request = self.context.get('request')
        if request:
            full_uri = request.build_absolute_uri(relative_path)
            if full_uri.startswith('http://') and self._should_use_https(full_uri):
                return full_uri.replace('http://', 'https://', 1)
            return full_uri
        return relative_path

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context missing")

        user = request.user
        data['worker'] = user

        # Process Base64 photo payloads directly into Render media storage
        photo_url_val = self.initial_data.get('photo_url') or data.get('photo_url')
        if photo_url_val and isinstance(photo_url_val, str):
            if photo_url_val.startswith('data:image'):
                import base64, uuid, os
                from django.conf import settings
                try:
                    header, encoded = photo_url_val.split(',', 1)
                    file_ext = 'jpg'
                    if 'png' in header:
                        file_ext = 'png'
                    elif 'webp' in header:
                        file_ext = 'webp'
                    
                    img_bytes = base64.b64decode(encoded)
                    filename = f"checkin_{uuid.uuid4().hex[:12]}.{file_ext}"
                    relative_path = f"attendance/{filename}"
                    target_path = os.path.join(settings.MEDIA_ROOT, 'attendance', filename)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    
                    with open(target_path, 'wb') as f:
                        f.write(img_bytes)
                    
                    data['photo_url'] = relative_path
                except Exception as exc:
                    print(f"Error decoding base64 image: {exc}")
            else:
                data['photo_url'] = photo_url_val

        # Always determine the attendance day from the server's IST date.
        # This prevents yesterday's attendance from blocking today's check-in.
        today_ist = timezone.now().astimezone(ist_tz).date()
        data['date'] = today_ist

        # Prevent duplicate check-in for THIS worker on THIS IST date.
        duplicate_check = AttendanceRecord.objects.filter(
            worker=user,
            date=today_ist
        ).exclude(
            status=AttendanceRecord.StatusChoices.REJECTED
        )

        if duplicate_check.exists():
            existing = duplicate_check.first()

            if existing.check_out_at:
                raise serializers.ValidationError({
                    'error': 'attendance_completed_today',
                    'message': 'Attendance is already completed for today.',
                    'existing_id': existing.id
                })

            raise serializers.ValidationError({
                'error': 'already_checked_in',
                'message': 'You are already checked in today. Please check out first.',
                'existing_id': existing.id
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





