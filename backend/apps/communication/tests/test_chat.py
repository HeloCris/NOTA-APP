from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from apps.communication.models import ChatConversation, ChatMessage, Notification
from apps.orders.models import Order
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
        last_name="Silva",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def other_customer(db):
    return CustomUser.objects.create_user(
        email="outro@nota.com",
        first_name="João",
        last_name="Souza",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def seller(db):
    return CustomUser.objects.create_user(
        email="lojista@nota.com",
        first_name="Loja",
        last_name="A",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def other_seller(db):
    return CustomUser.objects.create_user(
        email="outro_lojista@nota.com",
        first_name="Loja",
        last_name="B",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def store(seller):
    return Store.objects.create(
        owner=seller,
        name="Essência & Arte",
        cnpj="11111111000101",
        is_active=True,
    )


@pytest.fixture
def other_store(other_seller):
    return Store.objects.create(
        owner=other_seller,
        name="Outra Loja",
        cnpj="11111111000102",
        is_active=True,
    )


@pytest.fixture
def order(customer, store):
    return Order.objects.create(
        user=customer,
        store=store,
        total_amount=Decimal("199.90"),
        shipping_address={"city": "São Paulo", "state": "SP"},
    )


def create_conversation(customer, store, order=None):
    return ChatConversation.objects.create(
        customer=customer,
        store=store,
        order=order,
    )


def test_customer_creates_and_recovers_conversation(api_client, customer, store):
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        "/api/v1/chats/",
        {"store_id": store.id},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert ChatConversation.objects.count() == 1

    response = api_client.post(
        "/api/v1/chats/",
        {"store_id": store.id},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert ChatConversation.objects.count() == 1


def test_conversation_can_be_linked_to_own_order(api_client, customer, store, order):
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        "/api/v1/chats/",
        {"store_id": store.id, "order_id": order.id},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    conversation = ChatConversation.objects.get()
    assert conversation.order_id == order.id
    assert response.data["order"]["id"] == order.id


def test_conversation_rejects_order_from_another_customer(
    api_client, customer, other_customer, store, order
):
    other_order = Order.objects.create(
        user=other_customer,
        store=store,
        total_amount=Decimal("100.00"),
        shipping_address={"city": "Rio de Janeiro", "state": "RJ"},
    )
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        "/api/v1/chats/",
        {"store_id": store.id, "order_id": other_order.id},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert ChatConversation.objects.count() == 0


def test_send_text_and_image_message(api_client, customer, seller, store):
    conversation = create_conversation(customer, store)
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        f"/api/v1/chats/{conversation.id}/messages/",
        {"text": "Olá, vocês têm previsão de despacho?"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert ChatMessage.objects.filter(conversation=conversation).count() == 1
    assert Notification.objects.filter(
        store=store, type="NEW_MESSAGE"
    ).exists()

    image = SimpleUploadedFile(
        "comprovante.jpg", b"fake-image-bytes", content_type="image/jpeg"
    )
    response = api_client.post(
        f"/api/v1/chats/{conversation.id}/messages/",
        {"attachment_image": image},
        format="multipart",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert ChatMessage.objects.filter(
        conversation=conversation, attachment_image__isnull=False
    ).exists()


def test_empty_message_is_rejected(api_client, customer, store):
    conversation = create_conversation(customer, store)
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        f"/api/v1/chats/{conversation.id}/messages/",
        {"text": "   "},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert ChatMessage.objects.count() == 0


def test_opening_conversation_marks_received_messages_as_read(
    api_client, customer, seller, store
):
    conversation = create_conversation(customer, store)
    message = ChatMessage.objects.create(
        conversation=conversation,
        sender=seller,
        text="Olá! Postamos amanhã.",
    )
    api_client.force_authenticate(user=customer)

    response = api_client.get(f"/api/v1/chats/{conversation.id}/messages/")

    assert response.status_code == status.HTTP_200_OK
    message.refresh_from_db()
    assert message.is_read is True


def test_seller_cannot_access_other_store_conversation(
    api_client, customer, other_seller, store
):
    conversation = create_conversation(customer, store)
    api_client.force_authenticate(user=other_seller)

    response = api_client.get(f"/api/v1/chats/{conversation.id}/messages/")

    assert response.status_code in (
        status.HTTP_403_FORBIDDEN,
        status.HTTP_404_NOT_FOUND,
    )


def test_chat_list_is_isolated_by_store(api_client, customer, other_seller, store):
    create_conversation(customer, store)
    api_client.force_authenticate(user=other_seller)

    response = api_client.get("/api/v1/chats/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data == []


def test_consecutive_message_limit(api_client, customer, store):
    conversation = create_conversation(customer, store)
    for index in range(10):
        ChatMessage.objects.create(
            conversation=conversation,
            sender=customer,
            text=f"Mensagem {index}",
        )
    api_client.force_authenticate(user=customer)

    response = api_client.post(
        f"/api/v1/chats/{conversation.id}/messages/",
        {"text": "Mensagem 11"},
        format="json",
    )

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert ChatMessage.objects.filter(conversation=conversation).count() == 10


def test_messages_support_since_id_for_polling(api_client, customer, store):
    conversation = create_conversation(customer, store)
    first = ChatMessage.objects.create(
        conversation=conversation, sender=customer, text="Primeira"
    )
    second = ChatMessage.objects.create(
        conversation=conversation, sender=customer, text="Segunda"
    )
    api_client.force_authenticate(user=customer)

    response = api_client.get(
        f"/api/v1/chats/{conversation.id}/messages/",
        {"since_id": first.id},
    )

    assert response.status_code == status.HTTP_200_OK
    assert [item["id"] for item in response.data["results"]] == [second.id]
