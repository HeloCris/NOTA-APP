import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.catalog.models import Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order
from apps.stores.models import Store

User = get_user_model()


@pytest.mark.django_db
class TestCheckoutPayment:
    def setup_method(self):
        self.client = APIClient()
        
        # 1. Criação do Usuário
        self.user = User.objects.create_user(
            email="test@example.com",
            password="password123",
            first_name="Test"
        )
        self.client.force_authenticate(user=self.user)

        # 2. Criação da Loja (vinculada ao proprietário)
        self.store = Store.objects.create(name="Loja Teste", owner=self.user)

        # 3. Criação da Marca e do Produto catálogo base
        self.product_base = None
        if Product:  # type: ignore[truthy-function]
            product_kwargs: dict[str, object] = {"name": "Produto Teste"}
            
            try:
                brand_field = Product._meta.get_field('brand')
                BrandModel = brand_field.remote_field.model
                brand_instance = BrandModel.objects.create(name="Marca Teste")  # type: ignore[attr-defined]
                product_kwargs["brand"] = brand_instance
            except Exception:
                pass

            self.product_base = Product.objects.create(**product_kwargs)

    def _create_store_product(self, stock_quantity=10, price="100.00"):
        """Método auxiliar para criar instâncias de StoreProduct."""
        kwargs = {
            "store": self.store,
            "stock_quantity": stock_quantity,
            "price": price,
            "volume_ml": 100
        }
        if self.product_base:
            kwargs["product"] = self.product_base

        return StoreProduct.objects.create(**kwargs)

    def test_create_order_success(self):
        product = self._create_store_product(stock_quantity=10, price="100.00")

        payload = {
            "store_id": self.store.id,
            "total_amount": "100.00",
            "shipping_cost": "0.00",
            "shipping_address": {"street": "Rua A", "number": "123"},
            "items": [{"store_product_id": product.id, "quantity": 2, "unit_price": "50.00"}]
        }

        response = self.client.post('/api/v1/orders/', payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED

        product.refresh_from_db()
        assert product.stock_quantity == 8

    def test_create_order_insufficient_stock(self):
        product = self._create_store_product(stock_quantity=1, price="100.00")

        payload = {
            "store_id": self.store.id,
            "total_amount": "200.00",
            "shipping_cost": "0.00",
            "shipping_address": {"street": "Rua A", "number": "123"},
            "items": [{"store_product_id": product.id, "quantity": 2, "unit_price": "100.00"}]
        }

        response = self.client.post('/api/v1/orders/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        product.refresh_from_db()
        assert product.stock_quantity == 1

    def test_process_payment_success(self):
        order = Order.objects.create(
            user=self.user,
            store=self.store,
            total_amount="100.00",
            shipping_cost="0.00",
            shipping_address={"street": "Rua A", "number": "123"},
            status='PENDING'
        )

        payload = {
            "order_id": order.id,
            "payment_method": "PIX"
        }

        response = self.client.post('/api/v1/payments/process/', payload, format='json')
        assert response.status_code == status.HTTP_200_OK

        order.refresh_from_db()
        assert order.status == 'PAID'