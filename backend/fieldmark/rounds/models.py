from django.db import models
from django.conf import settings
from django.utils import timezone
from fieldmark.workers.models import Zone

class FieldRound(models.Model):
    class StatusChoices(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        COMPLETED = 'COMPLETED', 'Completed'

    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='field_rounds'
    )
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='field_rounds')
    visited_at = models.DateTimeField(default=timezone.now)
    start_time = models.TimeField(null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    gps_accuracy = models.FloatField(null=True, blank=True)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    worker_count_observed = models.IntegerField(default=0)
    associated_workers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='associated_field_rounds', 
        blank=True
    )
    notes = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=15, 
        choices=StatusChoices.choices, 
        default=StatusChoices.OPEN
    )

    class Meta:
        ordering = ['-visited_at']

    def __str__(self):
        return f"Round by {self.supervisor.name} at {self.zone.name} - count: {self.worker_count_observed}"
