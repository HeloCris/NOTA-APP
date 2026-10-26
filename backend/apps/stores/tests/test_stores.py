
import pytest
from django.urls import reverse  # type: ignore
from rest_framework.test import APIClient

# pyrefly: ignore
from apps.stores.models import Store
# pyrefly: ignore
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







@pytest.mark.django_db
def test_create_store_returns_201(api_client, seller_a):
    api_client.force_authenticate(user=seller_a)

    response = api_client.post(
        "/api/v1/stores/",
        {
            "name": "Maison d'Essence",
            "cnpj": "12.345.678/0001-99",
            "bio": "Especialistas em perfumaria de nicho.",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "Maison d'Essence"
    assert response.data["cnpj"] == "12345678000199"







@pytest.mark.django_db
def test_cnpj_duplicate_returns_400(api_client, seller_a, seller_b, store_a):
    api_client.force_authenticate(user=seller_b)

    response = api_client.post(
        "/api/v1/stores/",
        {
            "name": "Outra Loja",
            "cnpj": "12.345.678/0001-99",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "cnpj" in response.data


@pytest.mark.django_db
def test_cnpj_invalid_format_returns_400(api_client, seller_a):
    api_client.force_authenticate(user=seller_a)

    response = api_client.post(
        "/api/v1/stores/",
        {"name": "Loja Inválida", "cnpj": "123"},
        format="json",
    )

    assert response.status_code == 400
    assert "cnpj" in response.data







@pytest.mark.django_db
def test_customer_access_store_me_returns_404_if_no_store(api_client, customer):
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_unauthenticated_cannot_access_store_me_returns_401(api_client):
    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 401







@pytest.mark.django_db
def test_seller_a_cannot_see_store_b_via_me(api_client, seller_a, store_a, store_b):
    api_client.force_authenticate(user=seller_a)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 200
    assert response.data["id"] == store_a.id
    assert response.data["name"] == store_a.name

    assert response.data["cnpj"] != store_b.cnpj


@pytest.mark.django_db
def test_seller_without_store_gets_404(api_client, seller_a):
    api_client.force_authenticate(user=seller_a)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 404







@pytest.mark.django_db
def test_public_store_list_returns_only_active(api_client, store_a, store_b):
    store_b.is_active = False
    store_b.save()

    response = api_client.get("/api/v1/stores/")

    assert response.status_code == 200
    ids = [s["id"] for s in response.data["results"]]
    assert store_a.id in ids
    assert store_b.id not in ids


@pytest.mark.django_db
def test_public_store_list_search(api_client, store_a, store_b):
    response = api_client.get("/api/v1/stores/?search=Maison")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Maison d'Essence"






@pytest.mark.django_db
def test_store_vacation_mode_update(api_client, seller_a, store_a):
    api_client.force_authenticate(user=seller_a)

    assert not store_a.vacation_mode

    response = api_client.patch(
        "/api/v1/stores/me/",
        {"vacation_mode": True},
        format="json",
    )

    assert response.status_code == 200
    store_a.refresh_from_db()
    assert store_a.vacation_mode is True


@pytest.mark.django_db
def test_store_deactivate_and_reactivate(api_client, seller_a, store_a):
    api_client.force_authenticate(user=seller_a)

    assert store_a.is_active


    response = api_client.patch(
        "/api/v1/stores/me/",
        {"is_active": False},
        format="json",
    )
    assert response.status_code == 200
    store_a.refresh_from_db()
    assert not store_a.is_active


    response = api_client.patch(
        "/api/v1/stores/me/",
        {"is_active": True},
        format="json",
    )
    assert response.status_code == 200
    store_a.refresh_from_db()
    assert store_a.is_active


@pytest.mark.django_db
def test_store_shipping_settings_update(api_client, seller_a, store_a):
    api_client.force_authenticate(user=seller_a)

    payload = {
        "shipping_local_pac": "14.50",
        "shipping_local_sedex": "25.00",
        "shipping_pac_price": "21.50",
        "shipping_sedex_price": "39.90",
        "shipping_handling_days": 2,
        "free_shipping_threshold": "250.00",
    }

    response = api_client.patch("/api/v1/stores/me/", payload, format="json")
    assert response.status_code == 200
    store_a.refresh_from_db()

    assert float(store_a.shipping_local_pac) == 14.50
    assert float(store_a.shipping_local_sedex) == 25.00
    assert float(store_a.shipping_pac_price) == 21.50
    assert float(store_a.shipping_sedex_price) == 39.90
    assert store_a.shipping_handling_days == 2
    assert float(store_a.free_shipping_threshold) == 250.00


@pytest.mark.django_db
def test_store_shipping_quote_regional_and_delivery_breakdown(api_client, store_a):
    store_a.state = "SP"
    store_a.postal_code = "01310100"
    store_a.shipping_local_pac = 14.00
    store_a.shipping_local_sedex = 22.00
    store_a.shipping_pac_price = 28.00
    store_a.shipping_sedex_price = 45.00
    store_a.shipping_handling_days = 2
    store_a.free_shipping_threshold = 200.00
    store_a.save()

    # 1. Cotação Local (dentro de SP)
    quote_local = {
        "postal_code": "01414000",
        "state": "SP",
        "cart_subtotal": 100.00,
    }
    res_local = api_client.post(
        f"/api/v1/stores/{store_a.id}/shipping-quote/",
        quote_local,
        format="json",
    )
    assert res_local.status_code == 200
    data_local = res_local.json()
    assert data_local["region_tier"] == "LOCAL"
    pac_local = next(m for m in data_local["methods"] if m["id"] == "PAC")
    assert pac_local["price"] == 14.00
    # Prazo de envio (manuseio) = 2, total = 2 + 2 a 4 = 4 a 6 dias
    assert pac_local["handling_days"] == 2
    assert pac_local["total_delivery_days_min"] == 4
    assert pac_local["total_delivery_days_max"] == 6

    # 2. Cotação Nacional (para RJ ou outro estado)
    quote_national = {
        "postal_code": "20000000",
        "state": "RJ",
        "cart_subtotal": 100.00,
    }
    res_nat = api_client.post(
        f"/api/v1/stores/{store_a.id}/shipping-quote/",
        quote_national,
        format="json",
    )
    assert res_nat.status_code == 200
    data_nat = res_nat.json()
    assert data_nat["region_tier"] == "NATIONAL"
    pac_nat = next(m for m in data_nat["methods"] if m["id"] == "PAC")
    assert pac_nat["price"] == 28.00
    # Prazo de envio = 2, trânsito = 5 a 8, total = 7 a 10 dias
    assert pac_nat["total_delivery_days_min"] == 7
    assert pac_nat["total_delivery_days_max"] == 10

    # 3. Cotação com Frete Grátis atingido
    quote_free = {
        "postal_code": "20000000",
        "state": "RJ",
        "cart_subtotal": 250.00,
    }
    res_free = api_client.post(
        f"/api/v1/stores/{store_a.id}/shipping-quote/",
        quote_free,
        format="json",
    )
    assert res_free.status_code == 200
    data_free = res_free.json()
    assert data_free["qualifies_for_free_shipping"] is True
    pac_free = next(m for m in data_free["methods"] if m["id"] == "PAC")
    assert pac_free["price"] == 0.00
    assert pac_free["is_free"] is True


