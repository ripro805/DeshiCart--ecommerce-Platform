"""User account endpoints (profile + address book + role-aware listings)."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.permissions import IsAdminReadOnlyForStaff
from api.responses import api_response

from .models import Address
from .serializers import (
    AddressSerializer,
    ChangePasswordSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only customer listing and inspection."""

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminReadOnlyForStaff]
    search_fields = ("email", "first_name", "last_name", "phone")
    filterset_fields = ("is_active", "is_staff", "is_blocked")

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        if role == "admin":
            qs = qs.filter(is_staff=True)
        elif role == "customer":
            qs = qs.filter(is_staff=False)
        return qs

    @action(detail=True, methods=["post"], url_path="block")
    def block(self, request, pk=None):
        user = self.get_object()
        user.is_blocked = True
        user.is_active = False
        user.save(update_fields=["is_blocked", "is_active"])
        return api_response(UserSerializer(user).data, message="User blocked.")

    @action(detail=True, methods=["post"], url_path="unblock")
    def unblock(self, request, pk=None):
        user = self.get_object()
        user.is_blocked = False
        user.is_active = True
        user.save(update_fields=["is_blocked", "is_active"])
        return api_response(UserSerializer(user).data, message="User unblocked.")

    @action(detail=True, methods=["post"], url_path="make-staff")
    def make_staff(self, request, pk=None):
        user = self.get_object()
        user.is_staff = True
        user.save(update_fields=["is_staff"])
        return api_response(UserSerializer(user).data, message="Granted staff role.")

    @action(detail=True, methods=["post"], url_path="remove-staff")
    def remove_staff(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return api_response(None, message="Cannot demote a superuser.", success=False, http_status=status.HTTP_400_BAD_REQUEST)
        user.is_staff = False
        user.save(update_fields=["is_staff"])
        return api_response(UserSerializer(user).data, message="Removed staff role.")

    @action(detail=True, methods=["post"], url_path="set-role")
    def set_role(self, request, pk=None):
        """Assign a role to a user. Body: ``{"role": "CUSTOMER" | "STAFF_ADMIN"}``.

        New users always register as CUSTOMER. Only a SUPER_ADMIN may promote
        someone to STAFF_ADMIN or demote a STAFF_ADMIN back to CUSTOMER.
        Superusers cannot be demoted and you cannot demote yourself.
        """
        target = self.get_object()
        actor = request.user

        if not actor.is_superuser:
            return api_response(
                None,
                message="Only super admins can change roles.",
                success=False,
                http_status=status.HTTP_403_FORBIDDEN,
            )

        new_role = (request.data.get("role") or "").upper().strip()
        if new_role not in {"CUSTOMER", "STAFF_ADMIN"}:
            return api_response(
                None,
                message="Invalid role. Use CUSTOMER or STAFF_ADMIN.",
                success=False,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        if target.is_superuser and new_role == "CUSTOMER":
            return api_response(
                None,
                message="Cannot demote a superuser.",
                success=False,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        if target.id == actor.id:
            return api_response(
                None,
                message="You cannot change your own role.",
                success=False,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        target.is_staff = new_role == "STAFF_ADMIN"
        target.save(update_fields=["is_staff"])
        return api_response(
            UserSerializer(target).data,
            message=f"Role updated to {new_role}.",
        )


class AddressViewSet(viewsets.ModelViewSet):
    """Per-user address book."""

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MeViewSet(viewsets.ViewSet):
    """Self-service profile + password endpoints under /api/customer/me/."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        return api_response(UserSerializer(request.user).data)

    def partial_update(self, request, pk=None):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(UserSerializer(request.user).data, message="Profile updated.")

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_response(None, message="Password updated.")

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        user = request.user
        from order.models import Order  # local import to avoid circulars

        orders = Order.objects.filter(user=user)
        data = {
            "user": UserSerializer(user).data,
            "orders_count": orders.count(),
            "orders_total": float(sum(o.total_amount for o in orders)) if orders.exists() else 0.0,
            "addresses_count": Address.objects.filter(user=user).count(),
            "wishlist_count": _safe_wishlist_count(user),
        }
        return api_response(data)


def _safe_wishlist_count(user) -> int:
    try:
        from wishlist.models import Wishlist

        return Wishlist.objects.filter(user=user).count()
    except Exception:
        return 0
