import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.db.models import Q
from .models import AttendanceRecord

class AttendancePDFReportView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Unauthorized', 'message': 'Only Admins can download PDF reports.'}, status=status.HTTP_403_FORBIDDEN)

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
            # Handle zone name or ID
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

        # Generate PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Attendance_Report.pdf"'

        doc = SimpleDocTemplate(response, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
        elements = []

        styles = getSampleStyleSheet()
        title = Paragraph("FieldMark Attendance History Report", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # Build Table Data
        data = [[
            "Name", "ID", "Role", "Zone", "Date", "Check-in", "Check-out", "Duration", "Status", "Verification"
        ]]

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

            data.append([
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

        # Table Styling
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2F8F5B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'), # Left align name
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#DCEEE2')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3FAF5')])
        ]))

        elements.append(table)
        doc.build(elements)

        return response
