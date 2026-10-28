from django.conf import settings
from django.db import models
from apps.inventory.models import StoreProduct
from apps.stores.models import Store


class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Aguardando pagamento'
    PAID = 'PAID', 'Pagamento aprovado'
    PROCESSING = 'PROCESSING', 'Em separação'
    CANCEL_REQUESTED = 'CANCEL_REQUESTED', 'Cancelamento solicitado'
    SHIPPED = 'SHIPPED', 'Enviado'
    DELIVERY_DISPUTED = 'DELIVERY_DISPUTED', 'Entrega contestada'
    DELIVERED = 'DELIVERED', 'Entregue'
    CANCELLED = 'CANCELLED', 'Cancelado'
    REFUNDED = 'REFUNDED', 'Reembolsado'


class DeliveryConfirmedBy(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Cliente'
    SELLER = 'SELLER', 'Lojista'
    SYSTEM = 'SYSTEM', 'Sistema'


class ReturnStatus(models.TextChoices):
    REQUESTED = 'REQUESTED', 'Solicitado'
    APPROVED = 'APPROVED', 'Aprovado'
    RECEIVED = 'RECEIVED', 'Recebido'
    REFUNDED = 'REFUNDED', 'Reembolsado'
    REJECTED = 'REJECTED', 'Recusado'


class Order(models.Model):
    items: models.Manager['OrderItem']
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name='orders'
    )
    status: str = models.CharField(  # type: ignore
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00
    )
    shipping_service = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Modalidade de Frete',
    )
    shipping_address = models.JSONField()

    # Campos de Rastreio e Expedição
    tracking_code = models.CharField(
        max_length=100, blank=True, null=True, default=''
    )
    carrier = models.CharField(
        max_length=100, blank=True, null=True, default=''
    )
    carrier_url = models.URLField(blank=True, null=True)

    # Campos Pós-Compra (RF-15)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    delivery_confirmed_by = models.CharField(
        max_length=20,
        choices=DeliveryConfirmedBy.choices,
        null=True,
        blank=True,
    )
    address_changed = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True, default='')
    cancel_requested_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    @property
    def code(self) -> str:
        return f'ORD-{self.id:04d}' if self.id else 'ORD-NEW'

    def __str__(self):
        email = getattr(self.user, 'email', str(self.user))
        return f'Order #{self.id} - {email} ({self.status})'


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items'
    )
    store_product = models.ForeignKey(
        StoreProduct, on_delete=models.RESTRICT
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    objects = models.Manager()

    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        product_name = getattr(
            self.store_product, 'product', self.store_product
        )
        return f'{self.quantity}x {product_name}'


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='status_history'
    )
    from_status = models.CharField(
        max_length=30, choices=OrderStatus.choices
    )
    to_status = models.CharField(max_length=30, choices=OrderStatus.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Histórico de Status do Pedido'
        verbose_name_plural = 'Históricos de Status de Pedidos'

    def __str__(self):
        return f'Pedido #{self.order.id}: {self.from_status} -> {self.to_status}'


class ReturnRequest(models.Model):
    items: models.Manager['ReturnItem']
    photos: models.Manager['ReturnPhoto']
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='return_requests'
    )
    status = models.CharField(
        max_length=20,
        choices=ReturnStatus.choices,
        default=ReturnStatus.REQUESTED,
    )
    reason = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    return_tracking_code = models.CharField(
        max_length=100, blank=True, default=''
    )
    resellable = models.BooleanField(null=True, blank=True)
    refund_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    def __str__(self):
        return f'Devolução #{self.id} - Pedido #{self.order.id} ({self.status})'


class ReturnItem(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name='items'
    )
    order_item = models.ForeignKey(
        OrderItem, on_delete=models.CASCADE, related_name='return_items'
    )
    quantity = models.PositiveIntegerField()

    objects = models.Manager()

    def __str__(self):
        return f'{self.quantity}x item #{self.order_item_id} (Devolução #{self.return_request_id})'


class ReturnPhoto(models.Model):
    return_request = models.ForeignKey(
        ReturnRequest, on_delete=models.CASCADE, related_name='photos'
    )
    image = models.ImageField(upload_to='returns/%Y/%m/')

    def __str__(self):
        return f'Foto #{self.id} - Devolução #{self.return_request_id}'