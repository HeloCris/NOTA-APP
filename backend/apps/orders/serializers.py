from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import (
    Order,
    OrderItem,
    OrderStatusHistory,
    ReturnItem,
    ReturnPhoto,
    ReturnRequest,
)


def add_business_days(start_date, days):
    current = start_date
    remaining = int(days or 0)
    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1
    return current


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='store_product.product.name', read_only=True
    )
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    # Removido source='total_price' redundante
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    can_review = serializers.SerializerMethodField()
    review_id = serializers.SerializerMethodField()
    can_edit_review = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'store_product',
            'product_name',
            'quantity',
            'unit_price',
            'total_price',
            'can_review',
            'review_id',
            'can_edit_review',
        ]

    def get_review_id(self, obj):
        review = getattr(obj, 'review', None)
        if review and not review.is_deleted:
            return review.id
        return None

    def get_can_review(self, obj):
        from apps.orders.models import OrderStatus, ReturnRequest, ReturnStatus
        from django.utils import timezone

        order = obj.order
        if order.status != OrderStatus.DELIVERED or not order.delivered_at:
            return False

        if (timezone.now() - order.delivered_at).days > 30:
            return False

        # RN-02: Se já avaliou (inclusive se deletou), não pode avaliar novamente
        if hasattr(obj, 'review'):
            return False

        # RN-04: Devolução em andamento ou aprovada não recusada
        has_return = ReturnRequest.objects.filter(
            order=order, items__order_item=obj
        ).exclude(status=ReturnStatus.REJECTED).exists()
        if not has_return:
            has_return = ReturnRequest.objects.filter(
                order=order
            ).exclude(status=ReturnStatus.REJECTED).exists()

        return not has_return

    def get_can_edit_review(self, obj):
        from django.utils import timezone
        review = getattr(obj, 'review', None)
        if not review or review.is_deleted:
            return False
        if review.edited_at is not None:
            return False
        order = obj.order
        if not order.delivered_at or (timezone.now() - order.delivered_at).days > 30:
            return False
        return True


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id',
            'from_status',
            'to_status',
            'actor',
            'actor_name',
            'reason',
            'created_at',
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return 'Sistema'
        full_name = f'{obj.actor.first_name} {obj.actor.last_name}'.strip()
        return full_name or obj.actor.email


class ReturnPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnPhoto
        fields = ['id', 'image']


