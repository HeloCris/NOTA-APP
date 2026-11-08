
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser
from apps.catalog.models import Product, Brand
from apps.stores.models import Store
from apps.inventory.models import StoreProduct
from apps.catalog.services.recommendation_service import (
    calculate_olfactory_match,
)


class OlfactoryRecommendationTests(APITestCase):

    def setUp(self):
        # Usuário com perfil olfativo
        self.user = CustomUser.objects.create_user(
            email="raimundo@teste.com",
            password="password123",
            first_name="Raimundo",
            last_name="Moura",
            role=CustomUser.Roles.CUSTOMER,
            olfactory_families=["Oriental"],
            preferred_notes=["Baunilha", "Bergamota"],
        )

        # Marca cadastrada
        self.brand = Brand.objects.create(
            name="Maison Noire"
        )

        # Loja parceira ativa vinculada ao usuário como owner
        self.store = Store.objects.create(
            owner=self.user,
            name="Maison Noire Store",
            cnpj="12345678000199",
            is_active=True,
        )

        # Perfume 1: Alto Match (Oriental + Baunilha + Bergamota)
        self.product_high_match = Product.objects.create(
            name="Delina Exclusif",
            brand=self.brand,
            olfactory_family="Oriental",
            top_notes=["Bergamota da Calábria", "Lichia"],
            heart_notes=["Rosa Turca"],
            base_notes=["Baunilha Bourbon", "Âmbar"],
            is_approved=True,
        )

        StoreProduct.objects.create(
            store=self.store,
            product=self.product_high_match,
            volume_ml=100,
            price=350.00,
            stock_quantity=10,
            is_available=True,
        )

        # Perfume 2: Baixo Match (Amadeirado + Vetiver)
        self.product_low_match = Product.objects.create(
            name="Vetiver Royal",
            brand=self.brand,
            olfactory_family="Amadeirado",
            top_notes=["Limão"],
            heart_notes=["Cedro"],
            base_notes=["Vetiver"],
            is_approved=True,
        )

        StoreProduct.objects.create(
            store=self.store,
            product=self.product_low_match,
            volume_ml=100,
            price=290.00,
            stock_quantity=5,
            is_available=True,
        )

        # Perfume 3: Sem estoque (Não deve ser recomendado)
        self.product_out_of_stock = Product.objects.create(
            name="Esgotado Sublime",
            brand=self.brand,
            olfactory_family="Oriental",
            top_notes=["Bergamota"],
            heart_notes=[],
            base_notes=["Baunilha"],
            is_approved=True,
        )

        StoreProduct.objects.create(
            store=self.store,
            product=self.product_out_of_stock,
            volume_ml=100,
            price=400.00,
            stock_quantity=0,
            is_available=True,
        )

    def test_calculate_olfactory_match_accuracy(self):
        """Valida correspondência parcial de notas e família olfativa (RN-02)."""

        followed_store_ids = set()

        result = calculate_olfactory_match(
            self.user,
            self.product_high_match,
            followed_store_ids,
        )

        self.assertGreaterEqual(result["match_percentage"], 75)
        self.assertTrue(result["matched_family"])
        self.assertIn(
            "Bergamota da Calábria",
            result["matched_notes"],
        )
        self.assertIn(
            "Baunilha Bourbon",
            result["matched_notes"],
        )

    def test_recommended_products_authenticated(self):
        """Valida ordenação por match_percentage e filtro de estoque (RN-01, CA-01, CA-02)."""

        self.client.force_authenticate(user=self.user)

        url = reverse("catalog:recommended-products")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        results = response.data.get("results", response.data)

        # O perfume sem estoque não deve aparecer
        product_ids = [p["id"] for p in results]

        self.assertNotIn(
            self.product_out_of_stock.id,
            product_ids,
        )

        # O perfume de alto match deve vir em primeiro lugar
        self.assertEqual(
            results[0]["id"],
            self.product_high_match.id,
        )

        self.assertGreater(
            results[0]["match_percentage"],
            results[1]["match_percentage"],
        )

    def test_recommended_products_cold_start_unauthenticated(self):
        """Valida fallback de ordenação para usuário anônimo ou sem perfil (RN-04, CA-03)."""

        url = reverse("catalog:recommended-products")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            response.data.get("is_personalized", False)
        )

    def test_catalog_notes_endpoint(self):
        """Valida agregação única de notas de saída, coração, fundo e famílias (RN-07, CA-05)."""

        url = reverse("catalog:catalog-notes")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn(
            "Bergamota da Calábria",
            response.data["top_notes"],
        )

        self.assertIn(
            "Oriental",
            response.data["families"],
        )

    def test_me_endpoint_preserves_olfactory_profile(self):
        """Garante que o GET /auth/me/ retorna as famílias e notas do usuário (RN-11)."""

        self.client.force_authenticate(user=self.user)

        url = reverse("users:me")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["olfactory_families"],
            ["Oriental"],
        )

        self.assertEqual(
            response.data["preferred_notes"],
            ["Baunilha", "Bergamota"],
        )
