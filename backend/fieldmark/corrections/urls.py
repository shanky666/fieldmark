from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CorrectionRequestViewSet

router = DefaultRouter()
router.register(r'', CorrectionRequestViewSet, basename='correction')

urlpatterns = [
    path('', include(router.urls)),
]
