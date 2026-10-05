import os
import sys
import django
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fieldmark.settings')
django.setup()

from fieldmark.workers.models import Worker

# Exclude the superuser/admin from the PDF list (we only want the 163 workers)
workers = Worker.objects.filter(is_superuser=False).order_by('id')

data = [["S.NO", "EMPLOYEE NAME", "EMP ID", "PASSWORD"]]
for idx, w in enumerate(workers, 1):
    # password is not in plaintext in DB, but we generated it as Pass@ + last 4 digits
    emp_id = w.employee_id or ""
    password = f"Pass@{emp_id[-4:]}" if emp_id else ""
    data.append([idx, w.name, emp_id, password])

pdf_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'All_Employee_Passwords.pdf')

pdf = SimpleDocTemplate(pdf_path, pagesize=letter)
table = Table(data)

style = TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00B0F0')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
])

table.setStyle(style)
pdf.build([table])
print(f"PDF successfully created at: {pdf_path}")
