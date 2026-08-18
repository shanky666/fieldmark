from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from fieldmark.notifications.fcm import send_push_notification
from .models import LeaveRequest, LeaveBalance
from .serializers import LeaveRequestSerializer, LeaveBalanceSerializer

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-created_at')
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(worker=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Role-based restriction: Workers only see their own leave requests
        if user.is_superuser:
            pass
        elif hasattr(user, 'is_staff') and user.is_staff:
            # Supervisors see leaves of workers in their zone
            if user.assigned_zone:
                queryset = queryset.filter(worker__assigned_zone=user.assigned_zone)
            else:
                queryset = queryset.none()
        else:
            queryset = queryset.filter(worker=user)

        return queryset

    @action(detail=False, methods=['get'], url_path='me')
    def my_leaves(self, request):
        user = request.user
        queryset = LeaveRequest.objects.filter(worker=user).order_by('-start_date')
        
        year_param = request.query_params.get('year')
        if year_param:
            try:
                year = int(year_param)
                queryset = queryset.filter(start_date__year=year)
            except ValueError:
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='balance/me')
    def my_balance(self, request):
        user = request.user
        current_year = timezone.now().year
        
        # Automatically get or create leave balance for current year
        balance, created = LeaveBalance.objects.get_or_create(
            worker=user,
            year=current_year,
            defaults={
                'casual_total': 12,
                'casual_used': 0,
                'sick_total': 6,
                'sick_used': 0
            }
        )
        
        serializer = LeaveBalanceSerializer(balance)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='review')
    def review(self, request, pk=None):
        leave = self.get_object()
        user = request.user

        # Check permissions: Admin only
        if not user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        action_type = request.data.get('action') # 'approve' | 'reject'
        rejection_note = request.data.get('rejection_note', '')

        if action_type not in ['approve', 'reject']:
            return Response({'error': 'Invalid action. Must be approve or reject'}, status=status.HTTP_400_BAD_REQUEST)

        before_state = {
            'status': leave.status,
            'approved_by': leave.approved_by_id,
            'approved_at': str(leave.approved_at) if leave.approved_at else None,
            'rejection_note': leave.rejection_note
        }

        with transaction.atomic():
            if action_type == 'approve':
                leave.status = LeaveRequest.StatusChoices.APPROVED
                leave.rejection_note = None
                
                # Calculate number of days taken
                num_days = (leave.end_date - leave.start_date).days + 1
                
                # Fetch/Create balance for the request start year
                balance, _ = LeaveBalance.objects.get_or_create(
                    worker=leave.worker,
                    year=leave.start_date.year,
                    defaults={'casual_total': 12, 'sick_total': 6}
                )
                
                # Update used balances accordingly
                if leave.leave_type == LeaveRequest.LeaveTypeChoices.CASUAL:
                    balance.casual_used += num_days
                elif leave.leave_type == LeaveRequest.LeaveTypeChoices.SICK:
                    balance.sick_used += num_days
                
                balance.save()
            else:
                leave.status = LeaveRequest.StatusChoices.REJECTED
                leave.rejection_note = rejection_note

            leave.approved_by = user
            leave.approved_at = timezone.now()
            leave.save()

            # Write Audit Log
            from fieldmark.audit.models import AuditLog
            after_state = {
                'status': leave.status,
                'approved_by': leave.approved_by_id,
                'approved_at': str(leave.approved_at),
                'rejection_note': leave.rejection_note
            }
            
            AuditLog.objects.create(
                action_by=user,
                action=f"REVIEW_LEAVE_{action_type.upper()}",
                target_model="LeaveRequest",
                target_id=leave.id,
                before_state=before_state,
                after_state=after_state,
                ip_address=request.META.get('REMOTE_ADDR')
            )

        # Notify worker
        worker = leave.worker
        if worker.fcm_token:
            date_range = f"{leave.start_date.strftime('%d-%b')} to {leave.end_date.strftime('%d-%b')}"
            send_push_notification(
                token=worker.fcm_token,
                title="Leave Request Reviewed",
                body=f"Leave request ({date_range}): {leave.status}",
                data={'type': 'LEAVE_STATUS', 'leave_id': str(leave.id)},
                lang=worker.preferred_language
            )

        return Response(LeaveRequestSerializer(leave).data, status=status.HTTP_200_OK)
