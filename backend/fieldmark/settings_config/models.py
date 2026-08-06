from django.db import models
from django.conf import settings

from django.utils import timezone

class AnomalyRuleConfig(models.Model):
    rule_name = models.CharField(max_length=100, unique=True)
    is_enabled = models.BooleanField(default=True)
    threshold_value = models.FloatField()
    threshold_unit = models.CharField(max_length=50)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Rule: {self.rule_name} (Enabled: {self.is_enabled}, Val: {self.threshold_value} {self.threshold_unit})"
