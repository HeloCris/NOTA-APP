from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reviews.models import Review, ReviewReply
from apps.stores.models import Store

User = get_user_model()


class ReviewReplyTests(APITestCase):
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
        self.other_seller = User.objects.create_user(
            email='outro_lojista@example.com',
            first_name='Outro Lojista',
            role=User.Roles.SELLER,
            password='password123',
        )
        self.store = Store.objects.create(
            owner=self.seller,
            name='Loja Perfumes',
            slug='loja-perfumes',
            cnpj='11111111000104',
            is_active=True,
        )
        self.other_store = Store.objects.create(
            owner=self.other_seller,
            name='Outra Loja',
            slug='outra-loja',
            cnpj='11111111000105',
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
            comment='Excelente!',
        )

    def test_store_can_create_reply(self):
        # RN-09 / RF-16.6: PUT /api/v1/store/reviews/{id}/reply/
        self.client.force_authenticate(user=self.seller)
        response = self.client.put(
            f'/api/v1/store/reviews/{self.review.id}/reply/',
            {'text': 'Muito obrigado pela preferência, Maria!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ReviewReply.objects.count(), 1)
        reply = ReviewReply.objects.first()
        self.assertEqual(reply.text, 'Muito obrigado pela preferência, Maria!')
        self.assertEqual(reply.author, self.seller)
        self.assertEqual(reply.review, self.review)

    def test_store_can_edit_existing_reply(self):
        # RN-09: Editável pela loja
        reply = ReviewReply.objects.create(
            review=self.review,
            author=self.seller,
            text='Resposta antiga',
        )
        self.client.force_authenticate(user=self.seller)
        response = self.client.put(
            f'/api/v1/store/reviews/{self.review.id}/reply/',
            {'text': 'Resposta atualizada com carinho.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reply.refresh_from_db()
        self.assertEqual(reply.text, 'Resposta atualizada com carinho.')

    def test_other_store_cannot_reply(self):
        # CA-10: Lojista só responde avaliações da própria loja (404 caso contrário)
        self.client.force_authenticate(user=self.other_seller)
        response = self.client.put(
            f'/api/v1/store/reviews/{self.review.id}/reply/',
            {'text': 'Tentativa de invadir resposta'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_cannot_reply(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(
            f'/api/v1/store/reviews/{self.review.id}/reply/',
            {'text': 'Tentativa cliente'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
