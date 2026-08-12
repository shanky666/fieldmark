from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceRecordViewSet
from .export_views import AttendanceCSVReportView

router = DefaultRouter()
router.register(r'', AttendanceRecordViewSet, basename='attendance')

urlpatterns = [
    path('csv-report/', AttendanceCSVReportView.as_view(), name='attendance_csv_report'),
    path('', include(router.urls)),
]
