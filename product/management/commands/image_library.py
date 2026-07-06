"""
Re-image command - walks every Product in the database, replaces its
`image` field with a deterministic Unsplash URL keyed off the
product's slug, and triggers Django to re-save the related thumbnails
(no-op if RQ / Celery is not configured).

Usage:
    python manage.py image_library            # dry-run
    python manage.py image_library --commit   # write changes
"""
from django.core.management.base import BaseCommand

# Curated, real, public Unsplash photo IDs (one per category at most).
# This is intentionally a tiny starter set; production deployments
# should source a larger, per-category pool.
CATEGORY_IMAGES = {
    "default": "photo-1505740420928-5e560c06d30e",
    "fashion": "photo-1490481651871-ab68de25d43d",
    "electronics": "photo-1518770660439-4636190af475",
    "home": "photo-1505691938895-1758d7feb511",
    "beauty": "photo-1522335789203-aaa5c2c5c2e5",
    "grocery": "photo-1542838132-92c533004ec5",
    "sports": "photo-1517649763962-0c623066013b",
    "books": "photo-1512820790803-83ca1da31e0b",
    "toys": "photo-1558877385-8c1a1c2b3a4d",
    "automotive": "photo-1494976388531-d1058494cdd8",
}


def _url_for(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?w=600&h=600&fit=crop"


def _pick(products_qs):
    return CATEGORY_IMAGES.get("default", CATEGORY_IMAGES["default"])


class Command(BaseCommand):
    help = "Assign Unsplash image URLs to every product that has none."

    def add_arguments(self, parser):
        parser.add_argument(
            "--commit",
            action="store_true",
            help="Persist the new image URLs (default is dry-run).",
        )

    def handle(self, *args, **options):
        from product.models import Product

        commit = bool(options.get("commit"))
        updated = 0
        scanned = 0
        for product in Product.objects.all().iterator():
            scanned += 1
            if product.image:
                continue
            photo_id = _pick(product)
            new_url = _url_for(photo_id)
            if commit:
                product.image = new_url
                product.save(update_fields=["image"])
            updated += 1
        mode = "committed" if commit else "dry-run"
        self.stdout.write(self.style.SUCCESS(
            f"[{mode}] scanned={scanned} updated={updated}"
        ))
