from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, SendOTPView, VerifyOTPView, AdminLoginView, AdminTOTPVerifyView,
    AdminBackupCodeVerifyView, Admin2FASetupView, Admin2FAConfirmView,
    FCMRegisterView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('admin-login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin-totp/', AdminTOTPVerifyView.as_view(), name='admin_totp'),
    path('admin-backup-code/', AdminBackupCodeVerifyView.as_view(), name='admin_backup'),
    
    # 2FA setup & confirm (requires JWT authentication)
    path('2fa/setup/', Admin2FASetupView.as_view(), name='2fa_setup'),
    path('2fa/confirm/', Admin2FAConfirmView.as_view(), name='2fa_confirm'),

    # SimpleJWT token refresh (rotation configured in settings)
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # FCM Token registration
    path('fcm/register/', FCMRegisterView.as_view(), name='fcm_register'),
]
