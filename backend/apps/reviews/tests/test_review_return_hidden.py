from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus, ReturnItem, ReturnRequest, ReturnStatus
from apps.reviews.models import Review
from apps.stores.models import Store

User = get_user_model()


class ReviewReturnHiddenTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='maria@example.com',
            first_name='Maria',
            last_name='Silva',
            password='password123',
        )
        self.seller = User.objects.create_user(
            email='lojista@example.com',
            first_name='Lojista',
            role=User.Roles.SELLER,
            password='password123',
        )
        self.store = Store.objects.create(
            owner=self.seller,
            name='Loja Perfumes',
            slug='loja-perfumes',
            cnpj='11111111000106',
            is_active=True,
        )
        self.brand = Brand.objects.create(name='Dior')
        self.product = Product.objects.create(name='Sauvage', brand=self.brand)
        self.store_product = StoreProduct.objects.create(
            store=self.store,
            product=self.product,
            price=Decimal('500.00'),
            stock_quantity=10,
            volume_ml=100,
        )
        self.order = Order.objects.create(
            user=self.user,
            store=self.store,
            status=OrderStatus.DELIVERED,
            delivered_at=timezone.now() - timedelta(days=5),
            total_amount=Decimal('500.00'),
            shipping_address={'city': 'São Paulo', 'state': 'SP'},
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            store_product=self.store_product,
            quantity=1,
            unit_price=Decimal('500.00'),
        )
        self.review = Review.objects.create(
            order_item=self.order_item,
            user=self.user,
            store=self.store,
            product=self.product,
            store_product=self.store_product,
            rating=5,
            comment='Gostei muito!',
        )
        self.return_req = ReturnRequest.objects.create(
            order=self.order,
            status=ReturnStatus.REQUESTED,
            reason='Arrependimento',
        )
        self.ret_item = ReturnItem.objects.create(
            return_request=self.return_req,
            order_item=self.order_item,
            quantity=1,
        )

    def test_approving_return_hides_associated_review(self):
        # RN-05 / RF-16.8 / CA-07: Ao aprovar devolução, ocultar avaliação do item devolvido
        self.client.force_authenticate(user=self.seller)
        response = self.client.post(
            f'/api/v1/store/returns/{self.return_req.id}/approve/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.review.refresh_from_db()
        self.assertTrue(self.review.is_hidden)

    def test_order_detail_exposes_can_review_flags(self):
        # RF-16.9: GET /api/v1/orders/{id}/ expõe can_review, review_id e can_edit_review
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/v1/orders/{self.order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        item_data = response.data['items'][0]
        self.assertEqual(item_data['review_id'], self.review.id)
        self.assertTrue(item_data['can_edit_review'])
        self.assertFalse(item_data['can_review'])
