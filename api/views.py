from django.db import connection
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health endpoint for Render healthCheckPath. Returns 200 when DB is reachable, 503 otherwise."""
    db_ok = False
    try:
        connection.ensure_connection()
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        db_ok = True
    except Exception:
        db_ok = False
    payload = {"status": "ok" if db_ok else "degraded", "database": db_ok}
    code = 200 if db_ok else 503
    return JsonResponse(payload, status=code)


from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.urls import reverse

@api_view(['GET'])
def api_home(request):
    # Build useful API root links
    api_links = {
        "products": request.build_absolute_uri(reverse('products-list')),
        "categories": request.build_absolute_uri(reverse('category-list')),
        "carts": request.build_absolute_uri(reverse('carts-list')),
        "cart-items": request.build_absolute_uri(reverse('cart-items-list')),
    }
    return JsonResponse({
        "message": "Welcome to the PhiMart API!",
        "links": api_links
    })


from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health endpoint used by Render. 200 when DB is reachable, 503 otherwise."""
    db_ok = False
    try:
        connection.ensure_connection()
        with connection.cursor() as cur:
            cur.execute('SELECT 1')
            cur.fetchone()
        db_ok = True
    except Exception:
        db_ok = False
    payload = {'status': 'ok' if db_ok else 'degraded', 'database': db_ok}
    code = 200 if db_ok else 503
    from django.http import JsonResponse
    return JsonResponse(payload, status=code)