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
def showcase_data(db):
    seller = CustomUser.objects.create_user(
        email="showcase-seller@nota.com",
        password="senha_segura_123",
        first_name="Showcase",
        last_name="Seller",
        role=CustomUser.Roles.SELLER,
    )
    store = Store.objects.create(
        owner=seller,
        name="Casa Floral",
        cnpj="11222333000144",
        bio="Curadoria floral.",
    )
    brand = Brand.objects.create(name="Maison Teste")
    floral = Product.objects.create(
        brand=brand,
        name="Jasmim Solar",
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
    StoreProduct.objects.create(store=store, product=floral, volume_ml=50, price="150.00", stock_quantity=3)
    StoreProduct.objects.create(store=store, product=woody, volume_ml=50, price="250.00", stock_quantity=3)
    return store


@pytest.mark.django_db
def test_public_products_exclude_unavailable_and_inactive_store(api_client: APIClient, showcase_data):
    store = showcase_data
    hidden_brand = Brand.objects.create(name="Marca Oculta")
    hidden_product = Product.objects.create(
        brand=hidden_brand,
        name="Sem Estoque",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        is_approved=True,
    )
    StoreProduct.objects.create(store=store, product=hidden_product, volume_ml=30, price="90.00", stock_quantity=0)
    store.is_active = False
    store.save(update_fields=["is_active"])

    response = api_client.get("/api/v1/showcase/products/")

    assert response.status_code == 200
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_public_products_filter_family_and_price(api_client: APIClient, showcase_data):
    response = api_client.get("/api/v1/showcase/products/?family=Floral&max_price=200")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Jasmim Solar"


@pytest.mark.django_db
def test_public_store_by_slug_returns_only_store_products(api_client: APIClient, showcase_data):
    response = api_client.get(f"/api/v1/showcase/stores/{showcase_data.slug}/")
    missing = api_client.get("/api/v1/showcase/stores/inexistente/")

    assert response.status_code == 200
    assert {item["store_slug"] for item in response.data["products"]} == {showcase_data.slug}
    assert missing.status_code == 404
