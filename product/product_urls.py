"""URL routing for products."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet, ReviewViewSet, AdminProductViewSet, AdminReviewViewSet,
    BrandViewSet, TagViewSet, AttributeViewSet, SubCategoryViewSet, StockLogViewSet,
    ProductStatsView,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="products")
router.register("admin/products", AdminProductViewSet, basename="admin-products")
router.register("admin/reviews", AdminReviewViewSet, basename="admin-reviews")
router.register("admin/subcategories", SubCategoryViewSet, basename="admin-subcategories")
router.register("admin/brands", BrandViewSet, basename="admin-brands")
router.register("admin/tags", TagViewSet, basename="admin-tags")
router.register("admin/attributes", AttributeViewSet, basename="admin-attributes")
router.register("admin/stock-logs", StockLogViewSet, basename="admin-stock-logs")
router.register("brands", BrandViewSet, basename="brands")
router.register("tags", TagViewSet, basename="tags")

urlpatterns = [
    path("admin/products/stats/", ProductStatsView.as_view(), name="admin-product-stats"),
    path("products/<int:product_pk>/reviews/", ReviewViewSet.as_view({"get": "list", "post": "create"}), name="product-reviews"),
    path("products/<int:product_pk>/reviews/<int:pk>/", ReviewViewSet.as_view({"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}), name="product-review-detail"),
    path("", include(router.urls)),
]
