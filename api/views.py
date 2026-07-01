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
