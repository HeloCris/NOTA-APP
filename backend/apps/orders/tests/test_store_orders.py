import pytest
from rest_framework.test import APIClient
from rest_framework import status

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem
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
def brand_owner(db):
    return CustomUser.objects.create_user(
        email="brand_owner@nota.com",
        first_name="Maison",
        last_name="Noire",
        password="senha_segura_123",
        role=CustomUser.Roles.BRAND_OWNER,
    )


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="cliente@nota.com",
        first_name="João",
        last_name="da Silva",
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
        shipping_handling_days=2,
    )


@pytest.fixture
def store_b(seller_b):
    return Store.objects.create(
        owner=seller_b,
        name="Essence Noire",
        cnpj="98765432000111",
        is_active=True,
        shipping_handling_days=1,
    )


@pytest.fixture
def official_store(brand_owner):
    brand = Brand.objects.create(
        name="Maison Noire",
        owner=brand_owner,
        cnpj="11222333000144",
        status="APPROVED",
        is_official=True,
    )
    store = Store.objects.create(
        owner=brand_owner,
        name="Maison Noire",
        cnpj="11222333000144",
        is_active=True,
        is_official=True,
    )
    brand.d2c_store = store
    brand.save(update_fields=["d2c_store"])
    return store


def _make_order(customer, store, status_value="PAID", **kwargs):
    defaults = {
        "user": customer,
        "store": store,
        "status": status_value,
        "total_amount": "374.90",
        "shipping_cost": "15.00",
        "shipping_service": "PAC",
        "shipping_address": {
            "street": "Av. Paulista",
            "number": "1000",
            "neighborhood": "Bela Vista",
            "city": "São Paulo",
            "state": "SP",
        },
    }
    defaults.update(kwargs)
    return Order.objects.create(**defaults)


@pytest.fixture
def order_a_paid(customer, store_a):
    return _make_order(customer, store_a, status_value="PAID")


@pytest.fixture
def order_a_processing(customer, store_a):
    return _make_order(customer, store_a, status_value="PROCESSING")


@pytest.fixture
def order_b_paid(customer, store_b):
    return _make_order(customer, store_b, status_value="PAID")


