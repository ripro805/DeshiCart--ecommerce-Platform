from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = (
        ("SYSTEM", "System"),
        ("ORDER", "Order"),
        ("PROMO", "Promotion"),
        ("SUPPORT", "Support"),
        ("ADMIN", "Admin"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
        help_text="Null = broadcast to all admins",
    )
    type = models.CharField(max_length=12, choices=TYPE_CHOICES, default="SYSTEM")
    title = models.CharField(max_length=180)
    body = models.TextField(blank=True, default="")
    link = models.CharField(max_length=255, blank=True, default="")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
