from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import date
from .models import Shift, Zone, Worker, ZoneReassignmentHistory
from .serializers import (
    ShiftSerializer, ZoneSerializer, WorkerSerializer, 
    ZoneReassignmentHistorySerializer
)

class ShiftViewSet(viewsets.ModelModelViewSet if hasattr(viewsets, 'ModelModelViewSet') else viewsets.ModelViewSet):
    queryset = Shift.objects.all().order_by('name')
    serializer_class = ShiftSerializer
    permission_classes = [permissions.IsAuthenticated]


class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all().order_by('name')
    serializer_class = ZoneSerializer
    permission_classes = [permissions.IsAuthenticated]


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all().order_by('name')
    serializer_class = WorkerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Role-based restriction: Supervisors can only query/view workers in their zones
        if user.is_superuser:
            pass
        elif hasattr(user, 'is_staff') and user.is_staff:
            # Let's say supervisor is assigned to zones they supervise.
            # In our system, the supervisor's assigned_zone defines which zone they manage, or they manage workers in their assigned zone.
            if user.assigned_zone:
                queryset = queryset.filter(assigned_zone=user.assigned_zone)
            else:
                queryset = queryset.none()
        else:
            # Workers can only view themselves
            queryset = queryset.filter(id=user.id)

        # Filters
        zone = self.request.query_params.get('zone')
        w_type = self.request.query_params.get('type')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if zone:
            queryset = queryset.filter(assigned_zone_id=zone)
        if w_type:
            queryset = queryset.filter(worker_type=w_type)
        if status_param:
            is_active = status_param.lower() == 'active'
            queryset = queryset.filter(is_active=is_active)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(phone__icontains=search) | 
                Q(employee_id__icontains=search)
            )

        return queryset

    def perform_update(self, serializer):
        # Handle implicit zone reassignment during standard PATCH update
        instance = self.get_object()
        new_zone = serializer.validated_data.get('assigned_zone')
        
        # If zone is changing and not via custom endpoint, create history with default reason
        if 'assigned_zone' in serializer.validated_data and instance.assigned_zone != new_zone:
            with transaction.atomic():
                ZoneReassignmentHistory.objects.create(
                    worker=instance,
                    from_zone=instance.assigned_zone,
                    to_zone=new_zone,
                    reassigned_by=self.request.user,
                    reason="Updated via worker profile update"
                )
                serializer.save()
        else:
            serializer.save()

    @action(detail=True, methods=['post'], url_path='reassign-zone')
    def reassign_zone(self, request, pk=None):
        worker = self.get_object()
        to_zone_id = request.data.get('to_zone_id')
        reason = request.data.get('reason', 'No reason provided')

        if not to_zone_id:
            return Response({'error': 'to_zone_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        to_zone = get_object_or_404(Zone, id=to_zone_id)
        from_zone = worker.assigned_zone

        if from_zone == to_zone:
            return Response({'message': 'Worker is already in this zone'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            ZoneReassignmentHistory.objects.create(
                worker=worker,
                from_zone=from_zone,
                to_zone=to_zone,
                reassigned_by=request.user,
                reason=reason
            )
            worker.assigned_zone = to_zone
            worker.save()

        return Response(WorkerSerializer(worker).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='zone-history')
    def zone_history(self, request, pk=None):
        worker = self.get_object()
        history = ZoneReassignmentHistory.objects.filter(worker=worker).order_by('-reassigned_at')
        serializer = ZoneReassignmentHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        worker = self.get_object()
        from fieldmark.attendance.models import AttendanceRecord
        from fieldmark.leave.models import LeaveRequest
        
        today = date.today()
        first_day_of_month = today.replace(day=1)
        
        # Calculate monthly stats
        present_count = AttendanceRecord.objects.filter(
            worker=worker, 
            date__gte=first_day_of_month,
            status='APPROVED'
        ).count()
        
        pending_count = AttendanceRecord.objects.filter(
            worker=worker, 
            date__gte=first_day_of_month,
            status='PENDING'
        ).count()

        rejected_count = AttendanceRecord.objects.filter(
            worker=worker, 
            date__gte=first_day_of_month,
            status='REJECTED'
        ).count()

        # Simple absence counts: difference between days in month and records
        # Approved Leave counts
        leave_days = 0
        leaves = LeaveRequest.objects.filter(
            worker=worker,
            status='APPROVED',
            start_date__lte=today,
            end_date__gte=first_day_of_month
        )
        for l in leaves:
            start = max(l.start_date, first_day_of_month)
            end = min(l.end_date, today)
            leave_days += (end - start).days + 1

        total_working_days = (today - first_day_of_month).days + 1
        # subtract Sundays (crude approximation)
        sundays = sum(1 for i in range(total_working_days) if (first_day_of_month.weekday() + i) % 7 == 6)
        net_working_days = max(1, total_working_days - sundays)
        
        absent_count = max(0, net_working_days - present_count - leave_days)

        approval_rate = 0.0
        total_marked = present_count + rejected_count
        if total_marked > 0:
            approval_rate = round((present_count / total_marked) * 100, 1)

        return Response({
            'days_present': present_count,
            'days_pending': pending_count,
            'days_absent': absent_count,
            'leave_days': leave_days,
            'approval_rate_pct': approval_rate
        })

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        worker = request.user
        serializer = self.get_serializer(worker)
        data = serializer.data
        data['zone_detail'] = {
            'id': worker.assigned_zone.id,
            'name': worker.assigned_zone.name,
            'center_lat': worker.assigned_zone.center_lat,
            'center_lng': worker.assigned_zone.center_lng,
            'radius_meters': worker.assigned_zone.radius_meters,
            'color_hex': worker.assigned_zone.color_hex
        } if worker.assigned_zone else None

        data['shift_detail'] = {
            'id': worker.shift.id,
            'name': worker.shift.name,
            'window_start': worker.shift.window_start.strftime('%H:%M:%S') if worker.shift and worker.shift.window_start else None,
            'window_end': worker.shift.window_end.strftime('%H:%M:%S') if worker.shift and worker.shift.window_end else None,
        } if worker.shift else None

        return Response(data)

    @action(detail=False, methods=['get'], url_path='supervisor-dashboard')
    def supervisor_dashboard(self, request):
        user = request.user
        if not (user.is_superuser or user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        zone = user.assigned_zone
        if not zone:
            return Response({'error': 'no assigned zone'}, status=status.HTTP_400_BAD_REQUEST)

        from fieldmark.attendance.models import AttendanceRecord
        from fieldmark.rounds.models import FieldRound
        from django.utils import timezone
        
        try:
            import pytz
            ist_tz = pytz.timezone('Asia/Kolkata')
        except ImportError:
            from zoneinfo import ZoneInfo
            ist_tz = ZoneInfo('Asia/Kolkata')

        today_ist = timezone.now().astimezone(ist_tz).date()

        assigned_workers = Worker.objects.filter(assigned_zone=zone, is_active=True)
        total_assigned = assigned_workers.count()

        today_attendance = AttendanceRecord.objects.filter(worker__assigned_zone=zone, date=today_ist)
        checked_in = today_attendance.filter(check_out_at__isnull=True).count()
        checked_out = today_attendance.filter(check_out_at__isnull=False).count()
        not_checked_in = total_assigned - (checked_in + checked_out)
        
        active_logs = FieldRound.objects.filter(zone=zone, status='OPEN').count()
        
        recent_activity = FieldRound.objects.filter(zone=zone).order_by('-visited_at')[:5]
        from fieldmark.rounds.serializers import FieldRoundSerializer
        recent_activity_data = FieldRoundSerializer(recent_activity, many=True, context={'request': request}).data

        return Response({
            'total_assigned': total_assigned,
            'checked_in': checked_in,
            'checked_out': checked_out,
            'not_checked_in': not_checked_in,
            'active_logs': active_logs,
            'recent_activity': recent_activity_data
        })
