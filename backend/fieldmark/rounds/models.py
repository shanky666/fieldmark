from django.db import models
from django.conf import settings
from django.utils import timezone
from fieldmark.workers.models import Zone

class FieldRound(models.Model):
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='field_rounds'
    )
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='field_rounds')
    visited_at = models.DateTimeField(default=timezone.now)
    latitude = models.FloatField()
    longitude = models.FloatField()
    photo_url = models.CharField(max_length=500)
    worker_count_observed = models.IntegerField(default=0)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-visited_at']

    def __str__(self):
        return f"Round by {self.supervisor.name} at {self.zone.name} - count: {self.worker_count_observed}"
