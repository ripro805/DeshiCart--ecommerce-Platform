"""Admin panel routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import StaffUserViewSet, StaffProfileViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register("users", StaffUserViewSet, basename="admin-staff-users")
router.register("profiles", StaffProfileViewSet, basename="admin-staff-profiles")
router.register("activity", ActivityLogViewSet, basename="admin-activity")

urlpatterns = [
    path("", include(router.urls)),
]