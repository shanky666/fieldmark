from django.urls import path
from .views import (
    MonthlySummaryReportView, PayrollReportView, ComplianceReportView,
    HeatmapReportView
)

urlpatterns = [
    path('monthly/', MonthlySummaryReportView.as_view(), name='report_monthly'),
    path('payroll/', PayrollReportView.as_view(), name='report_payroll'),
    path('compliance/', ComplianceReportView.as_view(), name='report_compliance'),
    path('heatmap/', HeatmapReportView.as_view(), name='report_heatmap'),
]
