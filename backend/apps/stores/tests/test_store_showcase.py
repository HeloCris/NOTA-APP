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
def store_catalog(db):
    seller = CustomUser.objects.create_user(
        email="rf08-seller@nota.com",
        password="senha_segura_123",
        first_name="RF08",
        last_name="Seller",
        role=CustomUser.Roles.SELLER,
    )
    store = Store.objects.create(
        owner=seller,
        name="Loja RF08",
        cnpj="12345678000199",
        is_active=True,
    )
    brand = Brand.objects.create(name="Marca RF08")
    floral = Product.objects.create(
        brand=brand,
        name="Sauvage Floral",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        top_notes=["Bergamota"],
        heart_notes=["Jasmim"],
        base_notes=["Baunilha"],
        is_approved=True,
    )
    woody = Product.objects.create(
        brand=brand,
        name="Cedro Noturno",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Pimenta"],
        heart_notes=["Cedro"],
        base_notes=["Musgo"],
        is_approved=True,
    )
    unavailable = Product.objects.create(
        brand=brand,
        name="Produto Indisponível",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        is_approved=True,
    )
    out_of_stock = Product.objects.create(
        brand=brand,
        name="Produto Sem Estoque",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        is_approved=True,
    )

    StoreProduct.objects.create(
        store=store,
        product=floral,
        volume_ml=50,
        price="150.00",
        stock_quantity=3,
        is_available=True,
    )
    StoreProduct.objects.create(
        store=store,
        product=woody,
        volume_ml=50,
        price="250.00",
        stock_quantity=2,
        is_available=True,
    )
    StoreProduct.objects.create(
        store=store,
        product=unavailable,
        volume_ml=50,
        price="90.00",
        stock_quantity=4,
        is_available=False,
    )
    StoreProduct.objects.create(
        store=store,
        product=out_of_stock,
        volume_ml=50,
        price="80.00",
        stock_quantity=0,
        is_available=True,
    )

    return store


def products_url(store_id):
    return f"/api/v1/stores/{store_id}/products/"


@pytest.mark.django_db
def test_active_store_returns_only_available_products_with_stock(api_client, store_catalog):
    response = api_client.get(products_url(store_catalog.pk))

    assert response.status_code == 200
    assert {item["product_name"] for item in response.data} == {"Sauvage Floral", "Cedro Noturno"}


@pytest.mark.django_db
def test_filters_products_by_olfactory_family(api_client, store_catalog):
    response = api_client.get(products_url(store_catalog.pk), {"olfactory_family": "floral"})

    assert response.status_code == 200
    assert [item["product_name"] for item in response.data] == ["Sauvage Floral"]


@pytest.mark.django_db
def test_filters_products_by_partial_search(api_client, store_catalog):
    response = api_client.get(products_url(store_catalog.pk), {"search": "Sauv"})

    assert response.status_code == 200
    assert [item["product_name"] for item in response.data] == ["Sauvage Floral"]


@pytest.mark.django_db
def test_excludes_products_with_zero_stock(api_client, store_catalog):
    response = api_client.get(products_url(store_catalog.pk), {"search": "Sem Estoque"})

    assert response.status_code == 200
    assert response.data == []


@pytest.mark.django_db
def test_missing_store_returns_not_found(api_client):
    response = api_client.get(products_url(999999))

    assert response.status_code == 404
