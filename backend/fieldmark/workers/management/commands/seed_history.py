import uuid
import random
from datetime import timedelta, time
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from fieldmark.workers.models import Worker, Zone, Shift
from fieldmark.attendance.models import AttendanceRecord
from fieldmark.leave.models import LeaveRequest, LeaveBalance
from fieldmark.corrections.models import CorrectionRequest
from fieldmark.rounds.models import FieldRound
from fieldmark.grievances.models import GrievanceMessage
from fieldmark.audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds historical attendance, leave, rounds, grievances, and audit logs for 30 days.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding history...")
        
        workers = Worker.objects.filter(is_superuser=False, is_staff=False)
        supervisors = Worker.objects.filter(is_staff=True, is_superuser=False)
        admins = Worker.objects.filter(is_superuser=True)
        zones = Zone.objects.all()

        if not workers.exists():
            self.stdout.write(self.style.ERROR("Please run 'python manage.py loaddata fixtures/seed_data.json' first."))
            return

        # Setup Leave Balances
        for w in Worker.objects.filter(is_superuser=False):
            LeaveBalance.objects.get_or_create(
                worker=w,
                year=2026,
                defaults={'casual_total': 12, 'casual_used': 0, 'sick_total': 6, 'sick_used': 0}
            )

        today = timezone.now().date()
        
        with transaction.atomic():
            # Clear old records to allow re-seeding
            AttendanceRecord.objects.all().delete()
            LeaveRequest.objects.all().delete()
            CorrectionRequest.objects.all().delete()
            FieldRound.objects.all().delete()
            GrievanceMessage.objects.all().delete()
            AuditLog.objects.all().delete()

            # Seed 3 Approved Leave Requests
            # 1. Casual Leave for Basappa
            l1 = LeaveRequest.objects.create(
                worker=workers[0],
                leave_type=LeaveRequest.LeaveTypeChoices.CASUAL,
                start_date=today - timedelta(days=20),
                end_date=today - timedelta(days=19),
                reason="Family function in village",
                status=LeaveRequest.StatusChoices.APPROVED,
                approved_by=admins[0],
                approved_at=timezone.now() - timedelta(days=21)
            )
            # Update balance
            lb1 = LeaveBalance.objects.get(worker=workers[0], year=2026)
            lb1.casual_used = 2
            lb1.save()

            # 2. Sick Leave for Amit
            l2 = LeaveRequest.objects.create(
                worker=workers[1],
                leave_type=LeaveRequest.LeaveTypeChoices.SICK,
                start_date=today - timedelta(days=15),
                end_date=today - timedelta(days=15),
                reason="Fever",
                status=LeaveRequest.StatusChoices.APPROVED,
                approved_by=admins[0],
                approved_at=timezone.now() - timedelta(days=16)
            )
            lb2 = LeaveBalance.objects.get(worker=workers[1], year=2026)
            lb2.sick_used = 1
            lb2.save()

            # 3. Field Holiday Leave for Karthik
            LeaveRequest.objects.create(
                worker=workers[2],
                leave_type=LeaveRequest.LeaveTypeChoices.FIELD_HOLIDAY,
                start_date=today - timedelta(days=10),
                end_date=today - timedelta(days=10),
                reason="Agricultural harvesting block",
                status=LeaveRequest.StatusChoices.APPROVED,
                approved_by=admins[0],
                approved_at=timezone.now() - timedelta(days=11)
            )

            # Generate 30 days of attendance
            # From 30 days ago to yesterday
            for day_idx in range(1, 31):
                current_date = today - timedelta(days=day_idx)
                
                # Skip Sundays
                if current_date.weekday() == 6:
                    continue

                for worker in workers:
                    # Skip if worker is on leave on this date
                    on_leave = LeaveRequest.objects.filter(
                        worker=worker,
                        start_date__lte=current_date,
                        end_date__gte=current_date,
                        status=LeaveRequest.StatusChoices.APPROVED
                    ).exists()
                    if on_leave:
                        continue

                    # Simulate random 5% absences
                    if random.random() < 0.05:
                        continue

                    # Shift details
                    zone = worker.assigned_zone
                    shift = zone.shift if zone else None
                    start_h = shift.window_start.hour if shift else 6
                    
                    # Create timestamp
                    marked_time = time(start_h, random.randint(5, 45))
                    marked_dt = timezone.make_aware(
                        timezone.datetime.combine(current_date, marked_time)
                    )

                    # Default coordinates
                    lat = zone.center_lat + random.uniform(-0.001, 0.001) if zone else 12.9716
                    lng = zone.center_lng + random.uniform(-0.001, 0.001) if zone else 77.5946

                    # Build record
                    AttendanceRecord.objects.create(
                        worker=worker,
                        date=current_date,
                        marked_at=marked_dt,
                        latitude=lat,
                        longitude=lng,
                        photo_url=f"attendance/{uuid.uuid4()}_photo.jpg",
                        photo_hash=uuid.uuid4().hex[:32],
                        photo_exif_lat=lat,
                        photo_exif_lng=lng,
                        exif_gps_delta_meters=random.uniform(0.5, 5.0),
                        device_id="MOCK_DEVICE_12345",
                        gps_match=AttendanceRecord.GPSMatchChoices.MATCHED,
                        status=AttendanceRecord.StatusChoices.APPROVED,
                        verified_by=admins[0],
                        verified_at=timezone.now() - timedelta(days=day_idx)
                    )

            # Insert specific Flagged / Anomaly records for demonstration
            # 1. EXIF_MISMATCH
            exif_w = workers[0]
            exif_zone = exif_w.assigned_zone
            exif_date = today - timedelta(days=1)
            exif_record = AttendanceRecord.objects.create(
                worker=exif_w,
                date=exif_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(exif_date, time(6, 12))),
                latitude=exif_zone.center_lat,
                longitude=exif_zone.center_lng,
                photo_url="attendance/flag_exif_mismatch.jpg",
                photo_hash="exifmismatchhash001",
                photo_exif_lat=exif_zone.center_lat + 0.005, # ~500m off
                photo_exif_lng=exif_zone.center_lng + 0.005,
                exif_gps_delta_meters=550.0,
                device_id="EXIF_TEST_DEVICE",
                gps_match=AttendanceRecord.GPSMatchChoices.FLAGGED,
                status=AttendanceRecord.StatusChoices.FLAGGED,
                anomaly_flags=["EXIF_MISMATCH"]
            )

            # 2. SPEED_VIOLATION
            speed_w = workers[1]
            speed_zone = speed_w.assigned_zone
            speed_date = today - timedelta(days=1)
            # Create a record at 6:00 AM in Zone A
            AttendanceRecord.objects.filter(worker=speed_w, date=speed_date).delete()
            AttendanceRecord.objects.create(
                worker=speed_w,
                date=speed_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(speed_date, time(6, 0))),
                latitude=12.9716,
                longitude=77.5946,
                photo_url="attendance/speed1.jpg",
                device_id="SPEED_DEV",
                status=AttendanceRecord.StatusChoices.APPROVED
            )
            # Second record at 6:10 AM in Zone C (13.0523, 77.5921 - ~9km away. Speed: 54 km/h)
            # Overwriting key to save it as flagged
            speed_record = AttendanceRecord.objects.create(
                worker=speed_w,
                date=today, # today
                marked_at=timezone.now() - timedelta(hours=1),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/speed2.jpg",
                device_id="SPEED_DEV",
                gps_match=AttendanceRecord.GPSMatchChoices.MATCHED,
                status=AttendanceRecord.StatusChoices.FLAGGED,
                anomaly_flags=["SPEED_VIOLATION"]
            )

            # 3. DUPLICATE_PHOTO
            dup_date = today - timedelta(days=2)
            dup_w1 = workers[3]
            dup_w2 = workers[4]
            AttendanceRecord.objects.filter(worker=dup_w1, date=dup_date).delete()
            AttendanceRecord.objects.filter(worker=dup_w2, date=dup_date).delete()
            
            AttendanceRecord.objects.create(
                worker=dup_w1,
                date=dup_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(dup_date, time(8, 15))),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/duplicate_base.jpg",
                photo_hash="samephotomd5hash123",
                device_id="DEV_A",
                status=AttendanceRecord.StatusChoices.APPROVED
            )
            dup_record = AttendanceRecord.objects.create(
                worker=dup_w2,
                date=dup_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(dup_date, time(8, 18))),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/duplicate_copy.jpg",
                photo_hash="samephotomd5hash123",
                device_id="DEV_B",
                status=AttendanceRecord.StatusChoices.FLAGGED,
                anomaly_flags=["DUPLICATE_PHOTO"]
            )

            # 4. OUTSIDE_ZONE
            out_w = workers[5]
            out_zone = out_w.assigned_zone
            out_date = today - timedelta(days=3)
            AttendanceRecord.objects.filter(worker=out_w, date=out_date).delete()
            out_record = AttendanceRecord.objects.create(
                worker=out_w,
                date=out_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(out_date, time(6, 20))),
                latitude=out_zone.center_lat + 0.01, # far away
                longitude=out_zone.center_lng + 0.01,
                photo_url="attendance/outside_zone.jpg",
                device_id="OUT_DEV",
                gps_match=AttendanceRecord.GPSMatchChoices.MISMATCH,
                status=AttendanceRecord.StatusChoices.FLAGGED,
                anomaly_flags=["OUTSIDE_ZONE"]
            )

            # 5. CUTOFF_PATTERN
            cutoff_w = workers[6]
            cutoff_date = today - timedelta(days=1)
            cutoff_record = AttendanceRecord.objects.create(
                worker=cutoff_w,
                date=cutoff_date,
                marked_at=timezone.make_aware(timezone.datetime.combine(cutoff_date, time(10, 27))), # shift ends 10:30
                latitude=12.9716,
                longitude=77.5946,
                photo_url="attendance/cutoff.jpg",
                device_id="CUTOFF_DEV",
                status=AttendanceRecord.StatusChoices.FLAGGED,
                anomaly_flags=["CUTOFF_PATTERN"]
            )

            # 8 Pending records for today (Workers checking in today)
            for idx in range(8):
                pw = workers[idx]
                p_zone = pw.assigned_zone
                p_shift = pw.shift or (p_zone.shift if p_zone else None)
                p_start_h = p_shift.window_start.hour if p_shift else 6
                
                # Check if already generated above
                AttendanceRecord.objects.filter(worker=pw, date=today).delete()
                
                AttendanceRecord.objects.create(
                    worker=pw,
                    date=today,
                    marked_at=timezone.make_aware(timezone.datetime.combine(today, time(p_start_h, random.randint(10, 30)))),
                    latitude=p_zone.center_lat if p_zone else 12.9716,
                    longitude=p_zone.center_lng if p_zone else 77.5946,
                    photo_url=f"attendance/pending_{idx}.jpg",
                    device_id="PENDING_DEV_ID",
                    gps_match=AttendanceRecord.GPSMatchChoices.MATCHED,
                    status=AttendanceRecord.StatusChoices.PENDING
                )

            # 3 Rejected records
            rej_date1 = today - timedelta(days=4)
            AttendanceRecord.objects.filter(worker=workers[7], date=rej_date1).delete()
            AttendanceRecord.objects.create(
                worker=workers[7],
                date=rej_date1,
                marked_at=timezone.make_aware(timezone.datetime.combine(rej_date1, time(6, 45))),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/rejected1.jpg",
                device_id="REJ_DEV",
                status=AttendanceRecord.StatusChoices.REJECTED,
                verified_by=admins[0],
                verified_at=timezone.now() - timedelta(days=4),
                rejection_note="Photo is completely dark and face is not visible"
            )

            rej_date2 = today - timedelta(days=5)
            AttendanceRecord.objects.filter(worker=workers[8], date=rej_date2).delete()
            AttendanceRecord.objects.create(
                worker=workers[8],
                date=rej_date2,
                marked_at=timezone.make_aware(timezone.datetime.combine(rej_date2, time(6, 50))),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/rejected2.jpg",
                device_id="REJ_DEV",
                status=AttendanceRecord.StatusChoices.REJECTED,
                verified_by=admins[0],
                verified_at=timezone.now() - timedelta(days=5),
                rejection_note="Duplicate photo submitted."
            )

            rej_date3 = today - timedelta(days=6)
            AttendanceRecord.objects.filter(worker=workers[9], date=rej_date3).delete()
            AttendanceRecord.objects.create(
                worker=workers[9],
                date=rej_date3,
                marked_at=timezone.make_aware(timezone.datetime.combine(rej_date3, time(8, 5))),
                latitude=13.0523,
                longitude=77.5921,
                photo_url="attendance/rejected3.jpg",
                device_id="REJ_DEV",
                status=AttendanceRecord.StatusChoices.REJECTED,
                verified_by=admins[0],
                verified_at=timezone.now() - timedelta(days=6),
                rejection_note="Incorrect worker checked in."
            )

            # 2 Pending Correction Requests
            CorrectionRequest.objects.create(
                worker=workers[0],
                date=today - timedelta(days=7),
                reason=CorrectionRequest.ReasonChoices.NO_SIGNAL,
                reason_detail="Network tower was down in Sector 4 field all morning.",
                status=CorrectionRequest.StatusChoices.PENDING
            )
            CorrectionRequest.objects.create(
                worker=workers[1],
                date=today - timedelta(days=8),
                reason=CorrectionRequest.ReasonChoices.PHONE_DEAD,
                reason_detail="Phone battery died due to cold weather at start of shift.",
                status=CorrectionRequest.StatusChoices.PENDING
            )

            # 2 Field Rounds logged by supervisors
            FieldRound.objects.create(
                supervisor=supervisors[0],
                zone=zones[0],
                visited_at=timezone.now() - timedelta(hours=4),
                latitude=zones[0].center_lat + 0.0001,
                longitude=zones[0].center_lng - 0.0001,
                photo_url="rounds/round1.jpg",
                worker_count_observed=6,
                notes="Checked the North fields, all workers active on task."
            )
            FieldRound.objects.create(
                supervisor=supervisors[1],
                zone=zones[2],
                visited_at=timezone.now() - timedelta(hours=2),
                latitude=zones[2].center_lat,
                longitude=zones[2].center_lng,
                photo_url="rounds/round2.jpg",
                worker_count_observed=4,
                notes="East field clearing round. Delayed start due to light rain."
            )

            # 4 Grievance Threads
            # Thread 1: Resolved
            t1_id = uuid.uuid4()
            GrievanceMessage.objects.create(
                sender=workers[0],
                recipient=supervisors[0],
                subject="Incorrect hours calculation",
                message="My hours for Monday were logged as absent even though I submitted attendance.",
                thread_id=t1_id,
                is_read=True,
                is_resolved=True
            )
            GrievanceMessage.objects.create(
                sender=supervisors[0],
                recipient=workers[0],
                subject="Incorrect hours calculation",
                message="Hello. I checked your record; your photo was blurry but I have verified it and approved it now.",
                thread_id=t1_id,
                is_read=True,
                is_resolved=True
            )

            # Thread 2: Resolved
            t2_id = uuid.uuid4()
            GrievanceMessage.objects.create(
                sender=workers[1],
                recipient=supervisors[0],
                subject="Leave deduction issue",
                message="Casual leave was deducted twice for last week.",
                thread_id=t2_id,
                is_read=True,
                is_resolved=True
            )

            # Thread 3: Open
            t3_id = uuid.uuid4()
            GrievanceMessage.objects.create(
                sender=workers[2],
                recipient=supervisors[1],
                subject="Water availability in field",
                message="There is no drinking water container refilled in Sector C today.",
                thread_id=t3_id,
                is_read=False,
                is_resolved=False
            )

            # Thread 4: Open (with reply)
            t4_id = uuid.uuid4()
            GrievanceMessage.objects.create(
                sender=workers[3],
                recipient=supervisors[1],
                subject="First aid kit replacement",
                message="The first aid box in Sector C is missing bandages.",
                thread_id=t4_id,
                is_read=True,
                is_resolved=False
            )
            GrievanceMessage.objects.create(
                sender=supervisors[1],
                recipient=workers[3],
                subject="First aid kit replacement",
                message="Noted. I will bring replacement bandages tomorrow morning during check-in.",
                thread_id=t4_id,
                is_read=False,
                is_resolved=False
            )

            # Write Audit Logs for Admin actions
            AuditLog.objects.create(
                action_by=admins[0],
                action="SEED_DATABASE",
                target_model="System",
                target_id=None,
                before_state={},
                after_state={'status': 'SUCCESS'},
                ip_address="127.0.0.1"
            )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully with 30 days of records!"))
