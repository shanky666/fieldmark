from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShiftViewSet, ZoneViewSet, WorkerViewSet

router = DefaultRouter()
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'list', WorkerViewSet, basename='worker')

urlpatterns = [
    path('me/', WorkerViewSet.as_view({'get': 'me'}), name='worker-me-direct'),
    path('', include(router.urls)),
]
