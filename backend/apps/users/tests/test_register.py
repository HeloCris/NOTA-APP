import pytest
from django.urls import reverse
from rest_framework import status
from apps.users.models import CustomUser

@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, client):
        url = reverse('users:register')
        data = {
            "first_name": "Ana",
            "last_name": "Ferreira",
            "email": "ana.teste@email.com",
            "phone": "11999990000",
            "password": "SecurePassword123!"
        }
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_register_with_olfactory_profile(self, client):
        url = reverse('users:register')
        data = {
            "first_name": "Carlos",
            "last_name": "Silva",
            "email": "carlos.teste@email.com",
            "phone": "11988887777",
            "password": "StrongPassword123!",
            "olfactory_families": ["Amadeirado", "Floral"],
            "preferred_notes": ["Baunilha", "Sândalo"]
        }
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED


        user = CustomUser.objects.get(email="carlos.teste@email.com")
        assert user.olfactory_families == ["Amadeirado", "Floral"]
        assert user.preferred_notes == ["Baunilha", "Sândalo"]