from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.mark.django_db
def test_market_metrics_requires_seller_or_brand_authentication():
    client = APIClient()

    # 1. Usuário anônimo -> 401
    resp_anon = client.get("/api/v1/stores/me/market-metrics/")
    assert resp_anon.status_code == 401

    # 2. Cliente comum sem loja -> 404 (ou 403)
    customer = CustomUser.objects.create_user(
        email="customer_only@example.com",
        password="secret",
        role=CustomUser.Roles.CUSTOMER,
        first_name="Cliente",
    )
    client.force_authenticate(customer)
    resp_customer = client.get("/api/v1/stores/me/market-metrics/")
    assert resp_customer.status_code in (403, 404)


@pytest.mark.django_db
def test_market_metrics_aggregates_customer_olfactory_families_and_notes():
    # Cria vendedor e loja
    seller = CustomUser.objects.create_user(
        email="metrics_seller@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="Lojista",
    )
    store = Store.objects.create(
        owner=seller, name="Loja Métricas", cnpj="11223344000199"
    )

    # Cria clientes com perfis olfativos conhecidos
    CustomUser.objects.create_user(
        email="client1@example.com",
        password="secret",
        role=CustomUser.Roles.CUSTOMER,
        first_name="Cliente 1",
        olfactory_families=["Amadeirado", "Oriental"],
        preferred_notes=["Sândalo", "Oud"],
    )
    CustomUser.objects.create_user(
        email="client2@example.com",
        password="secret",
        role=CustomUser.Roles.CUSTOMER,
        first_name="Cliente 2",
        olfactory_families=["Amadeirado"],
        preferred_notes=["Sândalo", "Baunilha"],
    )
    CustomUser.objects.create_user(
        email="client3@example.com",
        password="secret",
        role=CustomUser.Roles.CUSTOMER,
        first_name="Cliente 3",
        olfactory_families=["Floral"],
        preferred_notes=["Rosa"],
    )

    # Cria produtos no catálogo aprovados (com notas na pirâmide para validar fallback da RN-03)
    brand = Brand.objects.create(name="Le Labo")
    Product.objects.create(
        brand=brand,
        name="Santal 33",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Cardamomo"],
        heart_notes=["Íris"],
        base_notes=["Sândalo", "Cedro"],
        is_approved=True,
    )

    client = APIClient()
    client.force_authenticate(seller)
    response = client.get("/api/v1/stores/me/market-metrics/")

    assert response.status_code == 200
    data = response.json()

    summary = data["summary"]
    assert summary["total_customers_with_profile"] == 3
    assert summary["top_family_name"] == "Amadeirado"
    assert summary["top_note_name"] == "Sândalo"

    # Valida mapa de famílias
    family_map = {item["family"]: item for item in data["family_demand"]}
    assert family_map["Amadeirado"]["customers_count"] == 2
    # 2 de 3 clientes = 67%
    assert family_map["Amadeirado"]["share_pct"] == 67
    assert family_map["Amadeirado"]["catalog_products_count"] == 1

    # Valida Top notas (clientes + fallback da pirâmide pois há < 5 clientes)
    top_notes = data["top_notes_demand"]
    notes_names = [n["note"] for n in top_notes]
    assert len(top_notes) > 0
    assert top_notes[0]["note"] == "Sândalo"
    assert "Cardamomo" in notes_names
    assert "Cedro" in notes_names


