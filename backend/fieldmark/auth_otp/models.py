from django.db import models
from django.conf import settings

class OTPRecord(models.Model):
    phone = models.CharField(max_length=15)
    otp_hash = models.CharField(max_length=128) # Storing hashed OTP for security
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OTP for {self.phone} (Used: {self.used})"


from django.utils import timezone

class AdminCredential(models.Model):
    worker = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='admin_credential'
    )
    totp_secret = models.CharField(max_length=100, null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list) # List of backup codes
    last_password_change = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Admin Credential for {self.worker.name}"
