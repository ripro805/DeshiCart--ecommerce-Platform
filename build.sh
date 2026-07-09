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
