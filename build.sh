#!/usr/bin/env bash
# Render build script for the Django backend.
# Render runs this from the repo root with bash; pip is on PATH.
set -o errexit
set -o pipefail

echo "---- installing python deps ----"
pip install --upgrade pip
pip install -r requirements.txt

echo "---- collecting static files ----"
python manage.py collectstatic --noinput

echo "---- running database migrations ----"
python manage.py migrate --noinput

# NOTE: products/categories seed is performed by an out-of-band script
# (_loader_v3.py against $DATABASE_URL) because the in-repo fixture
# (fixtures/product_data.json) does not include required fields like
# Product.slug / Product.sku and would otherwise insert broken rows.
# Categories count probe (informational only):
COUNT=$( { python manage.py shell -c "from product.models import Category; print(Category.objects.count())" 2>/dev/null || true; } | tail -n 1 | tr -d "\r\n " || true)
echo "---- DB probe: $COUNT categories present (use _loader_v3.py to seed products) ----"
