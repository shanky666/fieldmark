from django.db import models
from django.conf import settings
from django.utils import timezone

def current_year():
    return timezone.now().year

class LeaveRequest(models.Model):
    class LeaveTypeChoices(models.TextChoices):
        CASUAL = 'CASUAL', 'Casual'
        SICK = 'SICK', 'Sick'
        FIELD_HOLIDAY = 'FIELD_HOLIDAY', 'Field Holiday'
        UNPAID = 'UNPAID', 'Unpaid'

    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='leave_requests'
    )
    leave_type = models.CharField(max_length=20, choices=LeaveTypeChoices.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=15, 
        choices=StatusChoices.choices, 
        default=StatusChoices.PENDING
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='leaves_approved'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.worker.name}: {self.leave_type} ({self.start_date} to {self.end_date}) - {self.status}"


class LeaveBalance(models.Model):
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='leave_balances'
    )
    year = models.IntegerField(default=current_year)
    casual_total = models.IntegerField(default=12)
    casual_used = models.IntegerField(default=0)
    sick_total = models.IntegerField(default=6)
    sick_used = models.IntegerField(default=0)

    class Meta:
        unique_together = ('worker', 'year')

    def __str__(self):
        return f"Balance {self.year} for {self.worker.name}: Casual({self.casual_used}/{self.casual_total}), Sick({self.sick_used}/{self.sick_total})"
