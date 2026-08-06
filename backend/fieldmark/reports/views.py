import calendar
from datetime import date
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from fieldmark.workers.models import Worker
from fieldmark.attendance.models import AttendanceRecord
from fieldmark.leave.models import LeaveRequest
from .payroll import generate_payroll_excel
from .muster_roll import generate_muster_roll_pdf
from .heatmap import (
    get_reports_heatmap_data, get_hourly_submission_distribution,
    get_late_marking_trends
)

class MonthlySummaryReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Returns JSON summary of worker attendance stats for table rendering."""
        if not (request.user.is_superuser or request.user.is_staff):
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        month_str = request.query_params.get('month') # 'YYYY-MM'
        zone_id = request.query_params.get('zone')
        worker_type = request.query_params.get('type')

        try:
            year, month = map(int, month_str.split('-'))
        except (ValueError, AttributeError):
            today = date.today()
            year, month = today.year, today.month

        num_days = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)

        total_working_days = 0
        for day in range(1, num_days + 1):
            if date(year, month, day).weekday() != 6:
                total_working_days += 1

        workers = Worker.objects.filter(is_superuser=False)
        if zone_id:
            workers = workers.filter(assigned_zone_id=zone_id)
        if worker_type:
            workers = workers.filter(worker_type=worker_type)

        if hasattr(request.user, 'is_staff') and not request.user.is_superuser:
            # Supervisor scope filter
            if request.user.assigned_zone:
                workers = workers.filter(assigned_zone=request.user.assigned_zone)
            else:
                workers = workers.none()

        workers_stats = []
        for worker in workers:
            present = AttendanceRecord.objects.filter(
                worker=worker,
                date__range=[start_date, end_date],
                status=AttendanceRecord.StatusChoices.APPROVED
            ).count()

            leave_days = 0
            leaves = LeaveRequest.objects.filter(
                worker=worker,
                status=LeaveRequest.StatusChoices.APPROVED,
                start_date__lte=end_date,
                end_date__gte=start_date
            )
            for l in leaves:
                l_start = max(l.start_date, start_date)
                l_end = min(l.end_date, end_date)
                leave_days += (l_end - l_start).days + 1

            absent = max(0, total_working_days - present - leave_days)

            workers_stats.append({
                'worker_id': worker.id,
                'employee_id': worker.employee_id,
                'name': worker.name,
                'zone_name': worker.assigned_zone.name if worker.assigned_zone else 'N/A',
                'worker_type': worker.worker_type,
                'present_days': present,
                'absent_days': absent,
                'leave_days': leave_days,
                'working_days': total_working_days,
                'attendance_pct': round((present / total_working_days) * 100, 1) if total_working_days > 0 else 0
            })

        return Response({
            'month': month_str,
            'working_days': total_working_days,
            'stats': workers_stats
        }, status=status.HTTP_200_OK)


class PayrollReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        month = request.query_params.get('month')
        if not month:
            return Response({'error': 'month parameter is required (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)

        return generate_payroll_excel(month)


class ComplianceReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        month = request.query_params.get('month')
        if not month:
            return Response({'error': 'month parameter is required (YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)

        return generate_muster_roll_pdf(month)


class HeatmapReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        # Default months lookback = 3
        months = request.query_params.get('months', '3')
        try:
            months_count = int(months)
        except ValueError:
            months_count = 3

        heatmap_data = get_reports_heatmap_data(months_count)
        hourly_data = get_hourly_submission_distribution()
        late_trends = get_late_marking_trends()

        return Response({
            'heatmap': heatmap_data,
            'hourly_chart': hourly_data,
            'late_trends': late_trends
        }, status=status.HTTP_200_OK)
