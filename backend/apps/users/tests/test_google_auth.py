import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
class TestGoogleAuth:
    def test_google_auth_endpoint_structure(self, client):
        """Verifica se a rota de autenticação do Google responde corretamente à estrutura esperada"""
        url = reverse('users:google_auth')
        response = client.post(url, {"access_token": "fake_google_token"})
        
        # Como o token é falso, esperamos erro de validação, provando que o endpoint existe e processa requisições
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]