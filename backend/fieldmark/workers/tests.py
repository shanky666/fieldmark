from datetime import time, timedelta
import pytz
from django.test import TestCase
from django.utils import timezone
from fieldmark.workers.models import Worker, Zone, Shift
from fieldmark.attendance.models import AttendanceRecord
from fieldmark.attendance.haversine import haversine
from fieldmark.attendance.anomaly_checks import check_sync_gps_zone

class HaversineTestCase(TestCase):
    def test_distance_calculation(self):
        # Coordinates of Bangalore center and a point ~150 meters away
        lat1, lng1 = 12.9716, 77.5946
        lat2, lng2 = 12.9725, 77.5955
        dist = haversine(lat1, lng1, lat2, lng2)
        # Verify distance is within range
        self.assertTrue(100.0 < dist < 200.0)


class VerificationValidationTestCase(TestCase):
    def setUp(self):
        # Create standard shift: 6:00 AM - 10:30 AM
        self.shift = Shift.objects.create(
            name="Standard",
            window_start=time(6, 0),
            window_end=time(10, 30),
            applies_to="ZONE"
        )
        # Create Zone
        self.zone = Zone.objects.create(
            name="Zone North",
            center_lat=12.9716,
            center_lng=77.5946,
            radius_meters=500.0,
            shift=self.shift
        )
        # Create Worker
        self.worker = Worker.objects.create_user(
            phone="+917777777771",
            name="Basappa",
            assigned_zone=self.zone
        )

    def test_worker_in_zone(self):
        # Worker checks in inside zone (center coordinates)
        record = AttendanceRecord(
            worker=self.worker,
            latitude=12.9716,
            longitude=77.5946,
            photo_url="attendance/photo.jpg",
            device_id="TEST_DEVICE_123"
        )
        gps_match, flags = check_sync_gps_zone(record)
        self.assertEqual(gps_match, AttendanceRecord.GPSMatchChoices.MATCHED)
        self.assertEqual(len(flags), 0)

    def test_worker_outside_zone(self):
        # Worker checks in far away
        record = AttendanceRecord(
            worker=self.worker,
            latitude=13.0500, # Far away
            longitude=77.6500,
            photo_url="attendance/photo.jpg",
            device_id="TEST_DEVICE_123"
        )
        gps_match, flags = check_sync_gps_zone(record)
        self.assertEqual(gps_match, AttendanceRecord.GPSMatchChoices.MISMATCH)
        self.assertIn("OUTSIDE_ZONE", flags)
