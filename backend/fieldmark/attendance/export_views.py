import csv
import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.db.models import Q
from .models import AttendanceRecord

class AttendanceCSVReportView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Unauthorized', 'message': 'Only Admins can download CSV reports.'}, status=status.HTTP_403_FORBIDDEN)

        role = request.query_params.get('role', 'All')
        worker_id = request.query_params.get('worker_id')
        zone_id = request.query_params.get('zone')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        queryset = AttendanceRecord.objects.all().select_related('worker', 'worker__assigned_zone').order_by('-date', '-check_in_at')

        if role == 'Employee':
            queryset = queryset.filter(worker__is_staff=False, worker__is_superuser=False)
        elif role == 'Supervisor':
            queryset = queryset.filter(worker__is_staff=True, worker__is_superuser=False)

        if worker_id:
            queryset = queryset.filter(worker_id=worker_id)
            
        if zone_id:
            if zone_id.isdigit():
                queryset = queryset.filter(worker__assigned_zone_id=zone_id)
            else:
                queryset = queryset.filter(worker__assigned_zone__name__icontains=zone_id)

        if start_date_str:
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_date_str:
            try:
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="Attendance_History.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Name", "ID", "Role", "Zone", "Date", "Check-in", "Check-out", "Duration", "Status", "Verification"
        ])

        for record in queryset:
            w = record.worker
            role_text = "Supervisor" if w.is_staff else "Employee"
            zone_text = w.assigned_zone.name if w.assigned_zone else "Unassigned"
            
            check_in = record.check_in_at.strftime('%H:%M:%S') if record.check_in_at else "N/A"
            
            if record.check_out_at:
                check_out = record.check_out_at.strftime('%H:%M:%S')
                duration = record.duration_formatted or "0h 0m"
            else:
                check_out = "Still checked in"
                duration = "-"
                
            status_text = record.get_status_display()
            verification_text = record.get_verification_status_display()

            writer.writerow([
                w.name,
                w.employee_id or "N/A",
                role_text,
                zone_text,
                record.date.strftime('%Y-%m-%d'),
                check_in,
                check_out,
                duration,
                status_text,
                verification_text
            ])

        return response
