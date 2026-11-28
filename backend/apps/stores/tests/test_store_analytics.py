from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.stores.models import Store, StoreCoupon, StoreFollower
from apps.users.models import CustomUser

ANALYTICS_URL = "/api/v1/stores/me/analytics/"


@pytest.fixture
def seller(db):
    return CustomUser.objects.create_user(
        email="analytics_seller@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="Vendedor Analytics",
    )


@pytest.fixture
def store(seller):
    return Store.objects.create(
        owner=seller,
        name="Analytics Store",
        cnpj="11223344556677",
        views_count=100,
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_store_analytics_returns_funnel_and_coupon_metrics(seller, store, api_client):
    coupon = StoreCoupon.objects.create(
        store=store,
        code="BEMVINDO10",
        discount_type=StoreCoupon.DISCOUNT_TYPE_FIXED,
        discount_value=Decimal("10.00"),
        is_active=True,
    )
    for index in range(2):
        follower_user = CustomUser.objects.create_user(
            email=f"analytics_follower_{index}@example.com",
            password="secret",
            first_name=f"Seguidor {index}",
        )
        StoreFollower.objects.create(store=store, user=follower_user)

    brand = Brand.objects.create(name="Analytics Brand")
    product = Product.objects.create(
        brand=brand,
        name="Analytics Perfume",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        is_approved=True,
    )
    decant_offer = StoreProduct.objects.create(
        store=store, product=product, volume_ml=10, price=Decimal("30.00"), stock_quantity=8
    )
    bottle_offer = StoreProduct.objects.create(
        store=store, product=product, volume_ml=100, price=Decimal("150.00"), stock_quantity=2
    )
    customer = CustomUser.objects.create_user(
        email="analytics_customer@example.com",
        password="secret",
        first_name="Comprador Analytics",
    )
    order_with_coupon = Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.PAID,
        coupon=coupon,
        discount_amount=Decimal("10.00"),
        total_amount=Decimal("90.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )
    OrderItem.objects.create(
        order=order_with_coupon,
        store_product=decant_offer,
        quantity=2,
        unit_price=Decimal("30.00"),
    )
    OrderItem.objects.create(
        order=order_with_coupon,
        store_product=bottle_offer,
        quantity=1,
        unit_price=Decimal("150.00"),
    )
    Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.DELIVERED,
        total_amount=Decimal("200.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )

    api_client.force_authenticate(seller)
    response = api_client.get(ANALYTICS_URL)

    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "30d"
    assert data["funnel"] == {
        "store_views": 100,
        "followers_count": 2,
        "new_followers_in_period": 2,
        "paid_orders_count": 2,
        "conversion_rate_pct": 2.0,
    }
    assert data["format_mix"] == {
        "decants_units_sold": 2,
        "decants_revenue": "60.00",
        "bottles_units_sold": 1,
        "bottles_revenue": "150.00",
    }
    assert data["coupons_performance"] == {
        "active_coupons_count": 1,
        "orders_with_coupon": 1,
        "total_discount_granted": "10.00",
        "revenue_with_coupon": "90.00",
        "top_coupon_code": "BEMVINDO10",
    }
    assert data["top_store_offers"][0]["units_sold"] == 2
    assert data["top_store_offers"][0]["is_decant"] is True


@pytest.mark.django_db
def test_store_analytics_identifies_catalog_gaps(seller, store, api_client):
    for index in range(4):
        CustomUser.objects.create_user(
            email=f"gap_customer_{index}@example.com",
            password="secret",
            first_name=f"Cliente Gap {index}",
            olfactory_families=["Gourmand"],
            preferred_notes=["Baunilha"],
        )

    brand = Brand.objects.create(name="Gap Brand")
    suggested = Product.objects.create(
        brand=brand,
        name="La Vie Est Belle",
        olfactory_family=Product.OlfactoryFamily.GOURMAND,
        base_notes=["Baunilha"],
        is_approved=True,
        sold_count=20,
    )
    citrus = Product.objects.create(
        brand=brand,
        name="Citrus Only",
        olfactory_family=Product.OlfactoryFamily.CITRUS,
        top_notes=["Bergamota"],
        is_approved=True,
    )
    StoreProduct.objects.create(
        store=store,
        product=citrus,
        volume_ml=10,
        price=Decimal("50.00"),
        stock_quantity=5,
    )

    api_client.force_authenticate(seller)
    response = api_client.get(ANALYTICS_URL)

    assert response.status_code == 200
    gaps = {(item["type"], item["name"]): item for item in response.json()["catalog_gaps"]}
    assert ("family", "Gourmand") in gaps
    assert ("note", "Baunilha") in gaps
    assert gaps[("family", "Gourmand")]["customer_demand_pct"] == 100
    assert gaps[("family", "Gourmand")]["my_active_offers_count"] == 0
    assert gaps[("note", "Baunilha")]["suggested_products"][0]["id"] == suggested.id


@pytest.mark.django_db
def test_store_analytics_matches_note_variations(seller, store, api_client):
    CustomUser.objects.create_user(
        email="customer_jasmim@example.com",
        password="secret",
        first_name="Cliente Jasmim",
        preferred_notes=["Jasmim"],
    )
    brand = Brand.objects.create(name="Brand Jasmim")
    product_with_sambac = Product.objects.create(
        brand=brand,
        name="Perfume Sambac",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        heart_notes=["Jasmim Sambac"],
        is_approved=True,
    )
    StoreProduct.objects.create(
        store=store,
        product=product_with_sambac,
        volume_ml=50,
        price=Decimal("150.00"),
        stock_quantity=10,
    )

    api_client.force_authenticate(seller)
    response = api_client.get(ANALYTICS_URL)
    assert response.status_code == 200

    gap_names = [item["name"] for item in response.json()["catalog_gaps"] if item["type"] == "note"]
    assert "Jasmim" not in gap_names


@pytest.mark.django_db
def test_store_analytics_permissions_period_and_past_dates(seller, store, api_client):
    customer = CustomUser.objects.create_user(
        email="analytics_no_store@example.com",
        password="secret",
        first_name="Cliente Sem Loja",
    )
    assert api_client.get(ANALYTICS_URL).status_code == 401

    api_client.force_authenticate(customer)
    assert api_client.get(ANALYTICS_URL).status_code == 403

    api_client.force_authenticate(seller)
    assert api_client.get(f"{ANALYTICS_URL}?period=invalid").status_code == 400

    old_order = Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.PAID,
        total_amount=Decimal("100.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )
    Order.objects.filter(pk=old_order.pk).update(
        created_at=timezone.now() - timedelta(days=60)
    )
    recent_order = Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.PAID,
        total_amount=Decimal("100.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )

    assert api_client.get(f"{ANALYTICS_URL}?period=7d").json()["funnel"]["paid_orders_count"] == 1
    all_period = api_client.get(f"{ANALYTICS_URL}?period=all").json()
    assert all_period["period"] == "all"
    assert all_period["funnel"]["paid_orders_count"] == 2
    assert recent_order.pk != old_order.pk
