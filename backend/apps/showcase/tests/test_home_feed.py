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
        "prod_inactive_store": prod_inactive_store,
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
    assert stores[0]["rating"] is None

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


@pytest.mark.django_db
def test_home_feed_filters_out_inactive_stores_and_zero_stock_products(api_client, setup_home_data):
    """
    Garante cobertura estrita das regras:
    - Lojas inativas (is_active=False) não aparecem em featured_stores.
    - Produtos pertencentes a lojas inativas não aparecem em recommended_products nem decant_highlights.
    - Produtos com estoque zerado (stock_quantity=0) ou indisponíveis não aparecem no feed da Home.
    """
    response = api_client.get("/api/v1/showcase/home/")
    assert response.status_code == status.HTTP_200_OK
    data = response.data

    featured_slugs = [s["slug"] for s in data["featured_stores"]]
    assert setup_home_data["store_inactive"].slug not in featured_slugs

    recommended_ids = [p["id"] for p in data["recommended_products"]]
    decant_ids = [p["id"] for p in data["decant_highlights"]]

    # Produto com estoque 0 não pode constar em nenhuma lista
    zero_stock_id = setup_home_data["prod_out_of_stock"].id
    assert zero_stock_id not in recommended_ids
    assert zero_stock_id not in decant_ids

    # Produto de loja inativa não pode constar em nenhuma lista
    inactive_store_prod_id = setup_home_data["prod_inactive_store"].id
    assert inactive_store_prod_id not in recommended_ids
    assert inactive_store_prod_id not in decant_ids

    # Loja sem produtos em estoque não aparece em featured_stores
    seller_3 = CustomUser.objects.create_user(
        email="seller3@nota.com",
        password="password123",
        first_name="Vendedor Sem Estoque",
        role=CustomUser.Roles.SELLER,
    )
    store_without_stock = Store.objects.create(
        owner=seller_3,
        name="Loja Sem Estoque",
        slug="loja-sem-estoque",
        cnpj="33333333000103",
        is_active=True,
    )
    prod_empty = Product.objects.create(
        brand=setup_home_data["prod_woody"].brand,
        name="Perfume Vazio",
        olfactory_family=Product.OlfactoryFamily.WOODY,
        is_approved=True,
    )
    StoreProduct.objects.create(
        store=store_without_stock,
        product=prod_empty,
        volume_ml=50,
        price="100.00",
        stock_quantity=0,
        is_available=True,
    )

    response_after = api_client.get("/api/v1/showcase/home/")
    after_slugs = [s["slug"] for s in response_after.data["featured_stores"]]
    assert "loja-sem-estoque" not in after_slugs


@pytest.mark.django_db
def test_home_feed_featured_stores_order_by_rating(api_client, setup_home_data):
    """
    Valida RN-03: featured_stores deve priorizar nota de avaliação (avg_rating) como primeiro critério.
    """
    seller = setup_home_data["store_active"].owner
    # Loja A: com avaliação alta (5.0)
    store_a = Store.objects.create(
        owner=seller,
        name="Loja Estrela Alta",
        slug="loja-estrela-alta",
        cnpj="44444444000104",
        is_official=False,
        followers_count=5,
        is_active=True,
    )
    # Loja B: com avaliação média (4.0) mas oficial e mais seguidores
    store_b = Store.objects.create(
        owner=seller,
        name="Loja Estrela Media",
        slug="loja-estrela-media",
        cnpj="55555555000105",
        is_official=True,
        followers_count=100,
        is_active=True,
    )

    prod = setup_home_data["prod_woody"]
    sp_a = StoreProduct.objects.create(store=store_a, product=prod, volume_ml=50, price="100", stock_quantity=10, is_available=True)
    sp_b = StoreProduct.objects.create(store=store_b, product=prod, volume_ml=50, price="100", stock_quantity=10, is_available=True)

    # Cria compras e reviews fictícias
    from apps.orders.models import Order, OrderItem
    from apps.reviews.models import Review

    buyer = setup_home_data["customer_no_profile"]
    order_a = Order.objects.create(user=buyer, store=store_a, total_amount="100", shipping_address="Rua Teste, 100")
    item_a = OrderItem.objects.create(order=order_a, store_product=sp_a, quantity=1, unit_price="100")
    Review.objects.create(
        order_item=item_a,
        user=buyer,
        store=store_a,
        product=prod,
        store_product=sp_a,
        rating=5,
    )

    order_b = Order.objects.create(user=buyer, store=store_b, total_amount="100", shipping_address="Rua Teste, 200")
    item_b = OrderItem.objects.create(order=order_b, store_product=sp_b, quantity=1, unit_price="100")
    Review.objects.create(
        order_item=item_b,
        user=buyer,
        store=store_b,
        product=prod,
        store_product=sp_b,
        rating=4,
    )

    response = api_client.get("/api/v1/showcase/home/")
    stores = response.data["featured_stores"]
    slugs = [s["slug"] for s in stores]

    # Loja A (5.0) deve vir antes de Loja B (4.0), mesmo Loja B sendo oficial e tendo mais seguidores
    assert slugs.index("loja-estrela-alta") < slugs.index("loja-estrela-media")


