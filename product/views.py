from rest_framework.response import Response
from .models import Category, SubCategory, Brand, Tag, Attribute, Product, Review, StockLog
from .serializers import (
    ProductSerializer, CategorySerializer, SubCategorySerializer, BrandSerializer,
    TagSerializer, AttributeSerializer, ReviewSerializer, AdminProductSerializer,
    AdminReviewSerializer, StockLogSerializer,
)
from django.db.models import Count, Avg, Q
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.mixins import ListModelMixin, CreateModelMixin
from rest_framework.generics import RetrieveUpdateDestroyAPIView, ListAPIView, CreateAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ProductFilter
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from .paginations import DefaultPagination
from api.permissions import IsAdminOrReadOnly, IsAdmin
from api.responses import api_response
from .permissions import IsReviewAuthorOrReadonly

class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related('category', 'subcategory', 'brand_ref').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    # filterset_fields = ['category_id']
    filterset_class = ProductFilter
    search_fields = ['name', 'description','category__name']
    ordering_fields = ['price', 'created_at']
    pagination_class = DefaultPagination
    permission_classes = [IsAdminOrReadOnly]
    # def get_permissions(self):
    #     if self.request.method == 'GET':
    #         return [AllowAny()]
    #     return [IsAdminUser()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=204)

    @action(detail=False, methods=['get'], url_path='low-stock', permission_classes=[IsAdmin])
    def low_stock(self, request):
        qs = self.get_queryset().filter(stock__lte=10)
        return api_response(ProductSerializer(qs, many=True, context={'request': request}).data)


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.annotate(product_count=Count('products')).all()
    serializer_class = CategorySerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    pagination_class = DefaultPagination
    permission_classes = [IsAdminOrReadOnly]


class SubCategoryViewSet(ModelViewSet):
    queryset = SubCategory.objects.select_related('category').all()
    serializer_class = SubCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'category__name']


class BrandViewSet(ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class TagViewSet(ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = DefaultPagination


class AttributeViewSet(ModelViewSet):
    queryset = Attribute.objects.all()
    serializer_class = AttributeSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = DefaultPagination


class StockLogViewSet(ModelViewSet):
    queryset = StockLog.objects.select_related('product', 'created_by').all()
    serializer_class = StockLogSerializer
    permission_classes = [IsAdmin]
    pagination_class = DefaultPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['product__name']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminProductViewSet(ModelViewSet):
    """Full CRUD for the admin product management screen."""

    queryset = Product.objects.select_related('category', 'subcategory', 'brand_ref').all()
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdmin]
    pagination_class = DefaultPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'sku', 'category__name', 'brand_ref__name']
    ordering_fields = ['price', 'stock', 'created_at', 'name']
    filterset_fields = ['is_active', 'is_featured', 'category', 'brand_ref']

    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        try:
            change = int(request.data.get('change', 0))
        except (TypeError, ValueError):
            return api_response(None, message='change must be an integer.', success=False, status=400)
        reason = request.data.get('reason', 'ADJUSTMENT')
        note = request.data.get('note', '')
        product.stock = max(0, product.stock + change)
        product.save(update_fields=['stock'])
        log = StockLog.objects.create(product=product, change=change, reason=reason, note=note, created_by=request.user)
        return api_response(StockLogSerializer(log).data, message='Stock adjusted.')