@pytest.mark.django_db
class TestStoreOrdersList:
    def test_list_returns_only_own_store_orders(
        self, api_client, seller_a, order_a_paid, order_a_processing, order_b_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.get("/api/v1/store/orders/")

        assert response.status_code == status.HTTP_200_OK
        returned_ids = {order["id"] for order in response.data}
        assert returned_ids == {order_a_paid.id, order_a_processing.id}
        assert order_b_paid.id not in returned_ids

    def test_list_returns_seller_view_fields(
        self, api_client, seller_a, customer, store_a, order_a_paid
    ):
        product = Product.objects.create(
            brand=Brand.objects.create(name="Dior"),
            name="Sauvage",
        )
        store_product = StoreProduct.objects.create(
            store=store_a,
            product=product,
            volume_ml=100,
            price="374.90",
            stock_quantity=5,
        )
        OrderItem.objects.create(
            order=order_a_paid,
            store_product=store_product,
            quantity=1,
            unit_price="374.90",
        )

        api_client.force_authenticate(user=seller_a)
        response = api_client.get("/api/v1/store/orders/")

        assert response.status_code == status.HTTP_200_OK
        order = next(o for o in response.data if o["id"] == order_a_paid.id)

        assert order["customer_name"] == "João da Silva"
        assert order["shipping_service"] == "PAC"
        assert order["dispatch_deadline"]
        assert "is_delayed" in order
        assert "urgency_status" in order
        assert order["items"][0]["product_name"] == "Sauvage"
        assert order["items"][0]["quantity"] == 1

    def test_list_filter_by_status(
        self, api_client, seller_a, order_a_paid, order_a_processing
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.get("/api/v1/store/orders/?status=PAID")

        assert response.status_code == status.HTTP_200_OK
        assert [o["id"] for o in response.data] == [order_a_paid.id]

        response = api_client.get("/api/v1/store/orders/?status=PROCESSING")
        assert [o["id"] for o in response.data] == [order_a_processing.id]

    def test_list_invalid_status_filter_returns_400(self, api_client, seller_a, store_a):
        api_client.force_authenticate(user=seller_a)

        response = api_client.get("/api/v1/store/orders/?status=INVALID")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_requires_seller_role(self, api_client, customer, order_a_paid):
        api_client.force_authenticate(user=customer)

        response = api_client.get("/api/v1/store/orders/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_brand_owner_can_list_official_store_orders(
        self, api_client, brand_owner, official_store, customer
    ):
        order = _make_order(customer, official_store, status_value="PROCESSING")
        api_client.force_authenticate(user=brand_owner)

        response = api_client.get("/api/v1/store/orders/")

        assert response.status_code == status.HTTP_200_OK
        assert [item["id"] for item in response.data] == [order.id]

    def test_dispatch_deadline_and_is_delayed_flags(
        self, api_client, seller_a, customer, store_a
    ):
        on_time_order = _make_order(customer, store_a, status_value="PAID")

        delayed_order = _make_order(customer, store_a, status_value="PAID")
        from django.utils import timezone
        from datetime import timedelta

        Order.objects.filter(pk=delayed_order.id).update(
            created_at=timezone.now() - timedelta(days=10)
        )

        api_client.force_authenticate(user=seller_a)
        response = api_client.get("/api/v1/store/orders/")

        assert response.status_code == status.HTTP_200_OK
        orders = {o["id"]: o for o in response.data}

        assert orders[on_time_order.id]["is_delayed"] is False
        assert orders[on_time_order.id]["urgency_status"] == "ON_TIME"
        # store_a possui shipping_handling_days=2 (dias úteis)
        assert orders[on_time_order.id]["dispatch_deadline"]

        assert orders[delayed_order.id]["is_delayed"] is True
        assert orders[delayed_order.id]["urgency_status"] == "DELAYED"


@pytest.mark.django_db
class TestUpdateStoreOrderStatus:
    def test_paid_to_processing_returns_200_and_updates(
        self, api_client, seller_a, order_a_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_paid.id}/status/",
            {"status": "PROCESSING"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "PROCESSING"

        order_a_paid.refresh_from_db()
        assert order_a_paid.status == "PROCESSING"

    def test_order_from_another_store_returns_403(
        self, api_client, seller_a, order_b_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_b_paid.id}/status/",
            {"status": "PROCESSING"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

        order_b_paid.refresh_from_db()
        assert order_b_paid.status == "PAID"

    def test_invalid_status_transition_returns_400(
        self, api_client, seller_a, order_a_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_paid.id}/status/",
            {"status": "SHIPPED"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        order_a_paid.refresh_from_db()
        assert order_a_paid.status == "PAID"


@pytest.mark.django_db
class TestShipStoreOrder:
    def test_processing_order_is_shipped_with_tracking_data(
        self, api_client, seller_a, order_a_processing
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_processing.id}/ship/",
            {"carrier": "Correios", "tracking_code": "BR123456"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "SHIPPED"
        assert response.data["carrier"] == "Correios"
        assert response.data["tracking_code"] == "BR123456"

        order_a_processing.refresh_from_db()
        assert order_a_processing.status == "SHIPPED"

    def test_empty_or_invalid_tracking_code_returns_400(
        self, api_client, seller_a, order_a_processing
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_processing.id}/ship/",
            {"carrier": "Correios", "tracking_code": ""},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        order_a_processing.refresh_from_db()
        assert order_a_processing.status == "PROCESSING"

    def test_only_processing_orders_can_be_shipped(
        self, api_client, seller_a, order_a_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_paid.id}/ship/",
            {"carrier": "Jadlog", "tracking_code": "JD123456"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_order_from_another_store_cannot_be_shipped(
        self, api_client, seller_a, order_b_paid
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_b_paid.id}/ship/",
            {"carrier": "Jadlog", "tracking_code": "JD123456"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_brand_owner_can_ship_official_store_order(
        self, api_client, brand_owner, official_store, customer
    ):
        order = _make_order(customer, official_store, status_value="PROCESSING")
        api_client.force_authenticate(user=brand_owner)

        response = api_client.patch(
            f"/api/v1/store/orders/{order.id}/ship/",
            {"carrier": "Correios", "tracking_code": "BR123456"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == "SHIPPED"

    def test_non_paid_order_cannot_start_processing(
        self, api_client, seller_a, order_a_processing
    ):
        api_client.force_authenticate(user=seller_a)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_processing.id}/status/",
            {"status": "PROCESSING"},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        order_a_processing.refresh_from_db()
        assert order_a_processing.status == "PROCESSING"

    def test_non_seller_role_returns_403(self, api_client, customer, order_a_paid):
        api_client.force_authenticate(user=customer)

        response = api_client.patch(
            f"/api/v1/store/orders/{order_a_paid.id}/status/",
            {"status": "PROCESSING"},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
