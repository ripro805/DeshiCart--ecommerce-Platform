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

# Idempotent seed via _loader_v3.py (uses $DATABASE_URL).
# The loader no-ops when _split/_manifest.json and seed_data/_manifest.json are
# both absent, so this is safe even when the dataset has not been committed.
if [ -f "_split/_manifest.json" ] || [ -f "seed_data/_manifest.json" ]; then
  echo "---- seeding initial dataset via _loader_v3.py ----"
  python _loader_v3.py || echo "loader_v3 failed (continuing)"
else
  echo "---- no seed manifest found (skipped) ----"
fi
