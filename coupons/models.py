from django.conf import settings
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_TYPES = (
        ("PERCENT", "Percent"),
        ("FIXED", "Fixed amount"),
    )
    code = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=255, blank=True, default="")
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES, default="PERCENT")
    value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(default=0, help_text="0 means unlimited")
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_flash_sale = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    @property
    def is_valid(self) -> bool:
        now = timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and self.valid_from > now:
            return False
        if self.valid_to and self.valid_to < now:
            return False
        if self.max_uses and self.used_count >= self.max_uses:
            return False
        return True


class CouponUsage(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="usages")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coupon_usages")
    order = models.ForeignKey("order.Order", on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-used_at"]

    def __str__(self):
        return f"{self.user.email} – {self.coupon.code}"
