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


class IsSuperAdminOnly(BasePermission):
    """Only super admins may access."""

    message = "Super admin privileges required."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_superuser)


class IsAdminReadOnlyForStaff(BasePermission):
    """Admins can read; only super admins can modify."""

    message = "Only super admin can modify this resource."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated and (user.is_staff or user.is_superuser)):
            return False
        if user.is_superuser:
            return True
        return request.method in SAFE_METHODS

class IsNotStaff(BasePermission):
    """Customers only - staff and admins are rejected.

    Use on /api/customer/* routes to ensure staff cannot shop or impersonate.
    """

    message = "Staff and admin users cannot access customer endpoints."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated):
            return False
        return not (getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
