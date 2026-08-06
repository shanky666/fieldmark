from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from fieldmark.workers.models import Worker, Zone
from fieldmark.attendance.models import AttendanceRecord
from fieldmark.notifications.fcm import send_push_notification
from .models import CorrectionRequest
from .serializers import CorrectionRequestSerializer

class CorrectionRequestViewSet(viewsets.ModelViewSet):
    queryset = CorrectionRequest.objects.all().order_by('-created_at')
    serializer_class = CorrectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Role-based restriction: Workers only see their own correction requests
        if user.is_superuser:
            pass
        elif hasattr(user, 'is_staff') and user.is_staff:
            # Supervisors see corrections of workers in their zone
            if user.assigned_zone:
                queryset = queryset.filter(worker__assigned_zone=user.assigned_zone)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(worker=user)

        # Filters for admin view
        status_param = self.request.query_params.get('status')
        zone_param = self.request.query_params.get('zone')
        date_param = self.request.query_params.get('date')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if zone_param:
            queryset = queryset.filter(worker__assigned_zone_id=zone_param)
        if date_param:
            queryset = queryset.filter(date=date_param)

        return queryset

    @action(detail=False, methods=['get'], url_path='me')
    def my_corrections(self, request):
        user = request.user
        queryset = CorrectionRequest.objects.filter(worker=user).order_by('-date')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='review')
    def review(self, request, pk=None):
        correction = self.get_object()
        user = request.user

        # Check permissions: Admin only
        if not user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action') # 'approve' | 'reject'
        rejection_note = request.data.get('rejection_note', '')

        if action_type not in ['approve', 'reject']:
            return Response({'error': 'Invalid action. Must be approve or reject'}, status=status.HTTP_400_BAD_REQUEST)

        before_state = {
            'status': correction.status,
            'reviewed_by': correction.reviewed_by_id,
            'reviewed_at': str(correction.reviewed_at) if correction.reviewed_at else None,
            'rejection_note': correction.rejection_note
        }

        with transaction.atomic():
            if action_type == 'approve':
                correction.status = CorrectionRequest.StatusChoices.APPROVED
                correction.rejection_note = None
                
                # Fetch shift & zone details for default values
                worker = correction.worker
                zone = worker.assigned_zone
                shift = worker.shift or (zone.shift if zone else None)
                
                # Default coordinates to zone center or 0.0 if zone is missing
                lat = zone.center_lat if zone else 12.9716
                lng = zone.center_lng if zone else 77.5946
                
                # Default marked_at time to shift start or 6:00 AM
                start_time = shift.window_start if shift else timezone.datetime.time(6, 0)
                marked_dt = timezone.make_aware(
                    timezone.datetime.combine(correction.date, start_time)
                )

                # Get or create AttendanceRecord for this worker & date
                attendance, created = AttendanceRecord.objects.get_or_create(
                    worker=worker,
                    date=correction.date,
                    defaults={
                        'latitude': lat,
                        'longitude': lng,
                        'photo_url': 'corrections/approved_placeholder.png',
                        'device_id': 'CORRECTION_OVERRIDE',
                        'marked_at': marked_dt,
                        'gps_match': AttendanceRecord.GPSMatchChoices.MATCHED,
                        'status': AttendanceRecord.StatusChoices.APPROVED,
                        'verified_by': user,
                        'verified_at': timezone.now()
                    }
                )
                
                # If record existed (e.g. was rejected or flagged), force approve it
                if not created:
                    attendance.status = AttendanceRecord.StatusChoices.APPROVED
                    attendance.verified_by = user
                    attendance.verified_at = timezone.now()
                    attendance.save()

            else:
                correction.status = CorrectionRequest.StatusChoices.REJECTED
                correction.rejection_note = rejection_note

            correction.reviewed_by = user
            correction.reviewed_at = timezone.now()
            correction.save()

            # Write Audit Log entry
            from fieldmark.audit.models import AuditLog
            after_state = {
                'status': correction.status,
                'reviewed_by': correction.reviewed_by_id,
                'reviewed_at': str(correction.reviewed_at),
                'rejection_note': correction.rejection_note
            }
            
            AuditLog.objects.create(
                action_by=user,
                action=f"REVIEW_CORRECTION_{action_type.upper()}",
                target_model="CorrectionRequest",
                target_id=correction.id,
                before_state=before_state,
                after_state=after_state,
                ip_address=request.META.get('REMOTE_ADDR')
            )

        # Send push notification to worker
        worker = correction.worker
        if worker.fcm_token:
            send_push_notification(
                token=worker.fcm_token,
                title="Correction Request Reviewed",
                body=f"Correction request for {correction.date.strftime('%d-%b-%Y')}: {correction.status}",
                data={'type': 'CORRECTION_STATUS', 'correction_id': str(correction.id)},
                lang=worker.preferred_language
            )

        return Response(CorrectionRequestSerializer(correction).data, status=status.HTTP_200_OK)
