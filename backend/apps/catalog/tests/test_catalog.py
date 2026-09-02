import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Product
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_seed_catalog_is_idempotent():
    call_command("seed_catalog")
    call_command("seed_catalog")

    assert Brand.objects.count() == 8
    assert Product.objects.count() == 10
    assert Product.objects.get(name="Sauvage").top_notes


@pytest.mark.django_db
def test_product_list_filters_by_search_and_notes(api_client):
    call_command("seed_catalog")

    response = api_client.get("/api/v1/products/?search=Libre&olfactory_family=Floral&base_notes=Baunilha")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Libre"
    assert response.data["results"][0]["top_notes"]
    assert response.data["results"][0]["heart_notes"]
    assert response.data["results"][0]["base_notes"]


@pytest.mark.django_db
def test_public_brand_list_and_product_detail(api_client):
    call_command("seed_catalog")
    sauvage = Product.objects.get(name="Sauvage")

    brands_response = api_client.get("/api/v1/brands/")
    product_response = api_client.get(f"/api/v1/products/{sauvage.id}/")

    assert brands_response.status_code == 200
    assert brands_response.data["count"] == 8
    assert product_response.status_code == 200
    assert product_response.data["brand"]["name"] == "Dior"


@pytest.mark.django_db
def test_product_submission_requires_authentication(api_client):
    brand = Brand.objects.create(name="Marca Teste")
    payload = {"name": "Perfume Teste", "brand_id": brand.id, "olfactory_family": "Floral", "top_notes": ["Limão"], "heart_notes": ["Jasmim"], "base_notes": ["Baunilha"], "image_url": "https://example.com/perfume.png"}

    response = api_client.post("/api/v1/products/", payload, format="json")

    assert response.status_code == 401


@pytest.mark.django_db
def test_authenticated_submission_is_pending_review(api_client):
    brand = Brand.objects.create(name="Marca Teste")
    user = CustomUser.objects.create_user(email="user@nota.com", first_name="User", password="senha_segura_123")
    api_client.force_authenticate(user=user)
    payload = {"name": "Perfume Teste", "brand_id": brand.id, "olfactory_family": "Floral", "top_notes": ["Limão"], "heart_notes": ["Jasmim"], "base_notes": ["Baunilha"], "image_url": "https://example.com/perfume.png"}

    response = api_client.post("/api/v1/products/", payload, format="json")

    assert response.status_code == 201
    assert not Product.objects.get(pk=response.data["id"]).is_approved