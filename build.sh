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

echo "---- seeding initial data (idempotent, only if DB is empty) ----"
COUNT=$( { python manage.py shell -c "from product.models import Product; print(Product.objects.count())" 2>/dev/null || true; } | tail -n 1 | tr -d "\r\n " || true)
if [ -z "$COUNT" ]; then
  echo "Could not probe product count - skipping seed"
elif [ "$COUNT" = "0" ]; then
  echo "DB has no products - loading fixtures/product_data.json"
  python manage.py loaddata fixtures/product_data.json || echo "loaddata failed (continuing)"
else
  echo "DB already has $COUNT products - skipping seed"
fi
