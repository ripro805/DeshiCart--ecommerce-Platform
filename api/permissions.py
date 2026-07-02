"""
Permission classes shared across the admin / customer API surface.

``IsAdmin`` and ``IsSuperAdmin`` are the primary gates used on `/api/admin/...`
endpoints. ``IsStaffOrAdmin`` allows both kinds of staff, while ``ReadOnly``
restricts all writes.
"""
from __future__ import annotations

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    """Allows access to users with ``is_staff=True``."""

    message = "Admin privileges required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)


# Backwards-compatible alias (kept so legacy imports in product/views.py still resolve).
class IsAdminOrReadOnly(BasePermission):
    """Read for anyone, write for staff."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)


class IsSuperAdmin(BasePermission):
    """Only superusers."""

    message = "Super admin privileges required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and (user.is_superuser or user.is_staff and getattr(user, "role", "") == "SUPER_ADMIN"))


class IsStaffOrAdmin(BasePermission):
    """Any authenticated staff member (subset of IsAdmin)."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated)