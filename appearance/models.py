from django.db import models


class Appearance(models.Model):
    """Singleton – site-wide visual configuration."""

    logo_url = models.URLField(max_length=500, blank=True, default="")
    favicon_url = models.URLField(max_length=500, blank=True, default="")
    primary_color = models.CharField(max_length=12, default="#EA580C")
    accent_color = models.CharField(max_length=12, default="#FBBF24")
    ink_color = models.CharField(max_length=12, default="#0F172A")
    bg_color = models.CharField(max_length=12, default="#FFF7ED")

    hero_title = models.CharField(max_length=200, default="Shop the deshi way")
    hero_subtitle = models.CharField(max_length=300, default="Handpicked local products, delivered fast.")
    hero_image_url = models.URLField(max_length=500, blank=True, default="")
    hero_cta_label = models.CharField(max_length=60, default="Shop now")
    hero_cta_link = models.CharField(max_length=255, default="/products")

    footer_text = models.CharField(max_length=255, blank=True, default="")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Appearance"
        verbose_name_plural = "Appearance"

    def save(self, *args, **kwargs):
        if not self.pk:
            existing = Appearance.objects.first()
            if existing:
                self.pk = existing.pk
        super().save(*args, **kwargs)

    def __str__(self):
        return "Appearance settings"
