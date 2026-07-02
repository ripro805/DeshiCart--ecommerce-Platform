"""
Django settings for deshicart project.
"""

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-_-sw+995f4t48rwyxucty93nmor3r&u0(secce*$8+36=xcv3-'
DEBUG = True
ALLOWED_HOSTS = []
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
    'debug_toolbar',
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.APIResponseEnvelopeMiddleware',
]

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
    'AUTH_HEADER_TYPES': ('JWT',),
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
}

DJOSER = {
    'SERIALIZERS': {
        'user_create': 'users.serializers.UserCreateSerializer',
        'current_user': 'users.serializers.UserCreateSerializer',
    },
}

SSLCOMMERZ = {
    'STORE_ID': 'deshi6a43dadb57717',
    'STORE_PASSWD': 'deshi6a43dadb57717@ssl',
    'IS_SANDBOX': True,
    'CURRENCY': 'BDT',
    'SUCCESS_URL': '/api/payment/success/',
    'FAIL_URL': '/api/payment/fail/',
    'CANCEL_URL': '/api/payment/cancel/',
    'IPN_URL': '/api/payment/ipn/',
    'FRONTEND_BASE_URL': 'http://localhost:3000',
}

FRONTEND_URLS = {
    'SUCCESS': 'http://localhost:3000/order/success',
    'FAIL': 'http://localhost:3000/order/failed',
    'CANCEL': 'http://localhost:3000/order/cancelled',
}
