try:
    import pytz
    ist_tz = pytz.timezone('Asia/Kolkata')
except ImportError:
    from zoneinfo import ZoneInfo
    ist_tz = ZoneInfo('Asia/Kolkata')
from datetime import timedelta, datetime, date
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache
from celery import shared_task

from fieldmark.workers.models import Worker, Shift, Zone
from fieldmark.attendance.models import AttendanceRecord
from .fcm import send_push_notification, TRANSLATIONS

# Helper to get active localized message
def get_translated_message(key, lang, **kwargs):
    lang = lang.upper() if lang else 'EN'
    if lang not in TRANSLATIONS:
        lang = 'EN'
    template = TRANSLATIONS[lang].get(key, TRANSLATIONS['EN'][key])
    return template.format(**kwargs)


@shared_task
def morning_reminder():
    """6:00 AM IST morning reminder for workers who haven't checked in yet."""
    now_ist = timezone.now().astimezone(ist_tz)
    today = now_ist.date()

    # Get active workers
    active_workers = Worker.objects.filter(is_active=True, is_superuser=False)
    
    for worker in active_workers:
        # Check if attendance already marked today
        has_marked = AttendanceRecord.objects.filter(
            worker=worker, 
            date=today
        ).exclude(status=AttendanceRecord.StatusChoices.REJECTED).exists()
        
        if has_marked:
            continue
            
        # Check shift
        shift = worker.shift or (worker.assigned_zone.shift if worker.assigned_zone else None)
        if not shift:
            # Fallback to standard 10:30 AM close
            shift_end_str = "10:30 AM"
            shift_end_time = datetime.time(10, 30)
        else:
            shift_end_str = shift.window_end.strftime('%I:%M %p')
            shift_end_time = shift.window_end

        # Only remind if shift window is currently open or hasn't closed yet
        if now_ist.time() < shift_end_time:
            if worker.fcm_token:
                title = get_translated_message('morning_reminder_title', worker.preferred_language, name=worker.name)
                body = get_translated_message('morning_reminder_body', worker.preferred_language, shift_end=shift_end_str)
                send_push_notification(
                    token=worker.fcm_token,
                    title=title,
                    body=body,
                    data={'type': 'MORNING_REMINDER'},
                    lang=worker.preferred_language
                )


@shared_task
def pre_close_reminder():
    """Runs every 5 minutes and flags workers whose shift window ends in <= 30 mins."""
    ist_tz = pytz.timezone('Asia/Kolkata')
    now_ist = timezone.now().astimezone(ist_tz)
    today = now_ist.date()

    active_workers = Worker.objects.filter(is_active=True, is_superuser=False)
    
    for worker in active_workers:
        # Prevent spamming: only send one pre-close reminder per day
        cache_key = f"pre_close_reminded_{worker.id}_{today}"
        if cache.get(cache_key):
            continue
            
        has_marked = AttendanceRecord.objects.filter(
            worker=worker, 
            date=today
        ).exclude(status=AttendanceRecord.StatusChoices.REJECTED).exists()
        
        if has_marked:
            continue

        shift = worker.shift or (worker.assigned_zone.shift if worker.assigned_zone else None)
        if not shift:
            shift_end_time = timezone.datetime.time(10, 30)
        else:
            shift_end_time = shift.window_end

        # Calculate time delta in minutes
        now_dt = datetime.combine(today, now_ist.time())
        end_dt = datetime.combine(today, shift_end_time)
        delta_mins = (end_dt - now_dt).total_seconds() / 60.0

        # Send if within 30 minutes window and shift hasn't ended yet
        if 0 < delta_mins <= 30:
            if worker.fcm_token:
                title = get_translated_message('pre_close_title', worker.preferred_language)
                body = get_translated_message('pre_close_body', worker.preferred_language)
                send_push_notification(
                    token=worker.fcm_token,
                    title=title,
                    body=body,
                    data={'type': 'PRE_CLOSE_REMINDER'},
                    lang=worker.preferred_language
                )
                # Cache flag for the rest of the day (expires in 12 hours)
                cache.set(cache_key, True, 43200)


