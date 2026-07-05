"""Finance admin routes."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, TransactionViewSet, FinanceSummaryView

router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="admin-expenses")
router.register("transactions", TransactionViewSet, basename="admin-transactions")

urlpatterns = [
    path("summary/", FinanceSummaryView.as_view({"get": "list"}), name="admin-finance-summary"),
    path("", include(router.urls)),
]
