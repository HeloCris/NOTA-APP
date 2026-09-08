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


@pytest.fixture
def seller():
    user = CustomUser.objects.create_user(
        email="seller@example.com",
        first_name="Maria",
        last_name="Souza",
        phone="11988887777",
        password="senha_segura_123",
        role=CustomUser.Roles.SELLER,
    )
    from apps.stores.models import Store

    Store.objects.create(
        owner=user,
        name="Essência & Arte",
        cnpj="12345678000199",
    )
    return user


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
    assert response.data["olfactory_families"] == []
    assert response.data["preferred_notes"] == []
    assert "store_id" not in response.data


@pytest.mark.django_db
def test_me_customer_includes_olfactory_profile(api_client, customer):
    customer.olfactory_families = ["Amadeirado", "Floral"]
    customer.preferred_notes = ["Sândalo", "Jasmim"]
    customer.save()

    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {"email": customer.email, "password": "senha_segura_123"},
        format="json",
    )

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}",
    )

    response = api_client.get(reverse("users:me"))

    assert response.status_code == 200
    assert response.data["olfactory_families"] == ["Amadeirado", "Floral"]
    assert response.data["preferred_notes"] == ["Sândalo", "Jasmim"]


@pytest.mark.django_db
def test_me_seller_includes_store_id_without_olfactory_fields(api_client, seller):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {"email": seller.email, "password": "senha_segura_123"},
        format="json",
    )

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}",
    )

    response = api_client.get(reverse("users:me"))

    assert response.status_code == 200
    assert response.data["store_id"] is not None
    assert "olfactory_families" not in response.data
    assert "preferred_notes" not in response.data


@pytest.mark.django_db
def test_me_patch_updates_personal_data(api_client, customer):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {"email": customer.email, "password": "senha_segura_123"},
        format="json",
    )

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}",
    )

    response = api_client.patch(
        reverse("users:me"),
        {
            "first_name": "João Atualizado",
            "phone": "11977776666",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["first_name"] == "João Atualizado"
    assert response.data["phone"] == "11977776666"

    customer.refresh_from_db()
    assert customer.first_name == "João Atualizado"
    assert customer.phone == "11977776666"


@pytest.mark.django_db
def test_me_patch_rejects_duplicate_email(api_client, customer, seller):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {"email": customer.email, "password": "senha_segura_123"},
        format="json",
    )

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}",
    )

    response = api_client.patch(
        reverse("users:me"),
        {"email": seller.email},
        format="json",
    )

    assert response.status_code == 400
    assert "Este e-mail já está em uso." in response.data["email"]


@pytest.mark.django_db
def test_blacklist_returns_205_and_rejects_refreshed_access(api_client, customer):
    login_response = api_client.post(
        reverse("users:token_obtain_pair"),
        {"email": customer.email, "password": "senha_segura_123"},
        format="json",
    )

    blacklist_response = api_client.post(
        reverse("users:token_blacklist"),
        {"refresh": login_response.data["refresh"]},
        format="json",
    )

    assert blacklist_response.status_code == 205

    refresh_response = api_client.post(
        reverse("users:token_refresh"),
        {"refresh": login_response.data["refresh"]},
        format="json",
    )

    assert refresh_response.status_code == 401


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