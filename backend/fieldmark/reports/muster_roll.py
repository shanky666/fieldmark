import calendar
from datetime import date
from io import BytesIO
from django.http import HttpResponse

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from fieldmark.workers.models import Worker
from fieldmark.attendance.models import AttendanceRecord

def generate_muster_roll_pdf(month_str):
    """
    Generate Form 25 / Muster Roll PDF matching standard agricultural compliance.
    """
    try:
        year, month = map(int, month_str.split('-'))
    except (ValueError, AttributeError):
        today = date.today()
        year, month = today.year, today.month

    num_days = calendar.monthrange(year, month)[1]
    start_date = date(year, month, 1)
    end_date = date(year, month, num_days)

    # Output buffer
    buffer = BytesIO()

    # Landscape letter format is ideal for wide compliance tables
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Title paragraph styles
    title_style = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#3A7C3A'),
        alignment=1, # Center
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        name='SubTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=11,
        textColor=colors.HexColor('#555555'),
        alignment=1, # Center
        spaceAfter=15
    )

    table_header_style = ParagraphStyle(
        name='TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
        alignment=1 # Center
    )

    table_cell_style = ParagraphStyle(
        name='TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        alignment=1 # Center
    )

    # Document Header
    story.append(Paragraph("FORM XXV", title_style))
    story.append(Paragraph("[See Rule 78(1)(a)(i)]", subtitle_style))
    story.append(Paragraph(f"MUSTER ROLL FOR THE MONTH OF: {calendar.month_name[month].upper()} {year}", title_style))
    story.append(Spacer(1, 10))

    # Table Column Headers
    headers = [
        Paragraph("<b>S.No</b>", table_header_style),
        Paragraph("<b>Worker Name</b>", table_header_style),
        Paragraph("<b>Father's / Husband's Name</b>", table_header_style),
        Paragraph("<b>Designation / Type</b>", table_header_style),
        Paragraph("<b>Days Worked</b>", table_header_style),
        Paragraph("<b>Daily Wage Rate</b>", table_header_style),
        Paragraph("<b>Wages Due (Est.)</b>", table_header_style),
        Paragraph("<b>Signature / Thumb impression</b>", table_header_style)
    ]

    data = [headers]

    workers = Worker.objects.filter(is_superuser=False).order_by('name')
    s_no = 1
    
    for worker in workers:
        # Calculate days present
        present = AttendanceRecord.objects.filter(
            worker=worker,
            date__range=[start_date, end_date],
            status=AttendanceRecord.StatusChoices.APPROVED
        ).count()

        # Rough calculation of wages based on 450 INR per day
        daily_rate = 450.0
        wages_due = present * daily_rate

        # Simple guess for father's name from name suffix, or placeholder
        fathers_name = "Shri " + worker.name.split()[-1] if len(worker.name.split()) > 1 else "N/A"

        row = [
            Paragraph(str(s_no), table_cell_style),
            Paragraph(worker.name, table_cell_style),
            Paragraph(fathers_name, table_cell_style),
            Paragraph(worker.get_worker_type_display(), table_cell_style),
            Paragraph(str(present), table_cell_style),
            Paragraph(f"Rs. {daily_rate:.2f}", table_cell_style),
            Paragraph(f"Rs. {wages_due:.2f}", table_cell_style),
            Paragraph("_________________", table_cell_style) # Physical signature line
        ]
        data.append(row)
        s_no += 1

    # Define table styles
    # Primary theme is light green: HexColor('#3A7C3A')
    t = Table(data, colWidths=[30, 110, 110, 80, 60, 80, 80, 120])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3A7C3A')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F9F9F9'), colors.white]),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))

    story.append(t)
    doc.build(story)
    
    buffer.seek(0)
    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/pdf'
    )
    response['Content-Disposition'] = f'attachment; filename=FieldMark_MusterRoll_{month_str}.pdf'
    return response
