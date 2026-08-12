from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceRecordViewSet
from .pdf_views import AttendancePDFReportView

router = DefaultRouter()
router.register(r'', AttendanceRecordViewSet, basename='attendance')

urlpatterns = [
    path('pdf-report/', AttendancePDFReportView.as_view(), name='attendance_pdf_report'),
    path('', include(router.urls)),
]
