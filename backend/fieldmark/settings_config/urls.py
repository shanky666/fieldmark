from django.urls import path
from .views import AnomalyRuleConfigView

urlpatterns = [
    path('anomaly-rules/', AnomalyRuleConfigView.as_view(), name='anomaly_rules'),
]
