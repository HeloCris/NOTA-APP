from rest_framework import serializers
from .models import Order, OrderItem

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
            'shipping_cost', 'shipping_address', 'tracking_code', 
            'carrier', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['user', 'status', 'created_at', 'updated_at']