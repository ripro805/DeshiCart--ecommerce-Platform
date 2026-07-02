from django.conf import settings
from django.db import models


class ReturnRequest(models.Model):
    STATUS_CHOICES = (
        ("REQUESTED", "Requested"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("RECEIVED", "Received"),
        ("REFUNDED", "Refunded"),
    )
    order = models.ForeignKey("order.Order", on_delete=models.CASCADE, related_name="return_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="return_requests")
    reason = models.TextField(blank=True, default="")
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="REQUESTED")
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admin_note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Return #{self.id} for order #{self.order_id}"


class ReturnItem(models.Model):
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name="items")
    order_item = models.ForeignKey("order.OrderItem", on_delete=models.CASCADE, related_name="return_items")
    quantity = models.PositiveIntegerField(default=1)
    condition = models.CharField(max_length=80, blank=True, default="")

    def __str__(self):
        return f"{self.quantity} × {self.order_item_id}"
