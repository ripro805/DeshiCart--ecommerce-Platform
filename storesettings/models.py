from django.db import models


class StoreSettings(models.Model):
    """Singleton — only row #1 should ever be edited."""

    store_name = models.CharField(max_length=180, default="DeshiCart")
    store_email = models.EmailField(blank=True, default="")
    store_phone = models.CharField(max_length=32, blank=True, default="")
    store_address = models.TextField(blank=True, default="")

    currency = models.CharField(max_length=8, default="BDT")
    currency_symbol = models.CharField(max_length=8, default="৳")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    smtp_host = models.CharField(max_length=180, blank=True, default="")
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_user = models.CharField(max_length=180, blank=True, default="")
    smtp_password = models.CharField(max_length=255, blank=True, default="")
    smtp_use_tls = models.BooleanField(default=True)
    smtp_from_email = models.EmailField(blank=True, default="")

    social_facebook = models.URLField(blank=True, default="")
    social_instagram = models.URLField(blank=True, default="")
    social_twitter = models.URLField(blank=True, default="")
    social_youtube = models.URLField(blank=True, default="")

    security_2fa_required = models.BooleanField(default=False)
    session_timeout_minutes = models.PositiveIntegerField(default=60)

    maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Store Settings"
        verbose_name_plural = "Store Settings"

    def save(self, *args, **kwargs):
        """Force singleton: ensure pk stays at 1."""
        if not self.pk:
            existing = StoreSettings.objects.first()
            if existing:
                self.pk = existing.pk
        super().save(*args, **kwargs)

    def __str__(self):
        return self.store_name


FAQ_CATEGORY_CHOICES = (
    ("GENERAL", "General"),
    ("SHIPPING", "Shipping"),
    ("RETURNS", "Returns"),
    ("PAYMENT", "Payment"),
    ("ACCOUNT", "Account"),
)


class FAQItem(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    category = models.CharField(max_length=12, choices=FAQ_CATEGORY_CHOICES, default="GENERAL")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "order"]
        verbose_name = "FAQ Item"
        verbose_name_plural = "FAQ Items"

    def __str__(self):
        return self.question
