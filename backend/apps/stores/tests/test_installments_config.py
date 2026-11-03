from decimal import Decimal
import pytest
from rest_framework.test import APIClient
from apps.stores.models import Store
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seller(db):
    return CustomUser.objects.create_user(
        email="seller_inst@nota.com",
        first_name="Seller",
        last_name="Inst",
        password="password123",
        role=CustomUser.Roles.SELLER,
    )


@pytest.fixture
def store(seller):
    return Store.objects.create(
        owner=seller,
        name="Loja Parcelas",
        cnpj="44444444000104",
        max_installments=6,
        free_interest_installments=3,
        min_installment_amount=Decimal("30.00"),
    )


@pytest.mark.django_db
def test_seller_get_and_update_installments_config(api_client, seller, store):
    api_client.force_authenticate(user=seller)

    # 1. GET
    response_get = api_client.get("/api/v1/store/settings/installments/")
    assert response_get.status_code == 200
    assert response_get.data["max_installments"] == 6
    assert response_get.data["free_interest_installments"] == 3
    assert Decimal(str(response_get.data["min_installment_amount"])) == Decimal("30.00")

    # 2. PATCH válido
    payload = {
        "max_installments": 10,
        "free_interest_installments": 5,
        "min_installment_amount": "50.00",
    }
    response_patch = api_client.patch("/api/v1/store/settings/installments/", payload, format="json")
    assert response_patch.status_code == 200
    assert response_patch.data["max_installments"] == 10
    assert response_patch.data["free_interest_installments"] == 5

    store.refresh_from_db()
    assert store.max_installments == 10
    assert store.free_interest_installments == 5
    assert store.min_installment_amount == Decimal("50.00")


@pytest.mark.django_db
def test_seller_installments_validation_errors(api_client, seller, store):
    api_client.force_authenticate(user=seller)

    # Erro: max_installments > 12
    res1 = api_client.patch("/api/v1/store/settings/installments/", {"max_installments": 15}, format="json")
    assert res1.status_code == 400

    # Erro: free_interest_installments > max_installments
    res2 = api_client.patch("/api/v1/store/settings/installments/", {
        "max_installments": 6,
        "free_interest_installments": 8,
    }, format="json")
    assert res2.status_code == 400

    # Erro: min_installment_amount <= 0
    res3 = api_client.patch("/api/v1/store/settings/installments/", {"min_installment_amount": "0.00"}, format="json")
    assert res3.status_code == 400
