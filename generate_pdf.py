import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from reportlab.lib import colors

data = [
    ["S.NO", "EMPLOYEE NAME", "EMP ID"],
    [1, "M. LAKSHMINARAYANA", "131908202113645"],
    [2, "B. Narayanaswamy", "131908202113646"],
    [3, "Gajula V N", "131908202113647"],
    [4, "Nanjundappa", "131908202113648"],
    [5, "G. NAGARAJU", "131908202113649"],
    [6, "G Venkatesh", "131908202113650"],
    [7, "B Venkata Siva", "131908202113651"],
    [8, "G Vani", "131908202113652"],
    [9, "A.Anitha", "131908202113653"],
    [10, "M. Anitha", "131908202113654"],
    [11, "G. Ramanjinelu", "131908202113655"],
    [12, "M. Venkataswamy", "131908202113656"],
    [13, "J.Sujatha", "131908202113657"],
    [14, "K. Hari", "131908202113658"],
    [15, "G. Roja", "131908202113659"],
    [16, "C.Bhaskar", "131908202113660"],
    [17, "C Jayananda", "131908202113661"],
    [18, "L shivanna", "131908202113662"],
    [19, "Mallaya", "131908202113663"],
    [20, "Ramanjaneyulu", "131908202113664"],
    [21, "P Mallik", "131908202113665"],
    [22, "P Laxmi Narayana", "131908202113666"],
    [23, "D Hari Krishna", "131908202113667"],
    [24, "P Sreeram", "131908202113668"],
    [25, "K.Aswini", "131908202113669"],
    [26, "Shaik Mahaboob Basha", "131908202113670"],
    [27, "P Prasad", "131908202113671"],
    [28, "K. Ramanjaneyulu", "131908202113672"],
    [29, "D.Ashok", "131908202113673"],
    [30, "B.Ramanjaneyulu", "131908202113674"],
    [31, "S.Ganeshan", "131908202113675"],
    [32, "L.Swathi", "131908202113676"],
    [33, "C Thimmaiah", "131908202113677"],
    [34, "D Jayarami", "131908202113678"],
    [35, "G Balaraju", "131908202113679"],
    [36, "G Hari Krishna", "131908202113680"],
    [37, "G Gangadhar", "131908202113681"],
    [38, "S Anjaneyulu", "131908202113682"],
    [39, "M Harijan", "131908202113683"],
    [40, "Venkatarami", "131908202113684"],
    [41, "Kanchana", "131908202113685"],
    [42, "B JAYA KUMAR", "131908202113686"],
    [43, "M Venkataramanaiah", "131908202113687"],
]

pdf_path = os.path.join(os.path.expanduser('~'), 'Downloads', 'Employee_ID_List.pdf')

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
