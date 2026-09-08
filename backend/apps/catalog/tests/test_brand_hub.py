import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.catalog.models import Brand, Product

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def customer_user():
    return User.objects.create_user(email="customer@test.com", password="password123", first_name="Cust", role="CUSTOMER")

@pytest.fixture
def admin_user():
    return User.objects.create_user(email="admin@test.com", password="password123", first_name="Admin", role="ADMIN")

@pytest.mark.django_db
def test_brand_onboarding(api_client, customer_user):
    api_client.force_authenticate(user=customer_user)
    response = api_client.post("/api/v1/brands/register/", {
        "name": "Nova Marca",
        "cnpj": "11.222.333/0001-44",
        "inpi_registration": "123456789"
    }, format='json')

    assert response.status_code == 201, response.data
    brand = Brand.objects.get(name="Nova Marca")
    assert brand.status == "PENDING"
    assert brand.owner == customer_user
    assert customer_user.role == "CUSTOMER"

@pytest.mark.django_db
def test_admin_approve_brand(api_client, customer_user, admin_user):
    customer_user.is_active = False
    customer_user.save()
    brand = Brand.objects.create(name="Marca Pendente", owner=customer_user, cnpj="11222333000144", status="PENDING")

    api_client.force_authenticate(user=admin_user)
    response = api_client.patch(f"/api/v1/admin/brands/{brand.id}/approve/", {
        "status": "APPROVED"
    })

    assert response.status_code == 200
    brand.refresh_from_db()
    customer_user.refresh_from_db()

    assert brand.status == "APPROVED"
    assert brand.is_official is True
    assert customer_user.role == "BRAND_OWNER"
    assert customer_user.is_active is True
