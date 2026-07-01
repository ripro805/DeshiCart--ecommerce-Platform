from django.shortcuts import render
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, DestroyModelMixin
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from order import serializers as orderSz
from order.serializers import (
    CartSerializer, CartItemSerializer, AddCartItemSerializer,
    UpdateCartItemSerializer, InitiatePaymentSerializer, PaymentSerializer,
)
from order.models import Cart, CartItem, Order, OrderItem, Payment
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from order.services import OrderService, PaymentService
from rest_framework.response import Response
from django.conf import settings


class CartViewSet(CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return Cart.objects.prefetch_related('items__product').filter(user=self.request.user)


class CartItemViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AddCartItemSerializer
        elif self.request.method == 'PATCH':
            return UpdateCartItemSerializer
        return CartItemSerializer

    def get_serializer_context(self):
        return {'cart_id': self.kwargs['cart_pk']}

    def get_queryset(self):
        return CartItem.objects.select_related('product').filter(cart_id=self.kwargs['cart_pk'])


class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'delete', 'patch', 'head', 'options']

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        OrderService.cancel_order(order=order, user=request.user)
        return Response({'status': 'Order canceled'})

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = orderSz.UpdateOrderSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': f"Order status updated to {request.data['status']}"})

    def get_permissions(self):
        if self.action in ['update_status', 'destroy', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'cancel':
            return orderSz.EmptySerializer
        if self.action == 'create':
            return orderSz.CreateOrderSerializer
        if self.action in ['update_status', 'update', 'partial_update']:
            return orderSz.UpdateOrderSerializer
        return orderSz.OrderSerializer

    def get_serializer_context(self):
        return {'user_id': self.request.user.id, 'user': self.request.user}

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.prefetch_related('items__product').all()
        return Order.objects.prefetch_related('items__product').filter(user=self.request.user)


class OrderItemViewSet(ModelViewSet):
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']
    serializer_class = orderSz.OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return OrderItem.objects.select_related('product', 'order').all()
        return OrderItem.objects.select_related('product', 'order').filter(order__user=self.request.user)


class PaymentViewSet(GenericViewSet):
    """SSLCommerz payment gateway endpoints."""
    serializer_class = InitiatePaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.select_related('order').all()
        return Payment.objects.select_related('order').filter(order__user=self.request.user)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = Order.objects.get(pk=serializer.validated_data['order_id'])
        result = PaymentService.initiate_payment(order=order, request=request)
        return Response(result)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def success(self, request):
        tran_id = request.data.get('tran_id') or request.query_params.get('tran_id')
        payment = PaymentService.mark_success(tran_id=tran_id, payload=dict(request.data))
        if not payment:
            return Response({'detail': 'Unknown transaction'}, status=404)
        redirect = settings.FRONTEND_URLS['SUCCESS'] + f"?order={payment.order.id}"
        return Response({'status': 'success', 'order_id': payment.order.id, 'redirect': redirect})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def fail(self, request):
        tran_id = request.data.get('tran_id') or request.query_params.get('tran_id')
        PaymentService.mark_failed(tran_id=tran_id, payload=dict(request.data))
        return Response({'redirect': settings.FRONTEND_URLS['FAIL']})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def cancel(self, request):
        tran_id = request.data.get('tran_id') or request.query_params.get('tran_id')
        PaymentService.mark_cancelled(tran_id=tran_id, payload=dict(request.data))
        return Response({'redirect': settings.FRONTEND_URLS['CANCEL']})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def ipn(self, request):
        valid = PaymentService.validate_ipn(payload=dict(request.data))
        return Response({'valid': valid})
