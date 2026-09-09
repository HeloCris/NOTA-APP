import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.catalog.models import Brand, Product

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def brand_owner_user():
    return User.objects.create_user(email="brand@test.com", password="password123", first_name="Brand", role="BRAND_OWNER")

@pytest.fixture
def approved_brand(brand_owner_user):
    return Brand.objects.create(name="Minha Marca", owner=brand_owner_user, cnpj="11222333000144", status="APPROVED", is_official=True)

@pytest.mark.django_db
def test_create_product_missing_ean(api_client, brand_owner_user, approved_brand):
    api_client.force_authenticate(user=brand_owner_user)
    response = api_client.post("/api/v1/brands/me/products/", {
        "name": "Perfume",
        "anvisa_code": "12345",
        "olfactory_family": "Amadeirado",
        "top_notes": ["Limão"],
        "heart_notes": ["Rosa"],
        "base_notes": ["Musk"]
    }, format='json')
    
    assert response.status_code == 400
    assert "ean" in response.data

@pytest.mark.django_db
def test_create_product_success(api_client, brand_owner_user, approved_brand):
    api_client.force_authenticate(user=brand_owner_user)
    response = api_client.post("/api/v1/brands/me/products/", {
        "name": "Perfume",
        "ean": "1234567890123",
        "anvisa_code": "12345",
        "olfactory_family": "Amadeirado",
        "top_notes": ["Limão"],
        "heart_notes": ["Rosa"],
        "base_notes": ["Musk"]
    }, format='json')
    
    assert response.status_code == 201
    assert response.data["is_approved"] is True

@pytest.mark.django_db
def test_activate_d2c(api_client, brand_owner_user, approved_brand):
    api_client.force_authenticate(user=brand_owner_user)
    response = api_client.post("/api/v1/brands/me/activate-d2c/")
    
    assert response.status_code == 201
    assert "store_id" in response.data
    assert "access" in response.data
    
    approved_brand.refresh_from_db()
    assert approved_brand.d2c_store is not None
    assert approved_brand.d2c_store.is_official is True
