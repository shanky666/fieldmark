import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class GrievanceMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_grievances'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_grievances'
    )
    subject = models.CharField(max_length=200, default='General Inquiry')
    message = models.TextField()
    attachment_url = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    thread_id = models.UUIDField(default=uuid.uuid4, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg from {self.sender.name} inside thread {self.thread_id}"
