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
from apps.reviews.models import Review
from apps.stores.models import Store

User = get_user_model()


def generate_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='green')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile('test.jpg', file.read(), content_type='image/jpeg')


class ReviewEditDeleteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='maria@example.com',
            first_name='Maria',
            last_name='Silva',
            password='password123',
        )
        self.other_user = User.objects.create_user(
            email='outro@example.com',
            first_name='Outro',
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
            cnpj='11111111000102',
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
        self.order = Order.objects.create(  # type: ignore
            user=self.user,
            store=self.store,
            status=OrderStatus.DELIVERED,
            delivered_at=timezone.now() - timedelta(days=5),
            total_amount=Decimal('500.00'),
            shipping_address={'city': 'São Paulo', 'state': 'SP'},
        )
        self.order_item = OrderItem.objects.create(  # type: ignore
            order=self.order,
            store_product=self.store_product,
            quantity=1,
            unit_price=Decimal('500.00'),
        )
        self.review = Review.objects.create(  # type: ignore
            order_item=self.order_item,
            user=self.user,
            store=self.store,
            product=self.product,
            store_product=self.store_product,
            rating=4,
            comment='Gostei bastante.',
        )

    def test_single_edit_within_30_days_succeeds(self):
        # RN-07 / CA-05: Cliente pode editar 1 vez dentro de 30 dias
        self.client.force_authenticate(user=self.user)
        img = generate_test_image()
        response = self.client.patch(
            f'/api/v1/reviews/{self.review.id}/',
            {
                'rating': 5,
                'comment': 'Usando mais dias, achei perfeito!',
                'photos': [img],
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.review.refresh_from_db()
        self.assertEqual(self.review.rating, 5)
        self.assertEqual(self.review.comment, 'Usando mais dias, achei perfeito!')
        self.assertIsNotNone(self.review.edited_at)
        self.assertTrue(self.review.is_edited)
        self.assertEqual(self.review.photos.count(), 1)

    def test_second_edit_fails(self):
        # CA-05: Segunda edição retorna 400
        self.review.edited_at = timezone.now() - timedelta(days=1)
        self.review.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/v1/reviews/{self.review.id}/',
            {'rating': 3},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('já foi editada', str(response.data).lower())

    def test_edit_after_30_days_fails(self):
        self.order.delivered_at = timezone.now() - timedelta(days=32)
        self.order.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/v1/reviews/{self.review.id}/',
            {'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('30 dias', str(response.data).lower())

    def test_other_user_cannot_edit_review(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            f'/api/v1/reviews/{self.review.id}/',
            {'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_review_performs_soft_delete(self):
        # RN-08 / CA-06: Exclusão lógica (is_deleted = True)
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/v1/reviews/{self.review.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.review.refresh_from_db()
        self.assertTrue(self.review.is_deleted)
