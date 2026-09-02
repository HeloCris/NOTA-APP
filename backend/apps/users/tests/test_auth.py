import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer():
    return CustomUser.objects.create_user(
        email="customer@example.com",
        first_name="João",
        last_name="Silva",
        phone="11999990000",
        password="senha_segura_123",
        role=CustomUser.Roles.CUSTOMER,
    )


@pytest.mark.django_db
def test_register_returns_201(api_client):
    response = api_client.post(
        reverse("users:register"),
        {
            "email": "joao@email.com",
            "password": "senha_segura_123",
            "first_name": "João",
            "last_name": "Silva",
            "phone": "11999990000",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["email"] == "joao@email.com"
    assert response.data["first_name"] == "João"
    assert response.data["role"] == "CUSTOMER"

    user = CustomUser.objects.get(
        email="joao@email.com",
    )

    assert user.check_password("senha_segura_123")
    assert user.role == CustomUser.Roles.CUSTOMER


@pytest.mark.django_db
def test_duplicate_email_returns_400(api_client, customer):
    response = api_client.post(
        reverse("users:register"),
        {
            "email": customer.email,
            "password": "senha_segura_123",
            "first_name": "Outro",
            "last_name": "Usuário",
            "phone": "11999990001",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.data["email"] == [
        "Este e-mail já está em uso."
    ]


@pytest.mark.django_db
def test_invalid_password_returns_401(api_client, customer):
    response = api_client.post(
        reverse("users:token_obtain_pair"),
        {
            "email": customer.email,
            "password": "senha_incorreta",
        },
        format="json",
    )

    assert response.status_code == 401
    assert response.data["detail"] == "Credenciais inválidas."
    assert "access" not in response.data
    assert "refresh" not in response.data


@pytest.mark.django_db
def test_valid_login_returns_tokens(api_client, customer):
    response = api_client.post(
        reverse("users:token_obtain_pair"),
        {
            "email": customer.email,
            "password": "senha_segura_123",
        },
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data


@pytest.mark.django_db
def test_login_contains_custom_claims(api_client, customer):
    response = api_client.post(
        reverse("users:token_obtain_pair"),
        {
            "email": customer.email,
            "password": "senha_segura_123",
        },
        format="json",
    )

    from rest_framework_simplejwt.tokens import AccessToken

    access_token = AccessToken(
        response.data["access"],
    )

    assert access_token["user_id"] == customer.id
    assert access_token["email"] == customer.email
    assert access_token["role"] == "CUSTOMER"


@pytest.mark.django_db
def test_me_without_token_returns_401(api_client):
    response = api_client.get(
        reverse("users:me"),
    )

    assert response.status_code == 401


@pytest.mark.django_db
def test_me_returns_authenticated_user(api_client, customer):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {
            "email": customer.email,
            "password": "senha_segura_123",
        },
        format="json",
    )

    api_client.credentials(
        HTTP_AUTHORIZATION=(
            f"Bearer {login_response.data['access']}"
        ),
    )

    response = api_client.get(
        reverse("users:me"),
    )

    assert response.status_code == 200
    assert response.data["id"] == customer.id
    assert response.data["email"] == customer.email
    assert response.data["first_name"] == customer.first_name
    assert response.data["last_name"] == customer.last_name
    assert response.data["phone"] == customer.phone
    assert response.data["role"] == customer.role
    assert response.data["store_id"] is None


@pytest.mark.django_db
def test_refresh_returns_new_access_token(api_client, customer):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {
            "email": customer.email,
            "password": "senha_segura_123",
        },
        format="json",
    )

    response = api_client.post(
        reverse("users:token_refresh"),
        {
            "refresh": login_response.data["refresh"],
        },
        format="json",
    )

    assert response.status_code == 200
    assert "access" in response.data


@pytest.mark.django_db
def test_invalid_refresh_returns_401(api_client):
    response = api_client.post(
        reverse("users:token_refresh"),
        {
            "refresh": "refresh-token-invalido",
        },
        format="json",
    )

    assert response.status_code == 401