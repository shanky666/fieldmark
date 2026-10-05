import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

data = [
    ["S.NO", "EMPLOYEE NAME", "EMP ID", "PASSWORD"],
    [1, "Y. Balakrishnareddy", "11309820231611", "Pass@1611"],
    [2, "J Somashekhar", "11309820231616", "Pass@1616"],
    [3, "Gayithri S A", "11309820231624", "Pass@1624"],
    [4, "vanajamma", "11309820231632", "Pass@1632"],
    [5, "S. NAGARAJU", "11309820231639", "Pass@1639"],
    [6, "G Venkatesh", "11309820231646", "Pass@1646"],
    [7, "K Venkata Siva", "11309820231653", "Pass@1653"],
    [8, "G Vani", "11309820231660", "Pass@1660"],
    [9, "B.Anitha", "11309820231667", "Pass@1667"],
    [10, "M. Anitha", "11309820231674", "Pass@1674"],
    [11, "G. Ramanjineyulu", "11309820231681", "Pass@1681"],
    [12, "M. Shivalinga reddy", "11309820231688", "Pass@1688"],
    [13, "J. Parthu", "11309820231695", "Pass@1695"],
]

pdf_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'Employee_Passwords.pdf')

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