@shared_task
def weekly_summary():
    """Sunday 6:00 PM summary for active workers."""
    ist_tz = pytz.timezone('Asia/Kolkata')
    now_ist = timezone.now().astimezone(ist_tz)
    today = now_ist.date()
    start_date = today - timedelta(days=6) # Mon to Sun

    active_workers = Worker.objects.filter(is_active=True, is_superuser=False)
    for worker in active_workers:
        # Count approved attendances
        present = AttendanceRecord.objects.filter(
            worker=worker,
            date__range=[start_date, today],
            status=AttendanceRecord.StatusChoices.APPROVED
        ).count()
        
        # Working days default to 6 days
        total_working = 6

        if worker.fcm_token:
            title = get_translated_message('weekly_summary_title', worker.preferred_language)
            body = get_translated_message('weekly_summary_body', worker.preferred_language, present=present, total=total_working)
            send_push_notification(
                token=worker.fcm_token,
                title=title,
                body=body,
                data={'type': 'WEEKLY_SUMMARY'},
                lang=worker.preferred_language
            )


@shared_task
def contract_expiry_warning():
    """Runs daily 8:00 AM IST and alerts if contracts expire in 7 days."""
    ist_tz = pytz.timezone('Asia/Kolkata')
    today = timezone.now().astimezone(ist_tz).date()
    warning_date = today + timedelta(days=7)

    expiring_workers = Worker.objects.filter(
        is_active=True,
        contract_end_date=warning_date
    )

    # Admins list
    admins = Worker.objects.filter(is_superuser=True)

    for worker in expiring_workers:
        # Notify worker
        if worker.fcm_token:
            title = get_translated_message('contract_warning_title', worker.preferred_language)
            body = get_translated_message('contract_warning_body', worker.preferred_language, date=worker.contract_end_date.strftime('%d-%b-%Y'))
            send_push_notification(
                token=worker.fcm_token,
                title=title,
                body=body,
                data={'type': 'CONTRACT_EXPIRY_WORKER'},
                lang=worker.preferred_language
            )

        # Notify admins
        for admin in admins:
            if admin.fcm_token:
                title = get_translated_message('admin_expiry_title', admin.preferred_language)
                body = get_translated_message('admin_expiry_body', admin.preferred_language, name=worker.name)
                send_push_notification(
                    token=admin.fcm_token,
                    title=title,
                    body=body,
                    data={'type': 'CONTRACT_EXPIRY_ADMIN', 'worker_id': worker.id},
                    lang=admin.preferred_language
                )


@shared_task
def contract_auto_deactivation():
    """Midnight daily check to deactivate expired contracts."""
    ist_tz = pytz.timezone('Asia/Kolkata')
    today = timezone.now().astimezone(ist_tz).date()
    yesterday = today - timedelta(days=1)

    # Find active workers whose contract expired yesterday or earlier
    expired_workers = Worker.objects.filter(
        is_active=True,
        contract_end_date__lte=yesterday
    )

    count = expired_workers.count()
    if count == 0:
        return f"No contracts expired today ({today})."

    expired_worker_names = list(expired_workers.values_list('name', flat=True))
    
    with transaction.atomic():
        # Deactivate workers
        expired_workers.update(is_active=False)

    # Notify each deactivated worker
    for worker in expired_workers:
        if worker.fcm_token:
            title = "Contract Terminated"
            body = get_translated_message('contract_expired_worker', worker.preferred_language, date=worker.contract_end_date.strftime('%d-%b-%Y'))
            send_push_notification(
                token=worker.fcm_token,
                title=title,
                body=body,
                data={'type': 'CONTRACT_DEACTIVATED'},
                lang=worker.preferred_language
            )

    # Notify admins
    admins = Worker.objects.filter(is_superuser=True)
    for admin in admins:
        if admin.fcm_token:
            title = "Contracts Expired"
            body = get_translated_message('contract_expired_admin', admin.preferred_language, count=count)
            send_push_notification(
                token=admin.fcm_token,
                title=title,
                body=body,
                data={'type': 'CONTRACTS_EXPIRED_ALERT', 'names': expired_worker_names},
                lang=admin.preferred_language
            )

    return f"Deactivated {count} expired workers."
