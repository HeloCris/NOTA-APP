from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_dashboard_calculates_financial_kpis_and_period():
    owner = CustomUser.objects.create_user(
        email="rf17-dashboard-owner@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="RF17",
        last_name="Owner",
    )
    store = Store.objects.create(
        owner=owner, name="RF17 Dashboard", cnpj="98765432000111", views_count=4
    )
    product = Product.objects.create(
        brand=Brand.objects.create(name="RF17 Brand"),
        name="RF17 Perfume",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Cedro"],
        heart_notes=["Íris"],
        base_notes=["Âmbar"],
        is_approved=True,
    )
    stock = StoreProduct.objects.create(
        store=store, product=product, volume_ml=50, price=Decimal("100.00"), stock_quantity=2
    )
    order = Order.objects.create(
        user=owner,
        store=store,
        status=OrderStatus.PAID,
        total_amount=Decimal("100.00"),
        shipping_cost=Decimal("10.00"),
        shipping_address={},
    )
    OrderItem.objects.create(order=order, store_product=stock, quantity=1, unit_price=Decimal("100.00"))

    client = APIClient()
    client.force_authenticate(owner)
    response = client.get("/api/v1/stores/me/dashboard/?period=30d")

    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "30d"
    assert data["kpis"]["gross_revenue"] == 100.0
    assert data["kpis"]["commission"] == 10.0
    assert data["kpis"]["net_revenue"] == 90.0
    assert data["kpis"]["average_ticket"] == 100.0
    assert data["kpis"]["stock_alerts"] == 1
    assert data["kpis"]["stock_value"] == 200.0
    assert data["kpis"]["store_views"] == 4
    assert len(data["chart"]["labels"]) == 30
