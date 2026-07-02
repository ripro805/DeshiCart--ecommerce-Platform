"""Admin panel views: staff management, activity log."""
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action

from api.permissions import IsAdmin, IsSuperAdmin
from api.responses import api_response
from users.models import User

from .models import StaffProfile, ActivityLog
from .serializers import StaffUserSerializer, StaffProfileSerializer, ActivityLogSerializer


class StaffUserViewSet(viewsets.ModelViewSet):
    """Admin CRUD over users, scoped to non-customer accounts when role is set."""
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = StaffUserSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ("is_active", "is_staff", "is_superuser")
    search_fields = ("email", "first_name", "last_name")

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        u = self.get_object()
        u.is_active = True
        u.save(update_fields=["is_active"])
        return api_response(StaffUserSerializer(u).data, message="User activated.")

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        u = self.get_object()
        if u.id == request.user.id:
            return api_response(None, message="Cannot deactivate yourself.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        u.is_active = False
        u.save(update_fields=["is_active"])
        return api_response(StaffUserSerializer(u).data, message="User deactivated.")

    @action(detail=True, methods=["post"], url_path="set-role")
    def set_role(self, request, pk=None):
        u = self.get_object()
        new_role = (request.data.get("role") or "").upper()
        valid = {"SUPER_ADMIN", "STAFF_ADMIN", "CUSTOMER"}
        if new_role not in valid:
            return api_response(None, message=f"Invalid role. Must be one of {sorted(valid)}.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        u.is_superuser = new_role == "SUPER_ADMIN"
        u.is_staff = new_role in {"SUPER_ADMIN", "STAFF_ADMIN"}
        u.save(update_fields=["is_superuser", "is_staff"])
        return api_response(StaffUserSerializer(u).data, message=f"Role set to {new_role}.")


class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all().select_related("user")
    serializer_class = StaffProfileSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ("is_active",)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().select_related("actor").order_by("-created_at")
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ("action", "target_type")
    search_fields = ("actor__email", "target_type") 
