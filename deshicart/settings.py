"""
Django settings for deshicart project.
"""

import os
from pathlib import Path
from datetime import timedelta

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

# Sec 6: production-safe DEBUG toggle. Default off; opt-in for local dev via DJANGO_DEBUG=true.
_DEBUG_RAW = os.environ.get('DJANGO_DEBUG', 'False').strip().lower()
DEBUG = _DEBUG_RAW in ('true', '1', 'yes', 'on')
# Sec 5: SECRET_KEY must come from environment in production.
# Falls back to the dev-only insecure key for local SQLite work, but
# refuses to start in production with DEBUG=False if it's still the dev key.
_DEV_SECRET_KEY = 'django-insecure-_-sw+995f4t48rwyxucty93nmor3r&u0(secce*$8+36=xcv3-'
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or _DEV_SECRET_KEY
if not DEBUG and SECRET_KEY == _DEV_SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY env var is required when DEBUG=False")
# Sec 5: ALLOWED_HOSTS must come from environment in production.
_ALLOWED_HOSTS_DEFAULT = 'localhost,127.0.0.1,[::1],testserver,0.0.0.0'
ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get('DJANGO_ALLOWED_HOSTS', _ALLOWED_HOSTS_DEFAULT).split(',')
    if h.strip()
]
AUTH_USER_MODEL = 'users.User'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_filters',
    'rest_framework',
    'djoser',
    'rest_framework_simplejwt.token_blacklist',
    'api',
    'product',
    'users',
    'order',
    'admin_panel',
    'analytics',
    'appearance',
    'cms',
    'content',
    'coupons',
    'finance',
    'marketing',
    'notifications_app',
    'reports',
    'returns',
    'shipping',
    'storesettings',
    'support',
    'wishlist',
]
if DEBUG:
    INSTALLED_APPS.append('debug_toolbar')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.APIResponseEnvelopeMiddleware',
]
if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

ROOT_URLCONF = 'deshicart.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'deshicart.wsgi.application'

INTERNAL_IPS = ['127.0.0.1']

# Database routing.
# Default: SQLite (local dev, fast iteration).
# To switch to Neon PostgreSQL set USE_NEON=True in .env (DATABASE_URL required).
if os.environ.get('USE_NEON', 'False').lower() in ('true', '1', 'yes'):
    _db_url = os.environ.get('DATABASE_URL')
    if not _db_url:
        raise RuntimeError('USE_NEON=True but DATABASE_URL is not set in .env')
    DATABASES = {
        'default': dj_database_url.config(
            default=_db_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# First-party static assets (favicon, robots.txt, etc.) live here and must be collected too.
STATICFILES_DIRS = [BASE_DIR / 'static']
# Use the non-manifest variant: CompressedManifestStaticFilesStorage requires a
# perfectly consistent staticfiles.json and 500s on the first stale entry in production.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Production-only HTTPS hardening (Render terminates TLS).
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'COERCE_DECIMAL_TO_STRING': False,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'api.pagination.StandardResultsSetPagination',
    'DEFAULT_THROTTLE_RATES': {'anon': '60/min', 'user': '240/min'},
}

SIMPLE_JWT = {
    # Accept both modern "Bearer" and legacy "JWT" prefixes.
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT'),
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

DJOSER = {
    'SERIALIZERS': {
        'user_create': 'users.serializers.UserCreateSerializer',
        'current_user': 'users.serializers.UserSerializer',
        'user': 'users.serializers.UserSerializer',
    },
}

# Public origin that SSLCommerz should redirect/POST back to. Must be
# reachable from the sandbox — for local dev we accept http://localhost:8000
# but the caller can override with ``SSLCOMMERZ_BACKEND_URL`` (e.g.
# ``https://api.example.com`` in production).
_BACKEND_URL = os.environ.get('SSLCOMMERZ_BACKEND_URL', 'http://localhost:8000').rstrip('/')

SSLCOMMERZ = {
    'STORE_ID': os.environ.get('SSLCOMMERZ_STORE_ID', 'deshi6a43dadb57717'),
    'STORE_PASSWD': os.environ.get('SSLCOMMERZ_STORE_PASSWD', 'deshi6a43dadb57717@ssl'),
    'IS_SANDBOX': os.environ.get('SSLCOMMERZ_IS_SANDBOX', 'true').lower() in ('true', '1', 'yes'),
    'CURRENCY': 'BDT',
    # SSLCommerz redirects the customer's browser (and posts IPN) to these
    # absolute URLs. Relative paths would be joined onto the sandbox host
    # and 404 against ``sandbox.sslcommerz.com``.
    'SUCCESS_URL': f'{_BACKEND_URL}/api/payment/success/',
    'FAIL_URL':    f'{_BACKEND_URL}/api/payment/fail/',
    'CANCEL_URL':  f'{_BACKEND_URL}/api/payment/cancel/',
    'IPN_URL':     f'{_BACKEND_URL}/api/payment/ipn/',
    'BACKEND_URL': _BACKEND_URL,
    'FRONTEND_BASE_URL': 'http://localhost:3000',
}

FRONTEND_URLS = {
    'SUCCESS': 'http://localhost:3000/order/success',
    'FAIL': 'http://localhost:3000/order/failed',
    'CANCEL': 'http://localhost:3000/order/cancelled',
}
