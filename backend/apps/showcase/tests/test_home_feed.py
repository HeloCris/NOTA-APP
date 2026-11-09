import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def setup_home_data(db):
    # Lojista e loja ativa com produtos
    seller_1 = CustomUser.objects.create_user(
        email="seller1@nota.com",
        password="password123",
        first_name="Carlos",
        role=CustomUser.Roles.SELLER,
    )
    store_active = Store.objects.create(
        owner=seller_1,
        name="Maison Noire",
        slug="maison-noire",
        cnpj="11111111000101",
        city="São Paulo",
        state="SP",
        is_official=True,
        followers_count=10,
        is_active=True,
    )

    # Loja inativa
    seller_2 = CustomUser.objects.create_user(
        email="seller2@nota.com",
        password="password123",
        first_name="Marcos",
        role=CustomUser.Roles.SELLER,
    )
    store_inactive = Store.objects.create(
        owner=seller_2,
        name="Loja Inativa",
        slug="loja-inativa",
        cnpj="22222222000102",
        is_active=False,
    )

    brand = Brand.objects.create(name="Niche Parfums")

    # Perfume 1: Amadeirado com decant (10ml) e frasco (50ml)
    prod_woody = Product.objects.create(
        brand=brand,
        name="Santal Blanc",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        top_notes=["Cardamomo"],
        heart_notes=["Íris", "Violeta"],
        base_notes=["Sândalo", "Cedro"],
        is_approved=True,
        sold_count=15,
    )
    StoreProduct.objects.create(
        store=store_active,
        product=prod_woody,
        volume_ml=10,
        price="45.00",
        stock_quantity=5,
        is_available=True,
    )
    StoreProduct.objects.create(
        store=store_active,
        product=prod_woody,
        volume_ml=50,
        price="280.00",
        stock_quantity=2,
        is_available=True,
    )

    # Perfume 2: Floral (sem decant, apenas 100ml)
    prod_floral = Product.objects.create(
        brand=brand,
        name="Rose Sublime",
        olfactory_family=Product.OlfactoryFamily.FLORAL,
        top_notes=["Lichia", "Bergamota"],
        heart_notes=["Rosa Damascena"],
        base_notes=["Almíscar"],
        is_approved=True,
        sold_count=50,
    )
    StoreProduct.objects.create(
        store=store_active,
        product=prod_floral,
        volume_ml=100,
        price="390.00",
        stock_quantity=1,
        is_available=True,
    )

    # Perfume 3: Sem estoque disponível
    prod_out_of_stock = Product.objects.create(
        brand=brand,
        name="Invisible Mist",
        olfactory_family=Product.OlfactoryFamily.CITRUS,
        is_approved=True,
        sold_count=100,
    )
    StoreProduct.objects.create(
        store=store_active,
        product=prod_out_of_stock,
        volume_ml=50,
        price="200.00",
        stock_quantity=0,
        is_available=True,
    )

    # Perfume 4: Em loja inativa
    prod_inactive_store = Product.objects.create(
        brand=brand,
        name="Ghost Scent",
        olfactory_family=Product.OlfactoryFamily.ORIENTAL,
        is_approved=True,
    )
    StoreProduct.objects.create(
        store=store_inactive,
        product=prod_inactive_store,
        volume_ml=50,
        price="150.00",
        stock_quantity=10,
        is_available=True,
    )

    # Cliente com perfil olfativo Amadeirado
    customer_with_profile = CustomUser.objects.create_user(
        email="leticia@nota.com",
        password="password123",
        first_name="Letícia",
        role=CustomUser.Roles.CUSTOMER,
        olfactory_families=["Amadeirado"],
        preferred_notes=["Sândalo"],
    )

    # Cliente sem perfil olfativo
    customer_no_profile = CustomUser.objects.create_user(
        email="novo@nota.com",
        password="password123",
        first_name="Visitante",
        role=CustomUser.Roles.CUSTOMER,
    )

    return {
        "store_active": store_active,
        "store_inactive": store_inactive,
        "prod_woody": prod_woody,
        "prod_floral": prod_floral,
        "prod_out_of_stock": prod_out_of_stock,
        "customer_with_profile": customer_with_profile,
        "customer_no_profile": customer_no_profile,
    }


@pytest.mark.django_db
def test_home_feed_anonymous(api_client, setup_home_data):
    """Cliente não autenticado recebe feed público sem perfil (RN-01, RN-04, CA-01)."""
    response = api_client.get("/api/v1/showcase/home/")
    assert response.status_code == status.HTTP_200_OK
    data = response.data

    assert data["has_olfactory_profile"] is False
    assert data["user_summary"] == {"olfactory_families": [], "preferred_notes": []}

    # Lojas em destaque devem conter apenas a loja ativa
    stores = data["featured_stores"]
    assert len(stores) == 1
    assert stores[0]["slug"] == "maison-noire"
    assert stores[0]["is_official"] is True

    # Produtos recomendados não devem conter produtos sem estoque ou de lojas inativas
    rec_products = data["recommended_products"]
    rec_ids = [p["id"] for p in rec_products]
    assert setup_home_data["prod_woody"].id in rec_ids
    assert setup_home_data["prod_floral"].id in rec_ids
    assert setup_home_data["prod_out_of_stock"].id not in rec_ids

    # Validação do min_price (menor valor entre volumetrias disponíveis)
    woody_item = next(p for p in rec_products if p["id"] == setup_home_data["prod_woody"].id)
    assert woody_item["min_price"] == 45.0
    assert woody_item["has_decant"] is True

    floral_item = next(p for p in rec_products if p["id"] == setup_home_data["prod_floral"].id)
    assert floral_item["min_price"] == 390.0
    assert floral_item["has_decant"] is False

    # Destaques de decants: apenas produtos com volume <= 15ml
    decants = data["decant_highlights"]
    decant_ids = [p["id"] for p in decants]
    assert setup_home_data["prod_woody"].id in decant_ids
    assert setup_home_data["prod_floral"].id not in decant_ids


@pytest.mark.django_db
def test_home_feed_authenticated_with_olfactory_profile(api_client, setup_home_data):
    """Cliente autenticado com perfil olfativo recebe match_percentage ordenado (RN-02, CA-05)."""
    customer = setup_home_data["customer_with_profile"]
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/showcase/home/")
    assert response.status_code == status.HTTP_200_OK
    data = response.data

    assert data["has_olfactory_profile"] is True
    assert "Amadeirado" in data["user_summary"]["olfactory_families"]
    assert "Sândalo" in data["user_summary"]["preferred_notes"]

    rec_products = data["recommended_products"]
    assert len(rec_products) >= 2

    # Santal Blanc (Amadeirado + Sândalo) deve ter match_percentage alto e vir em primeiro
    first_prod = rec_products[0]
    assert first_prod["id"] == setup_home_data["prod_woody"].id
    assert first_prod["match_percentage"] is not None
    assert first_prod["match_percentage"] > 0


@pytest.mark.django_db
def test_home_feed_authenticated_without_profile(api_client, setup_home_data):
    """Cliente autenticado sem perfil recebe has_olfactory_profile=False para exibir convite (RN-02)."""
    customer = setup_home_data["customer_no_profile"]
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/showcase/home/")
    assert response.status_code == status.HTTP_200_OK
    data = response.data

    assert data["has_olfactory_profile"] is False
    assert data["user_summary"]["olfactory_families"] == []
