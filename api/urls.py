"""Top-level API URL configuration."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from product.product_urls import urlpatterns as product_urlpatterns
from product.categories_urls import urlpatterns as category_urlpatterns
from users.views import UserViewSet, AddressViewSet, MeViewSet

router = DefaultRouter()
router.register("admin/users", UserViewSet, basename="admin-users")
router.register("customer/addresses", AddressViewSet, basename="customer-addresses")

me_list = MeViewSet.as_view({"get": "list", "patch": "partial_update"})
me_password = MeViewSet.as_view({"post": "change_password"})
me_dashboard = MeViewSet.as_view({"get": "dashboard"})

urlpatterns = [
    path("", include("product.product_urls")),
    path("categories/", include("product.categories_urls")),
    path("", include("order.urls")),
    path("auth/", include("djoser.urls")),
    path("auth/", include("djoser.urls.jwt")),
    path("customer/me/", me_list, name="customer-me"),
    path("customer/me/change-password/", me_password, name="customer-me-password"),
    path("customer/me/dashboard/", me_dashboard, name="customer-me-dashboard"),
    path("", include(router.urls)),
    path("admin/", include("admin_panel.urls")),
    path("coupons/", include("coupons.urls")),
    path("shipping/", include("shipping.urls")),
    path("returns/", include("returns.urls")),
    path("notifications/", include("notifications_app.urls")),
    path("finance/", include("finance.urls")),
    path("cms/", include("cms.urls")),
    path("marketing/", include("marketing.urls")),
    path("support/", include("support.urls")),
    path("store/", include("storesettings.urls")),
    path("appearance/", include("appearance.urls")),
    path("analytics/", include("analytics.urls")),
    path("reports/", include("reports.urls")),
    path("content/", include("content.urls")),
    path("customer/", include("wishlist.urls")),
    path("wishlist/", include("wishlist.admin_urls")),
    path("customer/", include("coupons.customer_urls")),
    path("customer/", include("notifications_app.customer_urls")),
    path("customer/", include("marketing.customer_urls")),
    path("customer/", include("cms.customer_urls")),
    path("customer/", include("support.customer_urls")),
    path("customer/", include("returns.customer_urls")),
    path("store/", include("storesettings.customer_urls")),
    path("store/", include("appearance.customer_urls")),
]  
