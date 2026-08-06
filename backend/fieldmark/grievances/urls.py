from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GrievanceViewSet

router = DefaultRouter()
router.register(r'', GrievanceViewSet, basename='grievance')

urlpatterns = [
    path('', include(router.urls)),
]