class AdminReviewViewSet(ModelViewSet):
    queryset = Review.objects.select_related('user', 'product').all()
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdmin]
    pagination_class = DefaultPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [
        'product__name',
        'product__sku',
        'user__email',
        'user__first_name',
        'user__last_name',
        'comment',
        'name',
    ]
    filterset_fields = ['status', 'ratings', 'product', 'user', 'verified_purchase']
    ordering_fields = ['created_at', 'updated_at', 'ratings', 'helpful_count', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Review.objects.select_related('user', 'product').all()

    def _set_status(self, review, target_status, message):
        review.status = target_status
        review.save(update_fields=['status', 'updated_at'])
        return api_response(
            AdminReviewSerializer(review).data,
            message=message,
        )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        return self._set_status(self.get_object(), 'APPROVED', 'Review approved.')

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        return self._set_status(self.get_object(), 'REJECTED', 'Review rejected.')

    @action(detail=True, methods=['post'], url_path='hide')
    def hide(self, request, pk=None):
        return self._set_status(self.get_object(), 'HIDDEN', 'Review hidden.')

    @action(detail=True, methods=['post'], url_path='spam')
    def spam(self, request, pk=None):
        return self._set_status(self.get_object(), 'SPAM', 'Review flagged as spam.')

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """Flip a hidden / spam review back to APPROVED."""
        return self._set_status(self.get_object(), 'APPROVED', 'Review restored.')

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_update(self, request):
        """Bulk status update.

        Request body::
            {
                "ids": [1, 2, 3],
                "action": "approve" | "reject" | "hide" | "spam"
            }
        """
        ids = request.data.get('ids') or []
        action_name = request.data.get('action')
        mapping = {
            'approve': 'APPROVED',
            'reject': 'REJECTED',
            'hide': 'HIDDEN',
            'spam': 'SPAM',
        }
        target = mapping.get(action_name)
        if not isinstance(ids, list) or not ids or target is None:
            return api_response(
                None,
                success=False,
                message='Provide ids (list) and a valid action.',
                status=400,
            )
        updated = Review.objects.filter(id__in=ids).update(status=target)
        return api_response(
            {'updated': updated, 'action': action_name},
            message=f'{updated} reviews updated.',
        )


class ReviewViewSet(ModelViewSet):
    """Storefront reviews scoped to a single product via ``product_pk``.

    Bug 3 fix: drop the dead lowercase role-string branch and gate staff
    visibility via Django auth flags (``is_staff`` / ``is_superuser``).
    Security 3 fix: enforce verified-purchase in ``perform_create`` --
    a reviewer may only set ``verified_purchase=True`` if they have a
    DELIVERED order line for the product. Unverified reviews are still
    accepted and persisted with ``verified_purchase=False``.
    """
    serializer_class = ReviewSerializer
    permission_classes = [IsReviewAuthorOrReadonly]

    def perform_create(self, serializer):
        product_id = self.kwargs.get("product_pk")
        user = self.request.user
        verified = bool(serializer.validated_data.get("verified_purchase", False))

        if verified:
            from order.models import Order

            actually_purchased = Order.objects.filter(
                user=user,
                items__product_id=product_id,
                status=Order.DELIVERED,
            ).exists()
            if not actually_purchased:
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "verified_purchase=True requires a delivered order for this product."
                )

        serializer.save(user=self.request.user, verified_purchase=verified)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        """Storefront visibility:
        - Anonymous / non-staff: only APPROVED reviews
        - Authors of the review: their own reviews (any status)
        - Staff / superuser: all reviews for moderation
        """
        qs = Review.objects.filter(product_id=self.kwargs["product_pk"]).select_related("user", "product")
        user = self.request.user
        if user and user.is_authenticated and (
            getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)
        ):
            return qs
        if user and user.is_authenticated:
            return qs.filter(Q(status="APPROVED") | Q(user=user))
        return qs.filter(status="APPROVED")

    def get_serializer_context(self):
        return {"product_id": self.kwargs["product_pk"]}


class ProductStatsView(APIView):
    """Aggregate stats for the admin dashboard."""

    permission_classes = [IsAdmin]

    def get(self, request):
        total = Product.objects.count()
        active = Product.objects.filter(is_active=True).count()
        featured = Product.objects.filter(is_featured=True).count()
        low_stock = Product.objects.filter(stock__lte=10).count()
        out_of_stock = Product.objects.filter(stock=0).count()
        avg_price = Product.objects.aggregate(avg=Avg('price'))['avg'] or 0
        by_category = list(
            Category.objects.annotate(count=Count('products')).values('id', 'name', 'count')
        )
        return api_response({
            'total': total,
            'active': active,
            'featured': featured,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'average_price': float(avg_price),
            'by_category': by_category,
        })