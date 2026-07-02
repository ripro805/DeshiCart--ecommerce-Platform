from django.db import models
from django.contrib.auth.models import AbstractUser
from users.managers import CustomUserManager


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    # ---- New profile fields ----
    phone = models.CharField(max_length=32, blank=True, default="")
    avatar = models.URLField(max_length=500, blank=True, default="")
    date_of_birth = models.DateField(blank=True, null=True)
    last_seen_at = models.DateTimeField(blank=True, null=True)
    is_blocked = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    # Convenience flags used by the admin API.
    @property
    def is_admin_user(self) -> bool:
        return bool(self.is_staff or self.is_superuser)

    @property
    def role(self) -> str:
        if self.is_superuser:
            return "SUPER_ADMIN"
        if self.is_staff:
            return "STAFF_ADMIN"
        return "CUSTOMER"


class Address(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="addresses"
    )
    label = models.CharField(max_length=64, blank=True, default="Home")
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=120, blank=True, default="")
    postal_code = models.CharField(max_length=32, blank=True, default="")
    country = models.CharField(max_length=80, default="BD")
    phone = models.CharField(max_length=32, blank=True, default="")
    is_default_billing = models.BooleanField(default=False)
    is_default_shipping = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default_shipping", "-created_at"]

    def __str__(self):
        return f"{self.user.email} – {self.line1}"