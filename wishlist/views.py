"""Wishlist views."""
from django.shortcuts import get_object_or_404
from rest_framework import status as drf_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from api.responses import api_response

from .models import Wishlist, WishlistItem
from product.models import Product
from .serializers import WishlistSerializer, WishlistItemSerializer


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Wishlist.objects.all().select_related("user").prefetch_related("items__product")
        return Wishlist.objects.filter(user=self.request.user).select_related("user").prefetch_related("items__product")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        wishlist = self.get_object()
        if wishlist.user_id != request.user.id and not request.user.is_staff:
            return api_response(None, message="Forbidden.", success=False, http_status=drf_status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        wishlist = self.get_object()
        if wishlist.user_id != request.user.id and not request.user.is_staff:
            return api_response(None, message="Forbidden.", success=False, http_status=drf_status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="items")
    def add_item(self, request, pk=None):
        wishlist = self.get_object()
        if wishlist.user_id != request.user.id and not request.user.is_staff:
            return api_response(None, message="Forbidden.", success=False, http_status=drf_status.HTTP_403_FORBIDDEN)
        product_id = request.data.get("product_id")
        if not product_id:
            return api_response(None, message="product_id required.", success=False, http_status=drf_status.HTTP_400_BAD_REQUEST)
        product = get_object_or_404(Product, pk=product_id)
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        return api_response(
            WishlistItemSerializer(item).data,
            message="Added." if created else "Already in wishlist.",
            http_status=drf_status.HTTP_201_CREATED if created else drf_status.HTTP_200_OK,
        )

    @action(detail=True, methods=["delete"], url_path=r"items/(?P<item_id>\d+)")
    def remove_item(self, request, pk=None, item_id=None):
        wishlist = self.get_object()
        if wishlist.user_id != request.user.id and not request.user.is_staff:
            return api_response(None, message="Forbidden.", success=False, http_status=drf_status.HTTP_403_FORBIDDEN)
        WishlistItem.objects.filter(wishlist=wishlist, pk=item_id).delete()
        return api_response(None, message="Removed.", http_status=drf_status.HTTP_204_NO_CONTENT)

