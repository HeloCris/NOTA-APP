from datetime import timedelta

from rest_framework import serializers
from django.utils import timezone

from .models import Order, OrderItem


def add_business_days(start_date, days):
    current = start_date
    remaining = int(days or 0)
    while remaining > 0:
        current += timedelta(days=1)
        if current.weekday() < 5:
            remaining -= 1
    return current


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='store_product.product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'store_product', 'product_name', 'quantity', 'unit_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'store', 'status', 'total_amount',
            'shipping_cost', 'shipping_service', 'shipping_address',
            'tracking_code', 'carrier', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['user', 'status', 'created_at', 'updated_at']


class ShippingUpdateSerializer(serializers.Serializer):
    carrier = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    tracking_code = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)

    def validate_tracking_code(self, value):
        normalized = value.strip()
        if len(normalized) < 6 or not normalized.isalnum():
            raise serializers.ValidationError(
                'O código de rastreio deve conter pelo menos 6 caracteres alfanuméricos.'
            )
        return normalized

    def validate_carrier(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('A transportadora é obrigatória.')
        return normalized

class StoreOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    dispatch_deadline = serializers.SerializerMethodField()
    urgency_status = serializers.SerializerMethodField()
    is_delayed = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'status', 'total_amount', 'shipping_cost',
            'shipping_service', 'shipping_address', 'tracking_code',
            'carrier', 'created_at', 'updated_at', 'customer_name',
            'items', 'dispatch_deadline', 'urgency_status', 'is_delayed',
        ]

    def _handling_days(self):
        store = self.context.get('store')
        if store is None:
            return 1
        return store.shipping_handling_days or 1

    def get_customer_name(self, obj):
        user = obj.user
        name = f"{user.first_name} {user.last_name}".strip()
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