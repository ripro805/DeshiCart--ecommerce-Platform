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
    queryset = Product.objects.select_related('category').all()
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

    queryset = Product.objects.select_related('category', 'subcategory', 'brand_ref').prefetch_related('tags').all()
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
    search_fields = ['product__name', 'user__email', 'comment']
    filterset_fields = ['status']

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        review = self.get_object()
        review.status = 'APPROVED'
        review.save(update_fields=['status'])
        return api_response(AdminReviewSerializer(review).data, message='Review approved.')

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        review = self.get_object()
        review.status = 'REJECTED'
        review.save(update_fields=['status'])
        return api_response(AdminReviewSerializer(review).data, message='Review rejected.')


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsReviewAuthorOrReadonly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['product_pk'])

    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}


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