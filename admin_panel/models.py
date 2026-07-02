from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
        ("STATUS_CHANGE", "Status Change"),
        ("BLOCK", "Block"),
        ("UNBLOCK", "Unblock"),
        ("EXPORT", "Export"),
        ("IMPORT", "Import"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activity_logs"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=80, blank=True, default="")
    target_id = models.CharField(max_length=80, blank=True, default="")
    description = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.user_id or '-'} {self.action} {self.target_type}#{self.target_id}"


class StaffProfile(models.Model):
    ROLE_CHOICES = (
        ("SUPER_ADMIN", "Super Admin"),
        ("STAFF_ADMIN", "Staff Admin"),
    )
    DEFAULT_PERMISSIONS = [
        "orders.view", "orders.update", "orders.delete",
        "products.view", "products.update",
        "customers.view",
        "inventory.view", "inventory.update",
        "shipping.view",
        "coupons.view",
        "support.view", "support.update",
        "notifications.view",
        "reviews.view", "reviews.update",
        "marketing.view",
        "appearance.view",
        "reports.view",
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile"
    )
    role = models.CharField(max_length=14, choices=ROLE_CHOICES, default="STAFF_ADMIN")
    permissions = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    hired_at = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["user__email"]

    def save(self, *args, **kwargs):
        if not self.permissions:
            self.permissions = self.DEFAULT_PERMISSIONS
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} ({self.role})"

    @property
    def is_super_admin(self) -> bool:
        return self.role == "SUPER_ADMIN" or bool(getattr(self.user, "is_superuser", False))
