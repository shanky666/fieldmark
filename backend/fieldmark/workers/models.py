from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class Shift(models.Model):
    class AppliesToChoices(models.TextChoices):
        ZONE = 'ZONE', _('Zone')
        WORKER = 'WORKER', _('Worker')

    name = models.CharField(max_length=50)
    window_start = models.TimeField()
    window_end = models.TimeField()
    applies_to = models.CharField(
        max_length=10, 
        choices=AppliesToChoices.choices, 
        default=AppliesToChoices.ZONE
    )

    def __str__(self):
        return f"{self.name} ({self.window_start.strftime('%I:%M %p')} - {self.window_end.strftime('%I:%M %p')})"


class Zone(models.Model):
    name = models.CharField(max_length=100)
    center_lat = models.FloatField()
    center_lng = models.FloatField()
    radius_meters = models.FloatField(default=500.0)
    shift = models.ForeignKey(Shift, on_delete=models.PROTECT, related_name='zones')
    color_hex = models.CharField(max_length=7, default='#3a7c3a')

    def __str__(self):
        return f"{self.name} (Radius: {self.radius_meters}m)"


class WorkerManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('The Phone number field is required')
        extra_fields.setdefault('username', phone)  # AbstractUser compatibility
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, password, **extra_fields)


class Worker(AbstractUser):
    class WorkerType(models.TextChoices):
        PERMANENT = 'PERMANENT', _('Permanent')
        CONTRACTOR = 'CONTRACTOR', _('Contractor')
        SEASONAL = 'SEASONAL', _('Seasonal')

    class LanguageChoices(models.TextChoices):
        EN = 'EN', _('English')
        KN = 'KN', _('Kannada')
        HI = 'HI', _('Hindi')
        TA = 'TA', _('Tamil')
        TE = 'TE', _('Telugu')

    username = models.CharField(max_length=150, unique=True, null=True, blank=True) # Override standard username
    phone = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    worker_type = models.CharField(
        max_length=15, 
        choices=WorkerType.choices, 
        default=WorkerType.PERMANENT
    )
    assigned_zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='workers')
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True, related_name='workers_with_shift')
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)
    profile_photo_url = models.CharField(max_length=500, null=True, blank=True)
    fcm_token = models.CharField(max_length=255, null=True, blank=True)
    preferred_language = models.CharField(
        max_length=2, 
        choices=LanguageChoices.choices, 
        default=LanguageChoices.EN
    )
    created_at = models.DateTimeField(default=timezone.now)

    # Django user representation override
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['name']

    objects = WorkerManager()

    def __str__(self):
        return f"{self.name} ({self.phone}) - {self.worker_type}"


class ZoneReassignmentHistory(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='zone_history')
    from_zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='reassigned_from')
    to_zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='reassigned_to')
    reassigned_by = models.ForeignKey(Worker, on_delete=models.SET_NULL, null=True, related_name='reassignments_made')
    reassigned_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField()

    def __str__(self):
        return f"{self.worker.name}: {self.from_zone} -> {self.to_zone} at {self.reassigned_at.strftime('%Y-%m-%d')}"
