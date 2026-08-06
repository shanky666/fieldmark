import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fieldmark.settings.local')

app = Celery('fieldmark')

# Read config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure Beat schedules (All times are evaluated in timezone set in settings, e.g. Asia/Kolkata)
app.conf.beat_schedule = {
    # Task 1: Morning reminder at 6:00 AM IST on weekdays (Mon-Fri)
    'morning_reminder_task': {
        'task': 'fieldmark.notifications.tasks.morning_reminder',
        'schedule': crontab(hour=6, minute=0, day_of_week='1-5'),
    },
    # Task 2: Pre-close reminder runs every 5 minutes (checks shifts closing in 30 mins)
    'pre_close_reminder_task': {
        'task': 'fieldmark.notifications.tasks.pre_close_reminder',
        'schedule': crontab(minute='*/5'),
    },
    # Task 3: Weekly summary on Sunday at 6:00 PM IST
    'weekly_summary_task': {
        'task': 'fieldmark.notifications.tasks.weekly_summary',
        'schedule': crontab(hour=18, minute=0, day_of_week='0'),
    },
    # Task 4: Contract expiry warnings at 8:00 AM IST daily
    'contract_expiry_warning_task': {
        'task': 'fieldmark.notifications.tasks.contract_expiry_warning',
        'schedule': crontab(hour=8, minute=0),
    },
    # Task 5: Contract auto-deactivation at midnight (00:00 IST) daily
    'contract_auto_deactivation_task': {
        'task': 'fieldmark.notifications.tasks.contract_auto_deactivation',
        'schedule': crontab(hour=0, minute=0),
    },
    # Task 6: Weekly storage cleanup on Sunday at 00:00 IST (deletes photos older than 7 days)
    'weekly_storage_cleanup_task': {
        'task': 'fieldmark.attendance.tasks.weekly_storage_cleanup',
        'schedule': crontab(hour=0, minute=0, day_of_week='0'),
    },
}
