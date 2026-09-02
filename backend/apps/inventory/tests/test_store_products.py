"""
Testes TDD — RF-04: Gestão de Estoque & Precificação do Lojista.

Critérios de Aceitação cobertos:
  CA-01: Lojista B acessa StoreProduct da Loja A → 404/403
  CA-02: promotional_price > price → 400 com campo descritivo
  CA-03: price <= 0 ou stock_quantity < 0 → 400
  CA-04: toggle is_available reflete via PATCH
  RF-04.1: volume_ml, promotional_price opcional e unicidade por volume
  RF-04.2/04.3/04.5: listagem filtrada, criação e exclusão

Os testes autenticam via JWT real (POST /auth/token/), pois o isolamento
multi-tenant lê o `store_id` do payload do token.
"""

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seller_a(db):
    return CustomUser.objects.create_user(
        email="seller_a@nota.com",
        first_name="Seller",
        last_name="A",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def seller_b(db):
    return CustomUser.objects.create_user(
        email="seller_b@nota.com",
        first_name="Seller",
        last_name="B",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="customer@nota.com",
        first_name="Cliente",
        last_name="Teste",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def store_a(seller_a):
    return Store.objects.create(
        owner=seller_a,
        name="Maison d'Essence",
        cnpj="12345678000199",
        is_active=True,
    )


@pytest.fixture
def store_b(seller_b):
    return Store.objects.create(
        owner=seller_b,
        name="Essence Noire",
        cnpj="98765432000111",
        is_active=True,
    )


@pytest.fixture
def brand_dior(db):
    return Brand.objects.create(name="Dior")


@pytest.fixture
def brand_ch(db):
    return Brand.objects.create(name="Carolina Herrera")


@pytest.fixture
def product_sauvage(db, brand_dior):
    return Product.objects.create(
        brand=brand_dior,
        name="Sauvage",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Bergamota"],
        heart_notes=["Lavanda"],
        base_notes=["Ambroxan"],
        description="Marca registrada da Dior.",
        is_approved=True,
    )


@pytest.fixture
def product_goodgirl(db, brand_ch):
    return Product.objects.create(
        brand=brand_ch,
        name="Good Girl",
        olfactory_family=Product.OlfactoryFamily.ORIENTAL,
        top_notes=["Amêndoa"],
        heart_notes=["Tuberosa"],
        base_notes=["Fava Tonka"],
        is_approved=True,
    )


@pytest.fixture
def product_pending(db, brand_dior):
    return Product.objects.create(
        brand=brand_dior,
        name="Sauvage Elixir",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Lavanda"],
        heart_notes=["Cânfora"],
        base_notes=["Âmbar"],
        is_approved=False,
    )


@pytest.fixture
def authenticate(api_client):

    def _authenticate(user):
        response = api_client.post(
            "/api/v1/auth/token/",
            {"email": user.email, "password": "senha_segura_123"},
            format="json",
        )
        assert response.status_code == 200, response.data
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )
        return api_client

    return _authenticate


def _store_product_payload(product, **overrides):
    payload = {
        "product_id": product.id,
        "volume_ml": 100,
        "price": "349.90",
        "stock_quantity": 15,
        "is_available": True,
    }
    payload.update(overrides)
    return payload


# RF-04.3 -> adiciona perfume ao estoque da loja


@pytest.mark.django_db
def test_create_store_product_returns_201(
    authenticate, store_a, product_sauvage
):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage),
        format="json",
    )

    assert response.status_code == 201
    assert response.data["volume_ml"] == 100
    assert response.data["price"] == "349.90"
    assert response.data["stock_quantity"] == 15
    assert response.data["is_available"] is True
    # Resumo compacto do produto
    assert response.data["product"] == {
        "id": product_sauvage.id,
        "name": "Sauvage",
        "brand": "Dior",
    }

    from apps.inventory.models import StoreProduct

    stored = StoreProduct.objects.get(pk=response.data["id"])
    assert stored.store_id == store_a.id


