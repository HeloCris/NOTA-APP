from decimal import Decimal

import pytest
from rest_framework.exceptions import ValidationError

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, ReturnItem, ReturnRequest, ReturnStatus
from apps.orders.services import OrderPostPurchaseService
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_restore_stock_locks_and_restores_each_store_product():
    user = CustomUser.objects.create_user(
        email="rf17-stock@example.com", password="secret", first_name="Stock",
        last_name="Owner", role=CustomUser.Roles.SELLER
    )
    store = Store.objects.create(owner=user, name="RF17 Stock", cnpj="11222333000181")
    product = Product.objects.create(
        brand=Brand.objects.create(name="RF17 Stock Brand"),
        name="RF17 Stock Perfume",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Cedro"],
        heart_notes=["Íris"],
        base_notes=["Âmbar"],
        is_approved=True,
    )
    stock = StoreProduct.objects.create(
        store=store, product=product, volume_ml=50, price=Decimal("80.00"), stock_quantity=0
    )
    order = Order.objects.create(
        user=user, store=store, status="CANCELLED", total_amount=Decimal("80.00"),
        shipping_address={},
    )
    item = OrderItem.objects.create(order=order, store_product=stock, quantity=2, unit_price=Decimal("80.00"))

    OrderPostPurchaseService.restore_stock(OrderItem.objects.filter(pk=item.pk))

    stock.refresh_from_db()
    assert stock.stock_quantity == 2


@pytest.mark.django_db
def test_process_return_receipt_reloads_return_and_locks_stock():
    user = CustomUser.objects.create_user(
        email="rf17-return@example.com", password="secret", first_name="Return",
        last_name="Owner", role=CustomUser.Roles.SELLER
    )
    store = Store.objects.create(owner=user, name="RF17 Return", cnpj="22333444000190")
    product = Product.objects.create(
        brand=Brand.objects.create(name="RF17 Return Brand"),
        name="RF17 Return Perfume",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Cedro"],
        heart_notes=["Íris"],
        base_notes=["Âmbar"],
        is_approved=True,
    )
    stock = StoreProduct.objects.create(
        store=store, product=product, volume_ml=50, price=Decimal("80.00"), stock_quantity=1
    )
    order = Order.objects.create(
        user=user, store=store, status="DELIVERED", total_amount=Decimal("80.00"),
        shipping_address={},
    )
    item = OrderItem.objects.create(order=order, store_product=stock, quantity=2, unit_price=Decimal("80.00"))
    return_request = ReturnRequest.objects.create(
        order=order, status=ReturnStatus.APPROVED, reason="Teste"
    )
    ReturnItem.objects.create(return_request=return_request, order_item=item, quantity=2)

    stale_return = ReturnRequest.objects.get(pk=return_request.pk)
    OrderPostPurchaseService.process_return_receipt(stale_return, user, True)

    return_request.refresh_from_db()
    stock.refresh_from_db()
    assert return_request.status == ReturnStatus.RECEIVED
    assert stock.stock_quantity == 3

    with pytest.raises(ValidationError):
        OrderPostPurchaseService.process_return_receipt(stale_return, user, True)

    stock.refresh_from_db()
    assert stock.stock_quantity == 3
