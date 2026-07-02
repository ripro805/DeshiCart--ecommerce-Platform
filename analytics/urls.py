"""Analytics routes."""
from django.urls import path

from .views import (
    SalesAnalyticsView,
    TopProductsView,
    CustomerAnalyticsView,
    PaymentBreakdownView,
)

urlpatterns = [
    path("sales/", SalesAnalyticsView.as_view(), name="analytics-sales"),
    path("top-products/", TopProductsView.as_view(), name="analytics-top-products"),
    path("customers/", CustomerAnalyticsView.as_view(), name="analytics-customers"),
    path("payments/", PaymentBreakdownView.as_view(), name="analytics-payments"),
] 
