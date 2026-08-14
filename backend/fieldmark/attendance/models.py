from django.db import models
from django.conf import settings
from django.utils import timezone

class AttendanceRecord(models.Model):
    class GPSMatchChoices(models.TextChoices):
        MATCHED = 'MATCHED', 'Matched'
        MISMATCH = 'MISMATCH', 'Mismatch'
        FLAGGED = 'FLAGGED', 'Flagged'

    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        FLAGGED = 'FLAGGED', 'Flagged'

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField(default=timezone.now)
    marked_at = models.DateTimeField(default=timezone.now)
    check_out_at = models.DateTimeField(null=True, blank=True)

    latitude = models.FloatField()
    longitude = models.FloatField()
    photo_url = models.TextField()
    photo_hash = models.CharField(max_length=32, null=True, blank=True)

    photo_exif_lat = models.FloatField(null=True, blank=True)
    photo_exif_lng = models.FloatField(null=True, blank=True)
    exif_gps_delta_meters = models.FloatField(null=True, blank=True)

    device_id = models.CharField(max_length=255)
    gps_match = models.CharField(
        max_length=15,
        choices=GPSMatchChoices.choices,
        default=GPSMatchChoices.MATCHED
    )
    status = models.CharField(
        max_length=15,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verifications_done'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_note = models.TextField(null=True, blank=True)

    is_offline_submission = models.BooleanField(default=False)
    offline_queued_at = models.DateTimeField(null=True, blank=True)
    anomaly_flags = models.JSONField(default=list, blank=True)

    @property
    def duration_seconds(self):
        if self.marked_at and self.check_out_at:
            return int((self.check_out_at - self.marked_at).total_seconds())
        return None

    @property
    def duration_formatted(self):
        if not self.marked_at:
            return "--"
        if not self.check_out_at:
            return "In Progress"
        total_sec = max(0, int((self.check_out_at - self.marked_at).total_seconds()))
        hours = total_sec // 3600
        mins = (total_sec % 3600) // 60
        return f"{hours}h {mins:02d}m"

    @property
    def liveness_passed(self):
        flags = self.anomaly_flags or []
        for f in flags:
            if 'LIVENESS' in str(f).upper():
                return False
        return True

    class Meta:
        ordering = ['-marked_at']
        unique_together = ('worker', 'date')

    def __str__(self):
        return f"{self.worker.name} on {self.date} - Status: {self.status}"