class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='order_item.store_product.product.name', read_only=True
    )
    unit_price = serializers.DecimalField(
        source='order_item.unit_price',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ReturnItem
        fields = ['id', 'order_item', 'product_name', 'quantity', 'unit_price']


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    photos = ReturnPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = ReturnRequest
        fields = [
            'id',
            'order',
            'status',
            'reason',
            'description',
            'return_tracking_code',
            'resellable',
            'refund_amount',
            'items',
            'photos',
            'created_at',
            'updated_at',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    code = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'code',
            'user',
            'store',
            'status',
            'total_amount',
            'shipping_cost',
            'shipping_service',
            'shipping_address',
            'tracking_code',
            'carrier',
            'carrier_url',
            'shipped_at',
            'delivered_at',
            'delivery_confirmed_by',
            'address_changed',
            'cancel_reason',
            'cancel_requested_at',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = [
            'user',
            'status',
            'created_at',
            'updated_at',
            'address_changed',
            'shipped_at',
            'delivered_at',
            'delivery_confirmed_by',
        ]


# Alias para CustomerOrderSerializer importado no views.py
CustomerOrderSerializer = OrderSerializer


class CustomerOrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    code = serializers.CharField(read_only=True)
    timeline = serializers.SerializerMethodField()
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    return_requests = ReturnRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'code',
            'status',
            'total_amount',
            'shipping_cost',
            'shipping_service',
            'shipping_address',
            'tracking_code',
            'carrier',
            'carrier_url',
            'shipped_at',
            'delivered_at',
            'delivery_confirmed_by',
            'address_changed',
            'cancel_reason',
            'cancel_requested_at',
            'created_at',
            'updated_at',
            'items',
            'timeline',
            'status_history',
            'return_requests',
        ]

    def get_timeline(self, obj):
        steps = [
            ('PENDING', 'Pedido criado', 'Seu pedido foi recebido.'),
            (
                'PAID',
                'Pagamento aprovado',
                'Pagamento confirmado com sucesso.',
            ),
            (
                'PROCESSING',
                'Em separação na loja',
                'A loja preparou seus itens.',
            ),
            (
                'SHIPPED',
                'Enviado pela transportadora',
                'Sua encomenda está a caminho.',
            ),
            ('DELIVERED', 'Entregue', 'Seu pedido foi entregue.'),
        ]

        if obj.status == 'CANCELLED':
            steps.append(
                (
                    'CANCELLED',
                    'Pedido cancelado',
                    obj.cancel_reason or 'O pedido foi cancelado.',
                )
            )
        elif obj.status == 'CANCEL_REQUESTED':
            steps.insert(
                3,
                (
                    'CANCEL_REQUESTED',
                    'Cancelamento solicitado',
                    'Aguardando resposta da loja.',
                ),
            )
        elif obj.status == 'DELIVERY_DISPUTED':
            steps.append(
                (
                    'DELIVERY_DISPUTED',
                    'Entrega contestada',
                    'Contestação em análise com a loja.',
                )
            )
        elif obj.status == 'REFUNDED':
            steps.append(
                (
                    'REFUNDED',
                    'Pedido reembolsado',
                    'O valor foi reembolsado.',
                )
            )

        current_index = next(
            (
                index
                for index, (status_code, _, _) in enumerate(steps)
                if status_code == obj.status
            ),
            -1,
        )
        created_at = (
            obj.created_at.isoformat()
            if getattr(obj, 'created_at', None)
            else None
        )
        updated_at = (
            obj.updated_at.isoformat()
            if getattr(obj, 'updated_at', None)
            else None
        )

        return [
            {
                'status': status_code,
                'label': label,
                'description': description,
                'date': (
                    created_at
                    if index == 0
                    else (updated_at if index == current_index else None)
                ),
                'completed': (
                    index <= current_index if current_index != -1 else False
                ),
                'current': index == current_index,
            }
            for index, (status_code, label, description) in enumerate(steps)
        ]


class ShippingUpdateSerializer(serializers.Serializer):
    carrier = serializers.CharField(
        required=True, allow_blank=False, trim_whitespace=True
    )
    tracking_code = serializers.CharField(
        required=True, allow_blank=False, trim_whitespace=True
    )
    carrier_url = serializers.URLField(
        required=False, allow_blank=True, default=''
    )

    def validate_tracking_code(self, value):
        normalized = value.strip()
        if len(normalized) < 6 or not normalized.isalnum():
            raise serializers.ValidationError(
                'O código de rastreio deve conter pelo menos 6 caracteres'
                ' alfanuméricos.'
            )
        return normalized

    def validate_carrier(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError(
                'A transportadora é obrigatória.'
            )
        return normalized


# Alias para ShipOrderSerializer importado no views.py
ShipOrderSerializer = ShippingUpdateSerializer


class StoreOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    code = serializers.CharField(read_only=True)
    customer_name = serializers.SerializerMethodField()
    dispatch_deadline = serializers.SerializerMethodField()
    urgency_status = serializers.SerializerMethodField()
    is_delayed = serializers.SerializerMethodField()
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    return_requests = ReturnRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'code',
            'status',
            'total_amount',
            'shipping_cost',
            'shipping_service',
            'shipping_address',
            'tracking_code',
            'carrier',
            'carrier_url',
            'shipped_at',
            'delivered_at',
            'delivery_confirmed_by',
            'address_changed',
            'cancel_reason',
            'cancel_requested_at',
            'created_at',
            'updated_at',
            'customer_name',
            'items',
            'dispatch_deadline',
            'urgency_status',
            'is_delayed',
            'status_history',
            'return_requests',
        ]

    def _handling_days(self):
        store = self.context.get('store')
        if store is None:
            return 1
        return getattr(store, 'shipping_handling_days', 1) or 1

    def get_customer_name(self, obj):
        user = obj.user
        name = f'{user.first_name} {user.last_name}'.strip()
        return name or user.email

    def _deadline(self, obj):
        created = obj.created_at
        if timezone.is_aware(created):
            created = timezone.localtime(created)
        return add_business_days(created.date(), self._handling_days())

    def get_dispatch_deadline(self, obj):
        return self._deadline(obj).isoformat()

    def get_urgency_status(self, obj):
        if obj.status not in ('PAID', 'PROCESSING'):
            return None
        deadline = self._deadline(obj)
        today = timezone.localdate()
        if today > deadline:
            return 'DELAYED'
        if today == deadline:
            return 'DUE_TODAY'
        return 'ON_TIME'

    def get_is_delayed(self, obj):
        return self.get_urgency_status(obj) == 'DELAYED'


# Aliases e Subclasses para os endpoints do Lojista
StoreOrderListSerializer = StoreOrderSerializer


class StoreOrderDetailSerializer(StoreOrderSerializer):
    """
    Serializador completo de detalhes do pedido da loja.
    """
    pass


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.CharField(max_length=50)


class CustomerChangeAddressSerializer(serializers.Serializer):
    shipping_street = serializers.CharField(max_length=255)
    shipping_number = serializers.CharField(max_length=20)
    shipping_neighborhood = serializers.CharField(max_length=100)
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=2)
    shipping_zip_code = serializers.CharField(max_length=20)


class CustomerCancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255)