@pytest.mark.django_db
def test_market_metrics_decants_vs_bottles_split():
    seller = CustomUser.objects.create_user(
        email="decant_seller@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="Lojista Decants",
    )
    store = Store.objects.create(
        owner=seller, name="Decants Store", cnpj="22334455000188"
    )

    brand = Brand.objects.create(name="Tom Ford")
    product = Product.objects.create(
        brand=brand,
        name="Tobacco Vanille",
        olfactory_family=Product.OlfactoryFamily.ORIENTAL,
        is_approved=True,
    )

    # Oferta Decant (10ml)
    decant_offer = StoreProduct.objects.create(
        store=store,
        product=product,
        volume_ml=10,
        price=Decimal("60.00"),
        stock_quantity=20,
    )
    # Oferta Frasco (100ml)
    bottle_offer = StoreProduct.objects.create(
        store=store,
        product=product,
        volume_ml=100,
        price=Decimal("900.00"),
        stock_quantity=5,
    )

    customer = CustomUser.objects.create_user(
        email="buyer@example.com",
        password="secret",
        role=CustomUser.Roles.CUSTOMER,
        first_name="Comprador",
    )

    # Pedido pago de decants: 3 unidades a R$ 60.00
    order1 = Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.PAID,
        total_amount=Decimal("180.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )
    OrderItem.objects.create(
        order=order1,
        store_product=decant_offer,
        quantity=3,
        unit_price=Decimal("60.00"),
    )

    # Pedido pago de frascos: 1 unidade a R$ 900.00
    order2 = Order.objects.create(
        user=customer,
        store=store,
        status=OrderStatus.DELIVERED,
        total_amount=Decimal("900.00"),
        shipping_cost=Decimal("0.00"),
        shipping_address={},
    )
    OrderItem.objects.create(
        order=order2,
        store_product=bottle_offer,
        quantity=1,
        unit_price=Decimal("900.00"),
    )

    client = APIClient()
    client.force_authenticate(seller)
    response = client.get("/api/v1/stores/me/market-metrics/")

    assert response.status_code == 200
    data = response.json()

    thermometer = data["format_thermometer"]
    # 3 decants de 4 total = 75%
    assert thermometer["decants"]["units_sold"] == 3
    assert thermometer["decants"]["sales_share_pct"] == 75
    assert thermometer["decants"]["avg_ticket"] == "60.00"

    assert thermometer["bottles"]["units_sold"] == 1
    assert thermometer["bottles"]["sales_share_pct"] == 25
    assert thermometer["bottles"]["avg_ticket"] == "900.00"


@pytest.mark.django_db
def test_market_metrics_trending_products_and_benchmarks():
    seller1 = CustomUser.objects.create_user(
        email="trending_seller1@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="Vendedor 1",
    )
    store1 = Store.objects.create(
        owner=seller1, name="Loja do Vendedor 1", cnpj="33445566000177"
    )

    seller2 = CustomUser.objects.create_user(
        email="trending_seller2@example.com",
        password="secret",
        role=CustomUser.Roles.SELLER,
        first_name="Vendedor 2",
    )
    store2 = Store.objects.create(
        owner=seller2, name="Loja do Vendedor 2 Concorrente", cnpj="44556677000166"
    )

    brand = Brand.objects.create(name="Dior")
    # Produto 1: mais vendido (sold_count = 100), ofertado pela Loja 1
    p1 = Product.objects.create(
        brand=brand,
        name="Sauvage",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        is_approved=True,
        sold_count=100,
    )
    StoreProduct.objects.create(
        store=store1,
        product=p1,
        volume_ml=10,
        price=Decimal("50.00"),
        stock_quantity=10,
    )
    StoreProduct.objects.create(
        store=store1,
        product=p1,
        volume_ml=100,
        price=Decimal("600.00"),
        stock_quantity=5,
    )

    # Produto 2: menos vendido (sold_count = 50), vendido apenas pela Loja 2
    p2 = Product.objects.create(
        brand=brand,
        name="Fahrenheit",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        is_approved=True,
        sold_count=50,
    )
    StoreProduct.objects.create(
        store=store2,
        product=p2,
        volume_ml=100,
        price=Decimal("700.00"),
        stock_quantity=3,
    )
    # Loja 2 também vende Sauvage 100ml mais caro (R$ 680.00) para testar competitividade por SKU+volume
    StoreProduct.objects.create(
        store=store2,
        product=p1,
        volume_ml=100,
        price=Decimal("680.00"),
        stock_quantity=4,
    )

    client = APIClient()
    client.force_authenticate(seller1)
    response = client.get("/api/v1/stores/me/market-metrics/")

    assert response.status_code == 200
    data = response.json()

    trending = data["trending_products"]
    assert len(trending) == 2
    assert trending[0]["id"] == p1.id
    assert trending[0]["in_my_catalog"] is True
    assert trending[1]["id"] == p2.id
    assert trending[1]["in_my_catalog"] is False

    # Radar de competitividade do catálogo da Loja 1 (por perfume e volumetria, unificando lojas)
    catalog_comp = data["catalog_price_comparison"]
    assert len(catalog_comp) == 2
    comp_by_vol = {item["volume_ml"]: item for item in catalog_comp}

    # Sauvage é vendido pela Loja 1 e pela Loja 2 -> 2 lojas vendendo
    assert comp_by_vol[10]["product_name"] == "Sauvage"
    assert comp_by_vol[10]["is_decant"] is True
    assert comp_by_vol[10]["my_price"] == "50.00"
    assert comp_by_vol[10]["sellers_count"] == 2
    assert comp_by_vol[10]["position"] == "lowest"

    # Sauvage 100ml tem na Loja 1 (600.00) e Loja 2 (680.00) -> lowest para Loja 1, média 640.00
    assert comp_by_vol[100]["product_name"] == "Sauvage"
    assert comp_by_vol[100]["is_decant"] is False
    assert comp_by_vol[100]["my_price"] == "600.00"
    assert comp_by_vol[100]["market_min_price"] == "600.00"
    assert comp_by_vol[100]["market_avg_price"] == "640.00"
    assert comp_by_vol[100]["sellers_count"] == 2
    assert comp_by_vol[100]["position"] == "lowest"


@pytest.mark.django_db
def test_market_metrics_accessible_by_brand_owner():
    brand_owner = CustomUser.objects.create_user(
        email="brand_owner_metrics@example.com",
        password="secret",
        role=CustomUser.Roles.BRAND_OWNER,
        first_name="Brand Owner",
    )
    store = Store.objects.create(
        owner=brand_owner,
        name="Loja Oficial D2C",
        cnpj="55667788000155",
        is_official=True,
    )
    Brand.objects.create(
        owner=brand_owner,
        name="Marca Oficial",
        d2c_store=store,
    )

    client = APIClient()
    client.force_authenticate(brand_owner)
    response = client.get("/api/v1/stores/me/market-metrics/")

    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "family_demand" in data
    assert "format_thermometer" in data

