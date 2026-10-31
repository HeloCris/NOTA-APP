from decimal import Decimal

import pytest

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem
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
