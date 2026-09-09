from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

class StoreShowcaseTests(APITestCase):
    
    def test_url_vitrine_existe(self):
        """
        Garante que a nossa nova rota da RF-08 está configurada e respondendo.
        """
        # Vamos testar chamando a loja de ID 1 (mesmo que ela não exista, a URL tem que ser encontrada)
        url = reverse('store-products-list', kwargs={'pk': 1})
        response = self.client.get(url)
        
        # Como o banco de testes está vazio, o normal é retornar 200 OK com uma lista vazia
        self.assertEqual(response.status_code, status.HTTP_200_OK)