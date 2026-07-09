"""
Render-compatible WSGI entry point.

Render's `runtime: python` default expects `gunicorn app:app` — i.e. a top-level
`app` module exposing a WSGI callable named `app`. We re-export the canonical
Django WSGI application from `deshicart.wsgi` under that name so Render's
default start command works without overriding anything in the dashboard.

This shim also wires the in-repo `vendor/` directory onto `sys.path` so the
vendored `sslcommerz_python` package shadows the broken PyPI distribution on
Python 3.13+.
"""
import os
import sys
from pathlib import Path

_VENDOR_DIR = Path(__file__).resolve().parent / "vendor"
if str(_VENDOR_DIR) not in sys.path:
    sys.path.insert(0, str(_VENDOR_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "deshicart.settings")

from deshicart.wsgi import application  # noqa: E402

# Render's default gunicorn app:app target.
app = application