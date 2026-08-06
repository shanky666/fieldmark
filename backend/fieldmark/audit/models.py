from django.db import models
from django.conf import settings
from django.utils import timezone

class AuditLog(models.Model):
    action_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='audit_actions'
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100, null=True, blank=True)
    target_id = models.IntegerField(null=True, blank=True)
    before_state = models.JSONField(default=dict, blank=True)
    after_state = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.action_by.name if self.action_by else "System"
        return f"{actor} performed {self.action} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
