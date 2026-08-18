from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

try:
    import pytz
    ist_tz = pytz.timezone('Asia/Kolkata')
except ImportError:
    from zoneinfo import ZoneInfo
    ist_tz = ZoneInfo('Asia/Kolkata')

from fieldmark.workers.models import Worker, Zone
from fieldmark.notifications.fcm import send_push_notification
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer
from .tasks import run_attendance_async_checks

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all().order_by('-marked_at')
    serializer_class = AttendanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Role-based restriction: Workers only see their own attendance
        if user.is_superuser:
            pass
        elif hasattr(user, 'is_staff') and user.is_staff:
            # Supervisors see records of workers in their zone
            if user.assigned_zone:
                queryset = queryset.filter(worker__assigned_zone=user.assigned_zone)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(worker=user)

        # Filters
        date_param = self.request.query_params.get('date')
        zone_param = self.request.query_params.get('zone')
        status_param = self.request.query_params.get('status')
        search_param = self.request.query_params.get('search')
        type_param = self.request.query_params.get('type')
        flags_param = self.request.query_params.get('flags')

        if date_param:
            queryset = queryset.filter(date=date_param)
        if zone_param:
            queryset = queryset.filter(worker__assigned_zone_id=zone_param)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if type_param:
            queryset = queryset.filter(worker__worker_type=type_param)
        if search_param:
            queryset = queryset.filter(
                Q(worker__name__icontains=search_param) | 
                Q(worker__employee_id__icontains=search_param)
            )
        if flags_param:
            if flags_param.lower() in ['true', 'yes', '1']:
                # Filter records that have non-empty anomaly_flags list
                # In PostgreSQL, we can check if length of JSON list is > 0, 
                # or in Django JSONField, check if not equals empty list.
                queryset = queryset.exclude(anomaly_flags=[])
            else:
                # Filter specific flag code in list (e.g. EXIF_MISMATCH)
                queryset = queryset.filter(anomaly_flags__contains=flags_param)

        return queryset

    def perform_create(self, serializer):
        record = serializer.save()
        # Trigger Celery checks asynchronously if broker is available
        try:
            run_attendance_async_checks.delay(record.id)
        except Exception as e:
            print(f"Async checks dispatch skipped: {e}")

    @action(detail=False, methods=['get'], url_path='me')
    def my_attendance(self, request):
        """Worker's query for their own attendance history."""
        user = request.user
        queryset = AttendanceRecord.objects.filter(worker=user).order_by('-date')

        month = request.query_params.get('month') # YYYY-MM format
        if month:
            try:
                year, m = map(int, month.split('-'))
                queryset = queryset.filter(date__year=year, date__month=m)
            except ValueError:
                return Response({'error': 'Invalid month format, use YYYY-MM'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-photos')
    def my_photos(self, request):
        """Returns worker's verified photos history."""
        user = request.user
        records = AttendanceRecord.objects.filter(
            worker=user,
            photo_url__isnull=False
        ).exclude(photo_url='').exclude(photo_url='deleted_weekly_cleanup').order_by('-marked_at')
        
        photos = []
        for r in records:
            url = str(r.photo_url)
            if not (url.startswith('http://') or url.startswith('https://') or url.startswith('data:')):
                if not url.startswith('/media/'):
                    url = f"/media/{url}" if not url.startswith('/') else f"/media{url}"
                url = request.build_absolute_uri(url)

            photos.append({
                'id': r.id,
                'date': r.date.strftime('%Y-%m-%d'),
                'marked_at': r.marked_at.strftime('%Y-%m-%d %H:%M'),
                'photo_url': url,
                'status': r.status,
                'latitude': r.latitude,
                'longitude': r.longitude
            })
        return Response(photos, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='verify')
    def verify(self, request, pk=None):
        """Admin or Supervisor verifies a pending/flagged record."""
        record = self.get_object()
        user = request.user

        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action') # 'approve' | 'reject'
        rejection_note = request.data.get('rejection_note', '')

        if action_type not in ['approve', 'reject']:
            return Response({'error': 'Invalid action. Must be approve or reject'}, status=status.HTTP_400_BAD_REQUEST)

        # Cache before state for audit log
        before_state = {
            'status': record.status,
            'verified_by': record.verified_by_id,
            'verified_at': str(record.verified_at) if record.verified_at else None,
            'rejection_note': record.rejection_note
        }

        with transaction.atomic():
            if action_type == 'approve':
                record.status = AttendanceRecord.StatusChoices.APPROVED
                record.rejection_note = None
            else:
                record.status = AttendanceRecord.StatusChoices.REJECTED
                record.rejection_note = rejection_note

            record.verified_by = user
            record.verified_at = timezone.now()
            record.save()

            # Write Audit Log
            from fieldmark.audit.models import AuditLog
            after_state = {
                'status': record.status,
                'verified_by': record.verified_by_id,
                'verified_at': str(record.verified_at),
                'rejection_note': record.rejection_note
            }
            
            AuditLog.objects.create(
                action_by=user,
                action=f"VERIFY_{action_type.upper()}",
                target_model="AttendanceRecord",
                target_id=record.id,
                before_state=before_state,
                after_state=after_state,
                ip_address=request.META.get('REMOTE_ADDR')
            )

        # Notify worker
        worker = record.worker
        if worker.fcm_token:
            if action_type == 'approve':
                title = "Attendance Approved"
                body = f"Your attendance for {record.date.strftime('%d-%b-%Y')} is approved ✓"
            else:
                title = "Attendance Rejected"
                body = f"Attendance for {record.date.strftime('%d-%b-%Y')} not approved: {rejection_note}"
            
            send_push_notification(
                token=worker.fcm_token,
                title=title,
                body=body,
                data={'type': 'ATTENDANCE_STATUS', 'record_id': str(record.id)},
                lang=worker.preferred_language
            )

        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='today')
    def today_attendance(self, request):
        """Fetch today's attendance record for the authenticated worker based on IST date."""
        user = request.user
        today_ist = timezone.now().astimezone(ist_tz).date()
        record = AttendanceRecord.objects.filter(
            worker=user,
            date=today_ist
        ).first()

        if not record:
            return Response({'today_record': None}, status=status.HTTP_200_OK)

        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='checkout')
    def checkout(self, request):
        """Check out the authenticated worker from today's attendance record (IST date)."""
        user = request.user
        today_ist = timezone.now().astimezone(ist_tz).date()

        record = AttendanceRecord.objects.filter(
            worker=user,
            date=today_ist
        ).first()

        if not record:
            return Response(
                {'error': 'No attendance record found for today.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if record.check_out_at:
            return Response(
                {
                    'error': 'attendance_completed_today',
                    'message': 'Attendance is already completed for today.',
                    'check_out_at': record.check_out_at
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        record.check_out_at = timezone.now()
        record.save(update_fields=['check_out_at'])

        return Response(
            AttendanceRecordSerializer(record).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post', 'patch'], url_path='verify')
    def verify(self, request, pk=None):
        """Admin verifies record with approve or reject action."""
        record = self.get_object()
        user = request.user
        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        act = request.data.get('action', 'approve')
        if act == 'approve':
            record.status = AttendanceRecord.StatusChoices.APPROVED
            record.rejection_note = None
        elif act == 'reject':
            record.status = AttendanceRecord.StatusChoices.REJECTED
            record.rejection_note = request.data.get('rejection_note', 'Rejected by administrator')
        else:
            return Response({'error': 'invalid_action', 'message': 'Action must be approve or reject'}, status=status.HTTP_400_BAD_REQUEST)

        record.verified_by = user
        record.verified_at = timezone.now()
        record.save()
        return Response(AttendanceRecordSerializer(record, context={'request': request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Admin approves record."""
        record = self.get_object()
        user = request.user
        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        record.status = AttendanceRecord.StatusChoices.APPROVED
        record.rejection_note = None
        record.verified_by = user
        record.verified_at = timezone.now()
        record.save()
        return Response(AttendanceRecordSerializer(record, context={'request': request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Admin rejects record."""
        record = self.get_object()
        user = request.user
        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        rejection_note = request.data.get('rejection_note', 'Rejected by admin')
        record.status = AttendanceRecord.StatusChoices.REJECTED
        record.rejection_note = rejection_note
        record.verified_by = user
        record.verified_at = timezone.now()
        record.save()
        return Response(AttendanceRecordSerializer(record, context={'request': request}).data, status=status.HTTP_200_OK)
    @action(detail=False, methods=['post'], url_path='bulk-approve')
    def bulk_approve(self, request):
        """Bulk approves all eligible records."""
        user = request.user
        if not user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Eligibility criteria: GPS matched + in window + no anomaly flags + status PENDING
        eligible_records = AttendanceRecord.objects.filter(
            status=AttendanceRecord.StatusChoices.PENDING,
            gps_match=AttendanceRecord.GPSMatchChoices.MATCHED,
            anomaly_flags=[]
        )

        count = eligible_records.count()
        if count == 0:
            return Response({'approved_count': 0, 'message': 'No eligible records found for bulk approval'}, status=status.HTTP_200_OK)

        record_ids = list(eligible_records.values_list('id', flat=True))
        
        with transaction.atomic():
            # Update all eligible records to APPROVED
            eligible_records.update(
                status=AttendanceRecord.StatusChoices.APPROVED,
                verified_by=user,
                verified_at=timezone.now()
            )

            # Audit logging
            from fieldmark.audit.models import AuditLog
            AuditLog.objects.create(
                action_by=user,
                action="BULK_APPROVE",
                target_model="AttendanceRecord",
                target_id=None,
                before_state={'pending_ids': record_ids},
                after_state={'status': 'APPROVED', 'count': count},
                ip_address=request.META.get('REMOTE_ADDR')
            )

        # Notify workers in background/thread (or just loop since FCM handles it)
        # Fetch workers involved to notify them
        records_updated = AttendanceRecord.objects.filter(id__in=record_ids).select_related('worker')
        for r in records_updated:
            if r.worker.fcm_token:
                send_push_notification(
                    token=r.worker.fcm_token,
                    title="Attendance Approved",
                    body=f"Your attendance for {r.date.strftime('%d-%b-%Y')} is approved ✓",
                    data={'type': 'ATTENDANCE_STATUS', 'record_id': str(r.id)},
                    lang=r.worker.preferred_language
                )

        return Response({'approved_count': count, 'message': f'Successfully approved {count} records'}, status=status.HTTP_200_OK)

