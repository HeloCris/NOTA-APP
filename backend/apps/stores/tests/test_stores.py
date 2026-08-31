"""
Testes TDD — RF-02: Model Store, endpoints e permissões.

Critérios de Aceitação cobertos:
  CA-01: CNPJ duplicado → 400 com campo `cnpj` descritivo
  CA-02: Criação com sucesso → 201 e dados retornados corretamente
  CA-03: Usuário sem role SELLER → 403 em qualquer endpoint de loja
  CA-04: Lojista A não consegue acessar dados da Loja B → 404
"""

import pytest
from django.urls import reverse  # type: ignore
from rest_framework.test import APIClient

# pyrefly: ignore
from apps.stores.models import Store
# pyrefly: ignore
from apps.users.models import CustomUser


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# CA-02 — Criação com sucesso → 201
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_store_returns_201(api_client, seller_a):
    """Lojista autenticado cria sua loja com sucesso."""
    api_client.force_authenticate(user=seller_a)

    response = api_client.post(
        "/api/v1/stores/",
        {
            "name": "Maison d'Essence",
            "cnpj": "12.345.678/0001-99",  # formato com pontuação (sanitizado no serializer)
            "bio": "Especialistas em perfumaria de nicho.",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "Maison d'Essence"
    assert response.data["cnpj"] == "12345678000199"  # persistido como dígitos


# ---------------------------------------------------------------------------
# CA-01 — CNPJ duplicado → 400 com campo `cnpj`
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_cnpj_duplicate_returns_400(api_client, seller_a, seller_b, store_a):
    """CNPJ já cadastrado por outra loja deve retornar 400 com erro no campo cnpj."""
    api_client.force_authenticate(user=seller_b)

    response = api_client.post(
        "/api/v1/stores/",
        {
            "name": "Outra Loja",
            "cnpj": "12.345.678/0001-99",  # mesmo CNPJ de store_a
        },
        format="json",
    )

    assert response.status_code == 400
    assert "cnpj" in response.data


@pytest.mark.django_db
def test_cnpj_invalid_format_returns_400(api_client, seller_a):
    """CNPJ com menos de 14 dígitos deve retornar 400."""
    api_client.force_authenticate(user=seller_a)

    response = api_client.post(
        "/api/v1/stores/",
        {"name": "Loja Inválida", "cnpj": "123"},
        format="json",
    )

    assert response.status_code == 400
    assert "cnpj" in response.data


# ---------------------------------------------------------------------------
# CA-03 — Usuário sem role SELLER → 403
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_customer_access_store_me_returns_404_if_no_store(api_client, customer):
    """CUSTOMER agora pode acessar /stores/me/ (para criar loja), mas se não tiver, retorna 404."""
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 404


@pytest.mark.django_db
def test_unauthenticated_cannot_access_store_me_returns_401(api_client):
    """Requisição sem token não deve acessar /stores/me/ — retorna 401."""
    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 401


# ---------------------------------------------------------------------------
# CA-04 — Seller A não acessa dados da Loja B → 404
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_seller_a_cannot_see_store_b_via_me(api_client, seller_a, store_a, store_b):
    """
    GET /stores/me/ retorna apenas a loja do próprio seller.
    Seller A nunca enxerga os dados de Seller B.
    """
    api_client.force_authenticate(user=seller_a)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 200
    assert response.data["id"] == store_a.id
    assert response.data["name"] == store_a.name
    # Garante que dados de store_b não vazaram
    assert response.data["cnpj"] != store_b.cnpj


@pytest.mark.django_db
def test_seller_without_store_gets_404(api_client, seller_a):
    """SELLER sem loja cadastrada recebe 404 em /stores/me/."""
    api_client.force_authenticate(user=seller_a)

    response = api_client.get("/api/v1/stores/me/")

    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Listagem pública
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_public_store_list_returns_only_active(api_client, store_a, store_b):
    """GET /stores/ lista apenas lojas ativas, sem autenticação."""
    store_b.is_active = False
    store_b.save()

    response = api_client.get("/api/v1/stores/")

    assert response.status_code == 200
    ids = [s["id"] for s in response.data["results"]]
    assert store_a.id in ids
    assert store_b.id not in ids


@pytest.mark.django_db
def test_public_store_list_search(api_client, store_a, store_b):
    """GET /stores/?search= filtra por nome."""
    response = api_client.get("/api/v1/stores/?search=Maison")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Maison d'Essence"


# ---------------------------------------------------------------------------
# Férias e Desativação (RF-02)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_store_vacation_mode_update(api_client, seller_a, store_a):
    """Garante que o lojista consegue ativar o modo férias (PATCH)."""
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
    """Garante que o lojista consegue alterar o status is_active."""
    api_client.force_authenticate(user=seller_a)

    assert store_a.is_active

    # Desativar
    response = api_client.patch(
        "/api/v1/stores/me/",
        {"is_active": False},
        format="json",
    )
    assert response.status_code == 200
    store_a.refresh_from_db()
    assert not store_a.is_active

    # Reativar
    response = api_client.patch(
        "/api/v1/stores/me/",
        {"is_active": True},
        format="json",
    )
    assert response.status_code == 200
    store_a.refresh_from_db()
    assert store_a.is_active