@pytest.mark.django_db
def test_unauthenticated_cannot_create_or_list_returns_401(api_client):
    assert (
        api_client.get("/api/v1/store-products/").status_code == 401
    )
    payload = {
        "product_id": 1,
        "volume_ml": 100,
        "price": "349.90",
        "stock_quantity": 15,
    }
    assert (
        api_client.post(
            "/api/v1/store-products/", payload, format="json",
        ).status_code
        == 401
    )


@pytest.mark.django_db
def test_customer_without_store_cannot_create_returns_403(
    authenticate, customer, product_sauvage
):
    client = authenticate(customer)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage),
        format="json",
    )

    assert response.status_code == 403


# CA-01 — Isolamento multi-tenant


@pytest.mark.django_db
def test_seller_b_cannot_access_seller_a_store_product(
    authenticate, store_a, store_b, product_sauvage
):
    from apps.inventory.models import StoreProduct

    item = StoreProduct.objects.create(
        store=store_a,
        product=product_sauvage,
        volume_ml=100,
        price="349.90",
        stock_quantity=5,
    )

    client_b = authenticate(store_b.owner)

    listing = client_b.get("/api/v1/store-products/")
    assert listing.status_code == 200
    assert listing.data["count"] == 0

    detail = client_b.get(f"/api/v1/store-products/{item.id}/")
    patch = client_b.patch(
        f"/api/v1/store-products/{item.id}/",
        {"price": "99.90"},
        format="json",
    )
    delete = client_b.delete(f"/api/v1/store-products/{item.id}/")

    assert detail.status_code in (403, 404)
    assert patch.status_code in (403, 404)
    assert delete.status_code in (403, 404)


@pytest.mark.django_db
def test_seller_a_lists_only_own_items(
    authenticate, store_a, store_b, product_sauvage, product_goodgirl
):
    from apps.inventory.models import StoreProduct

    StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", stock_quantity=5,
    )
    StoreProduct.objects.create(
        store=store_b, product=product_goodgirl, volume_ml=50,
        price="220.00", stock_quantity=10,
    )

    client_a = authenticate(store_a.owner)
    response = client_a.get("/api/v1/store-products/")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["product"]["id"] == product_sauvage.id


# CA-02 -> valor promocional maior que preço normal


@pytest.mark.django_db
def test_promotional_price_greater_than_price_returns_400(
    authenticate, store_a, product_sauvage
):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(
            product_sauvage, promotional_price="399.90"
        ),
        format="json",
    )

    assert response.status_code == 400
    assert "promotional_price" in response.data


@pytest.mark.django_db
def test_promotional_price_equal_to_price_returns_400(
    authenticate, store_a, product_sauvage
):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(
            product_sauvage, promotional_price="349.90"
        ),
        format="json",
    )

    assert response.status_code == 400
    assert "promotional_price" in response.data


# CA-03 -> retorna 400 se preço <= 0 ou quantidade de itens no stock < 0


@pytest.mark.django_db
def test_zero_price_returns_400(authenticate, store_a, product_sauvage):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, price="0.00"),
        format="json",
    )

    assert response.status_code == 400
    assert "price" in response.data


@pytest.mark.django_db
def test_negative_price_returns_400(authenticate, store_a, product_sauvage):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, price="-10.00"),
        format="json",
    )

    assert response.status_code == 400
    assert "price" in response.data


@pytest.mark.django_db
def test_negative_stock_returns_400(authenticate, store_a, product_sauvage):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, stock_quantity=-1),
        format="json",
    )

    assert response.status_code == 400
    assert "stock_quantity" in response.data


@pytest.mark.django_db
def test_zero_volume_returns_400(authenticate, store_a, product_sauvage):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, volume_ml=0),
        format="json",
    )

    assert response.status_code == 400
    assert "volume_ml" in response.data


# RF-04.7 -> seleciona perfume, informa ML, preço e estoque


@pytest.mark.django_db
def test_duplicate_product_same_volume_returns_400(
    authenticate, store_a, product_sauvage
):
    from apps.inventory.models import StoreProduct

    StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", stock_quantity=5,
    )

    client = authenticate(store_a.owner)
    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, volume_ml=100),
        format="json",
    )

    assert response.status_code == 400
    assert "detail" in response.data
    assert "já está no seu estoque" in str(response.data["detail"])


