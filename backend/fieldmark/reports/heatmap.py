try:
    import pytz
    ist_tz = pytz.timezone('Asia/Kolkata')
except ImportError:
    from zoneinfo import ZoneInfo
    ist_tz = ZoneInfo('Asia/Kolkata')
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import ExtractHour

from fieldmark.workers.models import Zone, Worker, Shift
from fieldmark.attendance.models import AttendanceRecord

def get_reports_heatmap_data(months_count=3):
    """
    Computes zone x weekday average attendance rates.
    Returns: {
        'zones': [zone names],
        'weekdays': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        'matrix': [[zone1_mon%, zone1_tue%, ...], [zone2_mon%, ...]]
    }
    """
    today = timezone.now().astimezone(ist_tz).date()
    start_date = today - timedelta(days=months_count * 30)

    zones = Zone.objects.all().order_by('name')
    weekdays_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    # Pre-populate matrix structure
    matrix = []
    zone_names = []

    # Map Python weekday numbers (Mon=0, Tue=1, ..., Sun=6)
    for zone in zones:
        zone_names.append(zone.name)
        worker_count = Worker.objects.filter(assigned_zone=zone, is_active=True).count()
        if worker_count == 0:
            worker_count = 1 # Prevent division by zero
            
        zone_rates = []
        for day_num in range(7):
            # Query approved records for this zone, date range, and weekday
            records = AttendanceRecord.objects.filter(
                worker__assigned_zone=zone,
                date__range=[start_date, today],
                status=AttendanceRecord.StatusChoices.APPROVED
            )
            
            # Filter by weekday: In Python, weekday is 0-6. In django queryset:
            # __week_day in django is 1=Sunday, 2=Monday, ..., 7=Saturday
            django_weekday = (day_num + 1) % 7 + 1
            records_count = records.filter(date__week_day=django_weekday).count()
            
            # Count total instances of this weekday in the range
            total_days = 0
            curr = start_date
            while curr <= today:
                if curr.weekday() == day_num:
                    total_days += 1
                curr += timedelta(days=1)
            if total_days == 0:
                total_days = 1

            # Rate = present_workers / (active_workers * days)
            rate = round((records_count / (worker_count * total_days)) * 100, 1)
            zone_rates.append(min(100.0, rate))
            
        matrix.append(zone_rates)

    return {
        'zones': zone_names,
        'weekdays': weekdays_labels,
        'matrix': matrix
    }


def get_hourly_submission_distribution():
    """
    Computes distribution of attendance submissions in shift window hours.
    Bars: 6AM | 7AM | 8AM | 9AM | 10AM
    """
    # Annotate with hour
    # Filter hours 5 to 12
    records = AttendanceRecord.objects.filter(
        status=AttendanceRecord.StatusChoices.APPROVED
    ).annotate(
        hour=ExtractHour('marked_at')
    ).filter(hour__range=[5, 12]).values('hour').annotate(count=Count('id')).order_by('hour')

    dist_map = {6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    for r in records:
        h = r['hour']
        # Map 5 to 6, 11/12 to 10 fallback if outside typical window
        if h in dist_map:
            dist_map[h] = r['count']
        elif h == 5:
            dist_map[6] += r['count']
        elif h >= 11:
            dist_map[10] += r['count']

    return [
        {'label': '6 AM', 'count': dist_map[6]},
        {'label': '7 AM', 'count': dist_map[7]},
        {'label': '8 AM', 'count': dist_map[8]},
        {'label': '9 AM', 'count': dist_map[9]},
        {'label': '10 AM', 'count': dist_map[10]},
    ]


def get_late_marking_trends():
    """
    Zones ranked by near-cutoff submission rate.
    Records marked within 15 minutes of their shift end time.
    """
    zones = Zone.objects.all()
    trends = []
    
    for zone in zones:
        shift = zone.shift
        if not shift:
            continue
            
        # Total approved records
        total_approved = AttendanceRecord.objects.filter(
            worker__assigned_zone=zone,
            status=AttendanceRecord.StatusChoices.APPROVED
        ).count()
        
        if total_approved == 0:
            continue

        # Count late markings
        # Subtract 15 minutes from shift end
        end_time_dt = datetime.combine(date.today(), shift.window_end)
        warning_time_dt = end_dt = end_time_dt - timedelta(minutes=15)
        warning_time = warning_time_dt.time()
        
        late_count = AttendanceRecord.objects.filter(
            worker__assigned_zone=zone,
            status=AttendanceRecord.StatusChoices.APPROVED,
            marked_at__time__gte=warning_time,
            marked_at__time__lte=shift.window_end
        ).count()

        late_rate = round((late_count / total_approved) * 100, 1)
        trends.append({
            'zone_name': zone.name,
            'late_rate_pct': late_rate,
            'late_count': late_count,
            'total_count': total_approved
        })

    # Sort descending by rate
    trends.sort(key=lambda x: x['late_rate_pct'], reverse=True)
    return trends