@pytest.mark.django_db
def test_home_feed_reviews_count_not_inflated_by_multiple_store_products(api_client, setup_home_data):
    """
    Garante que total_reviews com distinct=True não infla o reviews_count em lojas com N produtos em estoque (RF-21.1).
    """
    from apps.orders.models import Order, OrderItem
    from apps.reviews.models import Review

    seller = setup_home_data["store_active"].owner
    store = Store.objects.create(
        owner=seller,
        name="Loja Multi Produtos",
        slug="loja-multi-produtos",
        cnpj="99999999000199",
        is_official=True,
        followers_count=10,
        is_active=True,
    )

    brand = setup_home_data["prod_woody"].brand
    prod1 = setup_home_data["prod_woody"]
    prod2 = setup_home_data["prod_floral"]
    prod3 = Product.objects.create(
        brand=brand,
        name="Perfume Teste 3",
        olfactory_family=Product.OlfactoryFamily.CITRUS,
        is_approved=True,
    )

    # 3 produtos em estoque ativo na loja
    sp1 = StoreProduct.objects.create(store=store, product=prod1, volume_ml=50, price="100", stock_quantity=10, is_available=True)
    sp2 = StoreProduct.objects.create(store=store, product=prod2, volume_ml=50, price="150", stock_quantity=5, is_available=True)
    sp3 = StoreProduct.objects.create(store=store, product=prod3, volume_ml=50, price="200", stock_quantity=8, is_available=True)

    # 2 avaliações reais e distintas para essa loja
    buyer = setup_home_data["customer_no_profile"]
    order = Order.objects.create(user=buyer, store=store, total_amount="250", shipping_address="Rua Teste, 300")
    item1 = OrderItem.objects.create(order=order, store_product=sp1, quantity=1, unit_price="100")
    item2 = OrderItem.objects.create(order=order, store_product=sp2, quantity=1, unit_price="150")

    Review.objects.create(
        order_item=item1,
        user=buyer,
        store=store,
        product=prod1,
        store_product=sp1,
        rating=5,
    )
    Review.objects.create(
        order_item=item2,
        user=buyer,
        store=store,
        product=prod2,
        store_product=sp2,
        rating=4,
    )

    response = api_client.get("/api/v1/showcase/home/")
    assert response.status_code == status.HTTP_200_OK

    store_data = next((s for s in response.data["featured_stores"] if s["slug"] == "loja-multi-produtos"), None)
    assert store_data is not None

    # reviews_count deve ser exatamente 2 (e não 2 * 3 produtos = 6)
    assert store_data["reviews_count"] == 2
    assert store_data["rating"] == 4.5


@pytest.mark.django_db
def test_home_feed_store_rating_matches_store_detail(api_client, setup_home_data):
    """
    Garante que o cálculo de rating e reviews_count na Home coincide perfeitamente com os dados públicos da loja (RN-03).
    """
    from apps.orders.models import Order, OrderItem
    from apps.reviews.models import Review

    seller = setup_home_data["store_active"].owner
    store = Store.objects.create(
        owner=seller,
        name="Loja Comparacao Detail",
        slug="loja-comparacao-detail",
        cnpj="88888888000188",
        is_official=True,
        followers_count=10,
        is_active=True,
    )

    prod = setup_home_data["prod_woody"]
    sp = StoreProduct.objects.create(store=store, product=prod, volume_ml=50, price="100", stock_quantity=10, is_available=True)

    buyer = setup_home_data["customer_no_profile"]
    order = Order.objects.create(user=buyer, store=store, total_amount="100", shipping_address="Rua Teste, 400")
    item = OrderItem.objects.create(order=order, store_product=sp, quantity=1, unit_price="100")

    Review.objects.create(
        order_item=item,
        user=buyer,
        store=store,
        product=prod,
        store_product=sp,
        rating=4,
    )

    # Consulta Home Feed
    res_home = api_client.get("/api/v1/showcase/home/")
    home_store = next((s for s in res_home.data["featured_stores"] if s["slug"] == "loja-comparacao-detail"), None)

    # Consulta Detail da Loja
    res_store = api_client.get(f"/api/v1/stores/{store.id}/")

    assert home_store is not None
    assert home_store["rating"] == res_store.data["rating"] == 4.0
    assert home_store["reviews_count"] == res_store.data["reviews_count"] == 1