@pytest.mark.django_db
def test_same_product_different_volume_returns_201(
    authenticate, store_a, product_sauvage
):
    client = authenticate(store_a.owner)

    first = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, volume_ml=5, price="29.90"),
        format="json",
    )
    second = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_sauvage, volume_ml=100),
        format="json",
    )

    assert first.status_code == 201
    assert second.status_code == 201


@pytest.mark.django_db
def test_unapproved_product_cannot_be_added_returns_400(
    authenticate, store_a, product_pending
):
    client = authenticate(store_a.owner)

    response = client.post(
        "/api/v1/store-products/",
        _store_product_payload(product_pending),
        format="json",
    )

    assert response.status_code == 400
    assert "product_id" in response.data


# RF-04.4 -> atualização de preço e estoque


@pytest.mark.django_db
def test_patch_updates_fields_and_toggles_availability(
    authenticate, store_a, product_sauvage
):
    from apps.inventory.models import StoreProduct

    item = StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", promotional_price="299.90", stock_quantity=15,
        is_available=True,
    )

    client = authenticate(store_a.owner)

    toggled = client.patch(
        f"/api/v1/store-products/{item.id}/",
        {"is_available": False},
        format="json",
    )
    assert toggled.status_code == 200
    assert toggled.data["is_available"] is False

    updated = client.patch(
        f"/api/v1/store-products/{item.id}/",
        {"price": "329.90", "stock_quantity": 8},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["price"] == "329.90"
    assert updated.data["stock_quantity"] == 8
    assert updated.data["promotional_price"] == "299.90"


@pytest.mark.django_db
def test_patch_invalid_promotional_price_returns_400(
    authenticate, store_a, product_sauvage
):
    from apps.inventory.models import StoreProduct

    item = StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", stock_quantity=15,
    )

    client = authenticate(store_a.owner)
    response = client.patch(
        f"/api/v1/store-products/{item.id}/",
        {"price": "100.00", "promotional_price": "150.00"},
        format="json",
    )

    assert response.status_code == 400
    assert "promotional_price" in response.data


# RF-04.5 -> deleta o item do estoque


@pytest.mark.django_db
def test_delete_by_owner_returns_204(
    authenticate, store_a, product_sauvage
):
    from apps.inventory.models import StoreProduct

    item = StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", stock_quantity=5,
    )

    client = authenticate(store_a.owner)
    response = client.delete(f"/api/v1/store-products/{item.id}/")

    assert response.status_code == 204
    assert not StoreProduct.objects.filter(pk=item.id).exists()


# RF-04.2 -> listagem filtrada


@pytest.mark.django_db
def test_list_filters_search_and_status(
    authenticate, store_a, product_sauvage, product_goodgirl
):
    from apps.inventory.models import StoreProduct

    StoreProduct.objects.create(
        store=store_a, product=product_sauvage, volume_ml=100,
        price="349.90", stock_quantity=2, is_available=True,
    )
    StoreProduct.objects.create(
        store=store_a, product=product_goodgirl, volume_ml=50,
        price="220.00", stock_quantity=10, is_available=False,
    )

    client = authenticate(store_a.owner)

    by_search = client.get("/api/v1/store-products/", {"search": "sauvage"})
    assert by_search.data["count"] == 1
    assert by_search.data["results"][0]["product"]["name"] == "Sauvage"

    active = client.get("/api/v1/store-products/", {"status": "active"})
    inactive = client.get("/api/v1/store-products/", {"status": "inactive"})
    assert active.data["count"] == 1
    assert inactive.data["count"] == 1

    no_active = client.get(
        "/api/v1/store-products/", {"is_active": "false"}
    )
    assert no_active.data["count"] == 1

    low_stock = client.get(
        "/api/v1/store-products/", {"status": "low_stock"}
    )
    assert low_stock.data["count"] == 1
    assert low_stock.data["results"][0]["product"]["name"] == "Sauvage"