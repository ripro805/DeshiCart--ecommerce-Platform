from django.db import models
from django.conf import settings
from order.models import Order  # late import; safe once both apps have migrations


class ShippingZone(models.Model):
    name = models.CharField(max_length=120)
    countries = models.JSONField(default=list, help_text="ISO country codes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ShippingRate(models.Model):
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name="rates")
    name = models.CharField(max_length=120, blank=True, default="")
    min_weight = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_weight = models.DecimalField(max_digits=8, decimal_places=2, default=999)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    courier = models.CharField(max_length=80, default="Pathao")
    estimated_days = models.PositiveIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["zone", "min_weight"]

    def __str__(self):
        return f"{self.zone.name} – {self.courier} ({self.price})"


class TrackingUpdate(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("PICKED_UP", "Picked Up"),
        ("IN_TRANSIT", "In Transit"),
        ("OUT_FOR_DELIVERY", "Out for Delivery"),
        ("DELIVERED", "Delivered"),
        ("RETURNED", "Returned"),
        ("FAILED", "Delivery Failed"),
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="tracking_updates")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="PENDING")
    location = models.CharField(max_length=180, blank=True, default="")
    note = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tracking_updates",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"#{self.order_id} – {self.status}"
