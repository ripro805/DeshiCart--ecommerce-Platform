# Generated for the Product Review module fix.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def backfill_verified_purchase(apps, schema_editor):
    """Mark every existing review whose author has a completed/delivered order
    containing this product as a verified purchase. Backward-compatible —
    leaves every other review at the default ``False``.
    """
    Review = apps.get_model("product", "Review")
    # Late-import the order app's models if it exists; otherwise skip.
    try:
        OrderItem = apps.get_model("order", "OrderItem")
    except LookupError:
        return
    # Collect review IDs whose product shows up in any user-owned OrderItem
    # belonging to a non-cancelled order.
    delivered_statuses = {"DELIVERED", "SHIPPED", "CONFIRMED", "PROCESSING"}
    ids = set()
    for item in (
        OrderItem.objects.select_related("order")
        .filter(order__status__in=delivered_statuses)
        .only("order__user_id", "product_id")
    ):
        ids.add((item.order.user_id, item.product_id))
    if not ids:
        return
    updated = 0
    for review in Review.objects.select_related("user").iterator():
        if (review.user_id, review.product_id) in ids:
            review.verified_purchase = True
            review.save(update_fields=["verified_purchase"])
            updated += 1
    return updated


def noop_reverse(apps, schema_editor):
    """Reverse migration is a no-op; the columns simply go away."""
    return None


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0009_category_is_active"),
    ]

    operations = [
        migrations.AlterField(
            model_name="review",
            name="status",
            field=models.CharField(
                choices=[
                    ("PENDING", "Pending"),
                    ("APPROVED", "Approved"),
                    ("REJECTED", "Rejected"),
                    ("HIDDEN", "Hidden"),
                    ("SPAM", "Spam"),
                ],
                default="PENDING",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="review",
            name="verified_purchase",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="review",
            name="helpful_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["status"], name="review_status_idx"),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(
                fields=["product", "status"], name="review_prod_stat_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["ratings"], name="review_ratings_idx"),
        ),
        migrations.RunPython(backfill_verified_purchase, noop_reverse),
    ]