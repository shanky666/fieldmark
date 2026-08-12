from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from fieldmark.attendance.s3_views import S3PresignView, LocalMockUploadView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('fieldmark.auth_otp.urls')),
    path('api/workers/', include('fieldmark.workers.urls')),
    path('api/attendance/', include('fieldmark.attendance.urls')),
    path('api/leave/', include('fieldmark.leave.urls')),
    path('api/corrections/', include('fieldmark.corrections.urls')),
    path('api/rounds/', include('fieldmark.rounds.urls')),
    path('api/grievances/', include('fieldmark.grievances.urls')),
    path('api/reports/', include('fieldmark.reports.urls')),
    path('api/audit/', include('fieldmark.audit.urls')),
    path('api/settings/', include('fieldmark.settings_config.urls')),
    
    # S3 / R2 and local mock upload endpoints
    path('api/s3/presign/', S3PresignView.as_view(), name='s3_presign'),
    path('api/s3/mock-upload/', LocalMockUploadView.as_view(), name='s3_mock_upload'),

    # Direct media file route to serve uploaded photos in production (Render) regardless of DEBUG status
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
