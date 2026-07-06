from django_filters.rest_framework import FilterSet, NumberFilter

from product.models import Product


class ProductFilter(FilterSet):
    """Filter set used by `/api/products/`.

    The frontend sends `min_price` / `max_price` (and `category`) so we
    expose those names directly rather than django-filter's default
    `price__gte` / `price__lte`.
    """

    min_price = NumberFilter(field_name="price", lookup_expr="gte")
    max_price = NumberFilter(field_name="price", lookup_expr="lte")
    category = NumberFilter(field_name="category_id")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price"]
