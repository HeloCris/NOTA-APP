from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import pytest
from rest_framework.test import APIClient
from apps.stores.models import Store, StoreCoupon
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
        password="password123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def seller_b(db):
    return CustomUser.objects.create_user(
        email="seller_b@nota.com",
        first_name="Seller",
        last_name="B",
        password="password123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="customer@nota.com",
        first_name="Cliente",
        last_name="Teste",
        password="password123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def store_a(seller_a):
    return Store.objects.create(
        owner=seller_a,
        name="Loja Perfumes A",
        cnpj="11111111000101",
    )


@pytest.fixture
def store_b(seller_b):
    return Store.objects.create(
        owner=seller_b,
        name="Loja Perfumes B",
        cnpj="22222222000102",
    )


@pytest.mark.django_db
def test_seller_can_create_coupon(api_client, seller_a, store_a):
    api_client.force_authenticate(user=seller_a)
    payload = {
        "code": "verao15",
        "discount_type": "PERCENTAGE",
        "discount_value": "15.00",
        "min_purchase_amount": "100.00",
        "usage_limit": 50,
    }
    response = api_client.post("/api/v1/store/coupons/", payload, format="json")
    assert response.status_code == 201
    assert response.data["code"] == "VERAO15"  # Código deve ser salvo em caixa alta (RN-02)
    assert response.data["discount_type"] == "PERCENTAGE"
    assert response.data["used_count"] == 0

    coupon = StoreCoupon.objects.get(store=store_a, code="VERAO15")
    assert coupon.discount_value == Decimal("15.00")


@pytest.mark.django_db
def test_seller_cannot_create_duplicate_coupon_code_same_store(api_client, seller_a, store_a):
    StoreCoupon.objects.create(
        store=store_a,
        code="PROMO10",
        discount_type="FIXED_VALUE",
        discount_value=Decimal("10.00"),
    )
    api_client.force_authenticate(user=seller_a)
    response = api_client.post("/api/v1/store/coupons/", {
        "code": "promo10",
        "discount_type": "FIXED_VALUE",
        "discount_value": "10.00",
    }, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_seller_isolation_ca03(api_client, seller_a, seller_b, store_a, store_b):
    coupon_b = StoreCoupon.objects.create(
        store=store_b,
        code="LOJAB10",
        discount_type="PERCENTAGE",
        discount_value=Decimal("10.00"),
    )
    api_client.force_authenticate(user=seller_a)

    # Lojista A não deve listar cupom da Loja B
    list_response = api_client.get("/api/v1/store/coupons/")
    assert list_response.status_code == 200
    coupon_ids = [c["id"] for c in list_response.data["results"]] if "results" in list_response.data else [c["id"] for c in list_response.data]
    assert coupon_b.id not in coupon_ids

    # Lojista A não consegue alterar cupom da Loja B
    patch_response = api_client.patch(f"/api/v1/store/coupons/{coupon_b.id}/", {"is_active": False})
    assert patch_response.status_code == 404


@pytest.mark.django_db
def test_validate_coupon_checkout_success(api_client, store_a):
    coupon = StoreCoupon.objects.create(
        store=store_a,
        code="PRIMEIRA10",
        discount_type="PERCENTAGE",
        discount_value=Decimal("10.00"),
        min_purchase_amount=Decimal("150.00"),
        is_active=True,
    )
    payload = {
        "store_id": store_a.id,
        "code": "primeira10",
        "subtotal": "200.00",
    }
    response = api_client.post("/api/v1/checkout/validate-coupon/", payload, format="json")
    assert response.status_code == 200
    assert response.data["valid"] is True
    assert response.data["applied_discount"] == "20.00"
    assert response.data["new_subtotal"] == "180.00"


@pytest.mark.django_db
def test_validate_coupon_checkout_expired_ca01(api_client, store_a):
    StoreCoupon.objects.create(
        store=store_a,
        code="EXPIRADO",
        discount_type="FIXED_VALUE",
        discount_value=Decimal("30.00"),
        valid_until=timezone.now() - timedelta(days=1),
        is_active=True,
    )
    response = api_client.post("/api/v1/checkout/validate-coupon/", {
        "store_id": store_a.id,
        "code": "EXPIRADO",
        "subtotal": "100.00",
    }, format="json")
    assert response.status_code == 400
    assert response.data["valid"] is False
    assert "expirou" in response.data["error"].lower()


@pytest.mark.django_db
def test_validate_coupon_checkout_limit_reached_ca01(api_client, store_a):
    StoreCoupon.objects.create(
        store=store_a,
        code="ESGOTADO",
        discount_type="PERCENTAGE",
        discount_value=Decimal("20.00"),
        usage_limit=5,
        used_count=5,
        is_active=True,
    )
    response = api_client.post("/api/v1/checkout/validate-coupon/", {
        "store_id": store_a.id,
        "code": "ESGOTADO",
        "subtotal": "100.00",
    }, format="json")
    assert response.status_code == 400
    assert response.data["valid"] is False
    assert "atingido" in response.data["error"].lower()


@pytest.mark.django_db
def test_validate_coupon_below_min_amount(api_client, store_a):
    StoreCoupon.objects.create(
        store=store_a,
        code="MINIMO100",
        discount_type="FIXED_VALUE",
        discount_value=Decimal("15.00"),
        min_purchase_amount=Decimal("100.00"),
        is_active=True,
    )
    response = api_client.post("/api/v1/checkout/validate-coupon/", {
        "store_id": store_a.id,
        "code": "MINIMO100",
        "subtotal": "80.00",
    }, format="json")
    assert response.status_code == 400
    assert response.data["valid"] is False
    assert "mínimo" in response.data["error"].lower()


@pytest.mark.django_db
def test_create_coupon_notifies_followers(api_client, seller_a, store_a, customer):
    from apps.stores.models import StoreFollower
    from apps.communication.models import Notification

    # Cliente segue a loja A
    StoreFollower.objects.create(store=store_a, user=customer)

    api_client.force_authenticate(user=seller_a)
    payload = {
        "code": "SEGUIDOR15",
        "discount_type": "PERCENTAGE",
        "discount_value": "15.00",
        "min_purchase_amount": "50.00",
    }
    response = api_client.post("/api/v1/store/coupons/", payload, format="json")
    assert response.status_code == 201

    # Verifica se notificação foi gerada para o seguidor
    notif = Notification.objects.filter(user=customer).first()
    assert notif is not None
    assert "SEGUIDOR15" in notif.message
    assert store_a.name in notif.message


@pytest.mark.django_db
def test_coupon_used_count_consumption_and_refund_on_cancel(api_client, customer, store_a):
    from apps.orders.models import Order, OrderStatus
    from apps.orders.services import OrderPostPurchaseService

    # 1. Cria cupom ativo
    coupon = StoreCoupon.objects.create(
        store=store_a,
        code="PROMO10",
        discount_type="FIXED_VALUE",
        discount_value=Decimal("10.00"),
        usage_limit=5,
        used_count=0,
        is_active=True,
    )

    # 2. Cria pedido com o cupom vinculado
    order = Order.objects.create(
        user=customer,
        store=store_a,
        total_amount=Decimal("90.00"),
        shipping_cost=Decimal("10.00"),
        shipping_address={"street": "Rua 1", "number": "100"},
        status=OrderStatus.PENDING,
        coupon=coupon,
        discount_amount=Decimal("10.00"),
    )

    # 3. Processa pagamento do pedido (RN-04)
    api_client.force_authenticate(user=customer)
    pay_res = api_client.post("/api/v1/payments/process/", {
        "order_id": order.id,
        "payment_method": "CREDIT_CARD",
        "card_number": "4532123456781234",
    }, format="json")
    assert pay_res.status_code == 200

    coupon.refresh_from_db()
    assert coupon.used_count == 1  # Incrementado atomicamente ao pagar

    # 4. Cancelamento antes do envio (RN-04)
    order.refresh_from_db()
    OrderPostPurchaseService.cancel_by_customer(order, customer, reason="Desisti da compra")

    coupon.refresh_from_db()
    assert coupon.used_count == 0  # Uso estornado com sucesso
