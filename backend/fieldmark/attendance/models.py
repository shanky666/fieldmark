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
    photo_url = models.CharField(max_length=500)
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

    class Meta:
        ordering = ['-marked_at']
        unique_together = ('worker', 'date')

    def __str__(self):
        return f"{self.worker.name} on {self.date} - Status: {self.status}"
