import pytest
from rest_framework.test import APIClient
from apps.stores.models import Store, StoreFollower
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seller(db):
    return CustomUser.objects.create_user(
        email="seller_follow@nota.com",
        first_name="Seller",
        last_name="Follow",
        password="password123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def customer(db):
    return CustomUser.objects.create_user(
        email="customer_follow@nota.com",
        first_name="Customer",
        last_name="Follow",
        password="password123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.fixture
def store(seller):
    return Store.objects.create(
        owner=seller,
        name="Loja Aromas",
        cnpj="33333333000103",
        followers_count=0,
    )


@pytest.mark.django_db
def test_customer_can_follow_and_unfollow_store(api_client, customer, store):
    api_client.force_authenticate(user=customer)

    # 1. Seguir loja (CA-04)
    response_follow = api_client.post(f"/api/v1/stores/{store.id}/follow/")
    assert response_follow.status_code == 200
    assert response_follow.data["is_following"] is True
    assert response_follow.data["followers_count"] == 1

    store.refresh_from_db()
    assert store.followers_count == 1
    assert StoreFollower.objects.filter(store=store, user=customer).exists()

    # 2. Deixar de seguir loja (CA-05)
    response_unfollow = api_client.post(f"/api/v1/stores/{store.id}/follow/")
    assert response_unfollow.status_code == 200
    assert response_unfollow.data["is_following"] is False
    assert response_unfollow.data["followers_count"] == 0

    store.refresh_from_db()
    assert store.followers_count == 0
    assert not StoreFollower.objects.filter(store=store, user=customer).exists()


@pytest.mark.django_db
def test_customer_following_stores_list(api_client, customer, store):
    api_client.force_authenticate(user=customer)

    # Seguir
    api_client.post(f"/api/v1/stores/{store.id}/follow/")

    # Listar seguidas
    response = api_client.get("/api/v1/customers/following-stores/")
    assert response.status_code == 200
    data = response.data["results"] if "results" in response.data else response.data
    assert len(data) == 1
    assert data[0]["store_id"] == store.id
    assert data[0]["name"] == store.name


@pytest.mark.django_db
def test_unauthenticated_user_cannot_follow(api_client, store):
    response = api_client.post(f"/api/v1/stores/{store.id}/follow/")
    assert response.status_code == 401
