from django.db import models


class Banner(models.Model):
    POSITION_CHOICES = (
        ("HERO", "Hero slider"),
        ("SIDEBAR", "Sidebar"),
        ("FOOTER", "Footer"),
        ("POPUP", "Popup"),
        ("CATEGORY", "Category page"),
    )
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True, default="")
    image = models.URLField(max_length=500)
    link = models.CharField(max_length=500, blank=True, default="")
    position = models.CharField(max_length=16, choices=POSITION_CHOICES, default="HERO")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    starts_at = models.DateTimeField(blank=True, null=True)
    ends_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "order", "-created_at"]

    def __str__(self):
        return self.title


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email


class Campaign(models.Model):
    """Marketing campaign metadata (no model linkage to products — pure record)."""

    name = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    starts_at = models.DateTimeField(blank=True, null=True)
    ends_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
