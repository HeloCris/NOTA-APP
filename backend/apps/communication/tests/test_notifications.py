from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.communication.models import Notification
from apps.communication.services import (
    notify_low_stock,
    notify_store,
    notify_user,
)
from apps.inventory.models import StoreProduct
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="cliente@nota.com",
        first_name="Maria",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def other_customer(db):
    return CustomUser.objects.create_user(
        email="outro@nota.com",
        first_name="João",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def seller(db):
    return CustomUser.objects.create_user(
        email="lojista@nota.com",
        first_name="Loja",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def other_seller(db):
    return CustomUser.objects.create_user(
        email="outro_lojista@nota.com",
        first_name="Outra",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def store(seller):
    return Store.objects.create(
        owner=seller,
        name="Essência & Arte",
        cnpj="22222222000101",
        is_active=True,
    )


@pytest.fixture
def other_store(other_seller):
    return Store.objects.create(
        owner=other_seller,
        name="Outra Loja",
        cnpj="22222222000102",
        is_active=True,
    )


def test_customer_only_sees_own_notifications(
    api_client, customer, other_customer
):
    own = notify_user(customer, "Meu pedido", "Atualização", "ORDER_UPDATE")
    notify_user(other_customer, "Outro pedido", "Atualização", "ORDER_UPDATE")
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/notifications/")

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.data["results"]] == [own.id]


def test_customer_cannot_mark_another_customer_notification(
    api_client, customer, other_customer
):
    foreign = notify_user(
        other_customer, "Outro pedido", "Atualização", "ORDER_UPDATE"
    )
    api_client.force_authenticate(user=customer)

    response = api_client.patch(
        f"/api/v1/notifications/{foreign.id}/read/",
        format="json",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    foreign.refresh_from_db()
    assert foreign.is_read is False


def test_mark_all_read_only_affects_own_notifications(
    api_client, customer, other_customer
):
    notify_user(customer, "Minha", "Atualização", "ORDER_UPDATE")
    foreign = notify_user(
        other_customer, "Outra", "Atualização", "ORDER_UPDATE"
    )
    api_client.force_authenticate(user=customer)

    response = api_client.post("/api/v1/notifications/read-all/")

    assert response.status_code == status.HTTP_200_OK
    assert Notification.objects.filter(user=customer, is_read=False).count() == 0
    foreign.refresh_from_db()
    assert foreign.is_read is False


def test_notification_list_returns_unread_count_and_pagination(
    api_client, customer
):
    for index in range(3):
        notify_user(
            customer, f"Notificação {index}", "Detalhe", "ORDER_UPDATE"
        )
    api_client.force_authenticate(user=customer)

    response = api_client.get("/api/v1/notifications/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 3
    assert response.data["unread_count"] == 3
    assert "results" in response.data


def test_store_only_sees_its_notifications(api_client, store, other_store):
    own = notify_store(store, "Novo Pedido", "Pedido recebido", "NEW_ORDER")
    notify_store(other_store, "Novo Pedido", "Pedido recebido", "NEW_ORDER")
    api_client.force_authenticate(user=store.owner)

    response = api_client.get("/api/v1/notifications/")

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.data["results"]] == [own.id]


def test_low_stock_notification_is_created_only_when_crossing_threshold(
    store,
):
    brand = Brand.objects.create(name="Dior")
    product = Product.objects.create(name="Sauvage", brand=brand)
    store_product = StoreProduct.objects.create(
        store=store,
        product=product,
        volume_ml=100,
        price=Decimal("500.00"),
        stock_quantity=5,
    )

    assert notify_low_stock(store_product, previous_quantity=5) is None

    store_product.stock_quantity = 2
    notification = notify_low_stock(store_product, previous_quantity=5)

    assert notification is not None
    assert notification.type == "LOW_STOCK"
    assert notification.store_id == store.id

    assert notify_low_stock(store_product, previous_quantity=2) is None
    assert Notification.objects.filter(type="LOW_STOCK").count() == 1
