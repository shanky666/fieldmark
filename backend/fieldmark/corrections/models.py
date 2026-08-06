from django.db import models
from django.conf import settings
from django.utils import timezone

class CorrectionRequest(models.Model):
    class ReasonChoices(models.TextChoices):
        NO_SIGNAL = 'NO_SIGNAL', 'No Network Signal'
        PHONE_DEAD = 'PHONE_DEAD', 'Phone Battery Dead'
        EMERGENCY = 'EMERGENCY', 'Personal Emergency'
        OTHER = 'OTHER', 'Other'

    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='correction_requests'
    )
    date = models.DateField()
    reason = models.CharField(max_length=15, choices=ReasonChoices.choices)
    reason_detail = models.TextField()
    status = models.CharField(
        max_length=15, 
        choices=StatusChoices.choices, 
        default=StatusChoices.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='corrections_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Correction for {self.worker.name} on {self.date} - Status: {self.status}"
