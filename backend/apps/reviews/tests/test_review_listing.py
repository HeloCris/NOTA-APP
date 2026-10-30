from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.reviews.models import Review, ReviewPhoto, ReviewReply
from apps.stores.models import Store

User = get_user_model()


def generate_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='purple')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile('test.jpg', file.read(), content_type='image/jpeg')


class ReviewListingTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email='maria@example.com',
            first_name='Maria',
            last_name='Silva',
            password='password123',
        )
        self.user2 = User.objects.create_user(
            email='carlos@example.com',
            first_name='Carlos',
            last_name='Oliveira',
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
            name='Loja Teste',
            slug='loja-teste',
            cnpj='11111111000103',
            is_active=True,
        )
        self.brand = Brand.objects.create(name='Chanel')
        self.product1 = Product.objects.create(name='Bleu de Chanel', brand=self.brand, is_approved=True)
        self.product2 = Product.objects.create(name='Allure Homme', brand=self.brand, is_approved=True)

        self.sp1 = StoreProduct.objects.create(
            store=self.store, product=self.product1, price=Decimal('600.00'), stock_quantity=10, volume_ml=100
        )
        self.sp2 = StoreProduct.objects.create(
            store=self.store, product=self.product2, price=Decimal('700.00'), stock_quantity=10, volume_ml=50
        )

        order1 = Order.objects.create(
            user=self.user1, store=self.store, status=OrderStatus.DELIVERED,
            delivered_at=timezone.now() - timedelta(days=2), total_amount=Decimal('600.00'),
            shipping_address={'city': 'São Paulo', 'state': 'SP'}
        )
        self.oi1 = OrderItem.objects.create(
            order=order1, store_product=self.sp1, quantity=1, unit_price=Decimal('600.00')
        )

        order2 = Order.objects.create(
            user=self.user2, store=self.store, status=OrderStatus.DELIVERED,
            delivered_at=timezone.now() - timedelta(days=3), total_amount=Decimal('700.00'),
            shipping_address={'city': 'São Paulo', 'state': 'SP'}
        )
        self.oi2 = OrderItem.objects.create(
            order=order2, store_product=self.sp2, quantity=1, unit_price=Decimal('700.00')
        )

        # Review 1 (Bleu, 5 estrelas, com foto, sem resposta)
        self.rev1 = Review.objects.create(
            order_item=self.oi1,
            user=self.user1,
            store=self.store,
            product=self.product1,
            store_product=self.sp1,
            rating=5,
            comment='Incrível!',
            created_at=timezone.now() - timedelta(days=2),
        )
        ReviewPhoto.objects.create(review=self.rev1, image=generate_test_image())

        # Review 2 (Allure, 4 estrelas, sem foto, com resposta)
        self.rev2 = Review.objects.create(
            order_item=self.oi2,
            user=self.user2,
            store=self.store,
            product=self.product2,
            store_product=self.sp2,
            rating=4,
            comment='Muito bom!',
            created_at=timezone.now() - timedelta(days=1),
        )
        ReviewReply.objects.create(review=self.rev2, author=self.seller, text='Obrigado Carlos!')

    def test_store_reviews_public_listing_with_summary(self):
        # RF-16.4: GET /api/v1/stores/{id}/reviews/
        response = self.client.get(f'/api/v1/stores/{self.store.id}/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        summary = response.data['summary']
        self.assertEqual(summary['count'], 2)
        self.assertEqual(summary['average'], 4.5)
        self.assertEqual(summary['distribution']['5'], 1)
        self.assertEqual(summary['distribution']['4'], 1)
        self.assertEqual(summary['distribution']['3'], 0)

        # Check results
        results = response.data['results']
        self.assertEqual(len(results), 2)
        # Author anonymization RN-12
        authors = [r['author_name'] for r in results]
        self.assertIn('Maria S.', authors)
        self.assertIn('Carlos O.', authors)

    def test_store_product_reviews_listing(self):
        # RF-16.5: GET /api/v1/stores/{id}/products/{product_id}/reviews/
        response = self.client.get(f'/api/v1/stores/{self.store.id}/products/{self.product1.id}/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['count'], 1)
        self.assertEqual(response.data['summary']['average'], 5.0)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['rating'], 5)

    def test_filter_by_with_photos(self):
        response = self.client.get(f'/api/v1/stores/{self.store.id}/reviews/?with_photos=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.rev1.id)

    def test_filter_by_rating(self):
        response = self.client.get(f'/api/v1/stores/{self.store.id}/reviews/?rating=4')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.rev2.id)

    def test_seller_reviews_listing_unanswered_filter(self):
        # RF-16.6: GET /api/v1/store/reviews/?unanswered=true
        self.client.force_authenticate(user=self.seller)
        response = self.client.get('/api/v1/store/reviews/?unanswered=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.rev1.id)

    def test_hidden_and_deleted_reviews_not_in_listing(self):
        self.rev1.is_deleted = True
        self.rev1.save()

        self.rev2.is_hidden = True
        self.rev2.save()

        response = self.client.get(f'/api/v1/stores/{self.store.id}/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['count'], 0)
        self.assertEqual(response.data['summary']['average'], 0.0)
        self.assertEqual(len(response.data['results']), 0)

    def test_store_product_public_serializer_exposes_rating_and_reviews_count(self):
        # RF-16.7 / RN-11: Detalhe de oferta (StoreProduct) passa a expor rating e reviews_count
        response = self.client.get(f'/api/v1/stores/{self.store.id}/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        
        # Produto 1 tem rev1 (rating=5)
        item1 = next((p for p in response.data if p['id'] == self.sp1.id), None)
        self.assertIsNotNone(item1)
        self.assertEqual(item1['rating'], 5.0)
        self.assertEqual(item1['reviews_count'], 1)

        # Produto 2 tem rev2 (rating=4)
        item2 = next((p for p in response.data if p['id'] == self.sp2.id), None)
        self.assertIsNotNone(item2)
        self.assertEqual(item2['rating'], 4.0)
        self.assertEqual(item2['reviews_count'], 1)

