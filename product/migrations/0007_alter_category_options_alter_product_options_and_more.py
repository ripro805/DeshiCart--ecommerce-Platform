import re
from django.db import migrations, models


def _slugify(value):
    value = (value or "").lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-")


def backfill(apps, schema_editor):
    Category = apps.get_model("product", "Category")
    Product = apps.get_model("product", "Product")
    used = set()
    for c in Category.objects.all().order_by("id"):
        base = _slugify(c.name) or f"category-{c.pk}"
        cand = base[:120]
        i = 2
        while cand in used or Category.objects.filter(slug=cand).exclude(pk=c.pk).exists():
            suf = f"-{i}"
            cand = (base[: 120 - len(suf)] + suf)
            i += 1
        c.slug = cand
        c.save(update_fields=["slug"])
        used.add(cand)
    used_s = set()
    used_k = set()
    for p in Product.objects.all().order_by("id"):
        if p.category_id:
            base = _slugify(f"{p.category.name}-{p.pk}-{p.name}")
        else:
            base = _slugify(f"product-{p.pk}-{p.name}")
        cand = base[:240]
        i = 2
        while cand in used_s or Product.objects.filter(slug=cand).exclude(pk=p.pk).exists():
            suf = f"-{i}"
            cand = (base[: 240 - len(suf)] + suf)
            i += 1
        p.slug = cand
        used_s.add(cand)
        kc = f"LEG-{p.pk:05d}"
        j = 2
        while kc in used_k or Product.objects.filter(sku=kc).exclude(pk=p.pk).exists():
            kc = f"LEG-{p.pk:05d}-{j}"
            j += 1
        p.sku = kc
        used_k.add(kc)
        p.save(update_fields=["slug", "sku"])


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [("product", "0006_rename_date_review_created_at_review_updated_at")]

    operations = [
        migrations.AlterModelOptions(name="category", options={"ordering": ["name"], "verbose_name_plural": "Categories"}),
        migrations.AlterModelOptions(name="product", options={"ordering": ["-created_at"]}),
        # Category.image: add the column in the DB and update state to match
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE product_category ADD COLUMN image varchar(500) NULL;",
                    reverse_sql="ALTER TABLE product_category DROP COLUMN image;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name="category",
                    name="image",
                    field=models.URLField(blank=True, max_length=500, null=True),
                ),
            ],
        ),
        migrations.AddField(
            model_name="category",
            name="slug",
            field=models.SlugField(default="", max_length=120),
            preserve_default=False,
        ),
        # Product fields — use raw ALTER TABLE for fields that would trigger _remake_table
        # (non-unique fields with defaults would otherwise rebuild the table from
        # state model which includes JSONField columns with broken defaults)
        migrations.RunSQL(
            sql=[
                "ALTER TABLE product_product ADD COLUMN brand varchar(80) NOT NULL DEFAULT '';",
                "ALTER TABLE product_product ADD COLUMN discounted_price decimal(10,2) NULL;",
                "ALTER TABLE product_product ADD COLUMN image_external_url varchar(500) NULL;",
                "ALTER TABLE product_product ADD COLUMN rating decimal(3,2) NOT NULL DEFAULT 0;",
                "ALTER TABLE product_product ADD COLUMN short_description varchar(280) NOT NULL DEFAULT '';",
                "ALTER TABLE product_product ADD COLUMN sku varchar(40) NOT NULL DEFAULT '';",
                "ALTER TABLE product_product ADD COLUMN slug varchar(240) NOT NULL DEFAULT '';",
                "ALTER TABLE product_product ADD COLUMN total_reviews integer NOT NULL DEFAULT 0;",
            ],
            reverse_sql=[
                "ALTER TABLE product_product DROP COLUMN brand;",
                "ALTER TABLE product_product DROP COLUMN discounted_price;",
                "ALTER TABLE product_product DROP COLUMN image_external_url;",
                "ALTER TABLE product_product DROP COLUMN rating;",
                "ALTER TABLE product_product DROP COLUMN short_description;",
                "ALTER TABLE product_product DROP COLUMN sku;",
                "ALTER TABLE product_product DROP COLUMN slug;",
                "ALTER TABLE product_product DROP COLUMN total_reviews;",
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(model_name="product", name="brand", field=models.CharField(blank=True, default="", max_length=80)),
                migrations.AddField(model_name="product", name="discounted_price", field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                migrations.AddField(model_name="product", name="image_external_url", field=models.URLField(blank=True, max_length=500, null=True)),
                migrations.AddField(model_name="product", name="rating", field=models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                migrations.AddField(model_name="product", name="short_description", field=models.CharField(blank=True, default="", max_length=280)),
                migrations.AddField(model_name="product", name="sku", field=models.CharField(default="", max_length=40)),
                migrations.AddField(model_name="product", name="slug", field=models.SlugField(default="", max_length=240)),
                migrations.AddField(model_name="product", name="total_reviews", field=models.PositiveIntegerField(default=0)),
            ],
        ),
        # JSONField columns: bypass _remake_table by using RunSQL with raw DEFAULT '[]' (sqlite-friendly)
        migrations.RunSQL(
            sql=[
                "ALTER TABLE product_product ADD COLUMN gallery json NOT NULL DEFAULT '[]';",
                "ALTER TABLE product_product ADD COLUMN specifications json NOT NULL DEFAULT '{}';",
                "ALTER TABLE product_product ADD COLUMN tags json NOT NULL DEFAULT '[]';",
            ],
            reverse_sql=[
                "ALTER TABLE product_product DROP COLUMN gallery;",
                "ALTER TABLE product_product DROP COLUMN specifications;",
                "ALTER TABLE product_product DROP COLUMN tags;",
            ],
        ),
        migrations.RunPython(backfill, reverse_noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL("CREATE UNIQUE INDEX product_cat_slug_uniq ON product_category(slug);", reverse_sql="DROP INDEX IF EXISTS product_cat_slug_uniq;"),
                migrations.RunSQL("CREATE UNIQUE INDEX product_prod_slug_uniq ON product_product(slug);", reverse_sql="DROP INDEX IF EXISTS product_prod_slug_uniq;"),
                migrations.RunSQL("CREATE UNIQUE INDEX product_prod_sku_uniq ON product_product(sku);", reverse_sql="DROP INDEX IF EXISTS product_prod_sku_uniq;"),
            ],
            state_operations=[
                migrations.AlterField(model_name="category", name="slug", field=models.SlugField(max_length=120, unique=True)),
                migrations.AlterField(model_name="product", name="slug", field=models.SlugField(max_length=240, unique=True)),
                migrations.AlterField(model_name="product", name="sku", field=models.CharField(max_length=40, unique=True)),
                migrations.AlterField(model_name="product", name="gallery", field=models.JSONField(blank=True, default=list)),
                migrations.AlterField(model_name="product", name="specifications", field=models.JSONField(blank=True, default=dict)),
                migrations.AlterField(model_name="product", name="tags", field=models.JSONField(blank=True, default=list)),
            ],
        ),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["slug"], name="product_pro_slug_33a021_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["sku"], name="product_pro_sku_34f508_idx")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["category"], name="product_pro_categor_2b9d78_idx")),
    ]
