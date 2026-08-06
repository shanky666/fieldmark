from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FieldRoundViewSet

router = DefaultRouter()
router.register(r'', FieldRoundViewSet, basename='round')

urlpatterns = [
    path('', include(router.urls)),
]
