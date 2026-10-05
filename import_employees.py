import os
import sys
import django

# Add backend directory to sys.path so Django can find the settings module
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fieldmark.settings')
django.setup()

from fieldmark.workers.models import Worker

employees = [
    (1, "Y. Balakrishnareddy", "11309820231611", "Pass@1611", "CCO"),
    (2, "J Somashekhar", "11309820231616", "Pass@1616", "MCO"),
    (3, "Gayithri S A", "11309820231624", "Pass@1624", "VCO"),
    (4, "vanajamma", "11309820231632", "Pass@1632", "VCO"),
    (5, "S. NAGARAJU", "11309820231639", "Pass@1639", "VCO"),
    (6, "G Venkatesh", "11309820231646", "Pass@1646", "VCO"),
    (7, "K Venkata Siva", "11309820231653", "Pass@1653", "VCO"),
    (8, "G Vani", "11309820231660", "Pass@1660", "VCO"),
    (9, "B.Anitha", "11309820231667", "Pass@1667", "VCO"),
    (10, "M. Anitha", "11309820231674", "Pass@1674", "VCO"),
    (11, "G. Ramanjineyulu", "11309820231681", "Pass@1681", "VCO"),
    (12, "M. Shivalinga reddy", "11309820231688", "Pass@1688", "VCO"),
    (13, "J. Parthu", "11309820231695", "Pass@1695", "VCO"),
]

for s_no, name, emp_id, password, role in employees:
    # We assign a dummy unique phone number using their ID because phone is a required unique field in the system
    phone = f"+91999900{emp_id[-4:]}"
    
    # Ensure no conflicts by wiping existing test accounts with this ID or phone
    Worker.objects.filter(employee_id=emp_id).delete()
    Worker.objects.filter(phone=phone).delete()
    
    worker = Worker.objects.create_user(
        phone=phone,
        password=password,
        name=name,
        employee_id=emp_id,
        is_staff=False
    )
    print(f"Created: {name} (ID: {emp_id}, Phone: {phone})")

print("All 13 employees successfully imported.")
