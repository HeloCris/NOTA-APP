from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def catalog_products():
    owner = CustomUser.objects.create_user(
        email="search-owner@nota.com",
        first_name="Search",
        password="senha_segura_123",
    )
    brand = Brand.objects.create(name="Maison Busca")
    store = Store.objects.create(
        owner=owner,
        name="Loja Busca",
        cnpj="12345678000191",
        is_active=True,
    )
    floral = Product.objects.create(
        name="Jasmim Solar",
        brand=brand,
        olfactory_family="Floral",
        top_notes=["Bergamota"],
        heart_notes=["Jasmim"],
        base_notes=["Baunilha"],
        is_approved=True,
        sold_count=10,
    )
    woody = Product.objects.create(
        name="Cedro Noturno",
        brand=brand,
        olfactory_family="Amadeirado",
        top_notes=["Pimenta"],
        heart_notes=["Rosa"],
        base_notes=["Cedro"],
        is_approved=True,
        sold_count=20,
    )
    unavailable = Product.objects.create(
        name="Baunilha Esgotada",
        brand=brand,
        olfactory_family="Gourmand",
        top_notes=[],
        heart_notes=[],
        base_notes=["Baunilha"],
        is_approved=True,
    )
    StoreProduct.objects.create(
        store=store,
        product=floral,
        volume_ml=10,
        price=Decimal("35.00"),
        stock_quantity=3,
    )
    StoreProduct.objects.create(
        store=store,
        product=floral,
        volume_ml=100,
        price=Decimal("150.00"),
        stock_quantity=3,
    )
    StoreProduct.objects.create(
        store=store,
        product=woody,
        volume_ml=100,
        price=Decimal("80.00"),
        stock_quantity=3,
    )
    StoreProduct.objects.create(
        store=store,
        product=unavailable,
        volume_ml=10,
        price=Decimal("20.00"),
        stock_quantity=0,
    )
    return floral, woody, unavailable


@pytest.mark.django_db
def test_search_explorer_filters_notes_and_active_offers(api_client, catalog_products):
    response = api_client.get(
        "/api/v1/products/",
        {"q": "Baunilha", "available_only": "true"},
    )

    assert response.status_code == 200
    assert [product["name"] for product in response.data["results"]] == ["Jasmim Solar"]


@pytest.mark.django_db
def test_search_explorer_matches_any_selected_note(api_client, catalog_products):
    response = api_client.get(
        "/api/v1/products/",
        {"notes": "Bergamota,Rosa", "available_only": "true"},
    )

    assert response.status_code == 200
    assert {product["name"] for product in response.data["results"]} == {
        "Cedro Noturno",
        "Jasmim Solar",
    }


@pytest.mark.django_db
def test_search_explorer_filters_decants_and_orders_by_active_price(api_client, catalog_products):
    response = api_client.get(
        "/api/v1/products/",
        {"type": "decant", "available_only": "true", "ordering": "price_asc"},
    )

    assert response.status_code == 200
    assert [product["name"] for product in response.data["results"]] == ["Jasmim Solar"]

    response = api_client.get(
        "/api/v1/products/",
        {"available_only": "true", "ordering": "price_asc"},
    )
    assert [product["name"] for product in response.data["results"]] == [
        "Jasmim Solar",
        "Cedro Noturno",
    ]


@pytest.mark.django_db
def test_search_explorer_orders_popular_by_olfactory_match_for_authenticated_user(
    api_client, catalog_products
):
    floral, woody, _ = catalog_products
    user = CustomUser.objects.create_user(
        email="search-customer@nota.com",
        first_name="Customer",
        password="senha_segura_123",
        olfactory_families=["Floral"],
        preferred_notes=["Baunilha"],
    )
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/products/", {"available_only": "true"})

    assert response.status_code == 200
    assert response.data["results"][0]["id"] == floral.id
    assert response.data["results"][0]["match_percentage"] > response.data["results"][1]["match_percentage"]
    assert response.data["results"][1]["id"] == woody.id
