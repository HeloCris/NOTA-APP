from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta
import io
from PIL import Image

from apps.catalog.models import Brand, Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus, ReturnRequest, ReturnStatus
from apps.reviews.models import Review
from apps.stores.models import Store

User = get_user_model()


def generate_test_image():
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='blue')
    image.save(file, 'jpeg')
    file.seek(0)
    return SimpleUploadedFile('test.jpg', file.read(), content_type='image/jpeg')


class ReviewCreateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='maria@example.com',
            first_name='Maria',
            last_name='Silva',
            password='password123',
        )
        self.other_user = User.objects.create_user(
            email='joao@example.com',
            first_name='João',
            last_name='Souza',
            password='password123',
        )
        self.seller = User.objects.create_user(
            email='lojista@example.com',
            first_name='Lojista',
            last_name='Um',
            role=User.Roles.SELLER,
            password='password123',
        )
        self.store = Store.objects.create(
            owner=self.seller,
            name='Loja Perfumes',
            slug='loja-perfumes',
            cnpj='11111111000101',
            is_active=True,
        )
        self.brand = Brand.objects.create(name='Dior')
        self.product = Product.objects.create(
            name='Sauvage',
            brand=self.brand,
            description='Perfume amadeirado',
        )
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

    def test_create_review_success(self):
        self.client.force_authenticate(user=self.user)
        img1 = generate_test_image()
        response = self.client.post(
            '/api/v1/reviews/',
            {
                'order_item': self.order_item.id,
                'rating': 5,
                'comment': 'Excelente perfume, fixação fantástica!',
                'photos': [img1],
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 1)
        review = Review.objects.first()
        assert review is not None
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Excelente perfume, fixação fantástica!')
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.store, self.store)
        self.assertEqual(review.product, self.product)
        self.assertEqual(review.store_product, self.store_product)
        self.assertEqual(review.photos.count(), 1)
        self.assertEqual(response.data['author_name'], 'Maria S.')

    def test_create_review_unauthenticated(self):
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_review_not_delivered_fails(self):
        self.order.status = OrderStatus.SHIPPED
        self.order.delivered_at = None
        self.order.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('entregue', str(response.data).lower())

    def test_create_review_after_30_days_fails(self):
        self.order.delivered_at = timezone.now() - timedelta(days=31)
        self.order.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('30 dias', str(response.data).lower())

    def test_create_second_review_for_same_order_item_fails(self):
        Review.objects.create(
            order_item=self.order_item,
            user=self.user,
            store=self.store,
            product=self.product,
            store_product=self.store_product,
            rating=4,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_second_review_after_deletion_fails(self):
        # RN-08 / CA-02: Segunda avaliação para o mesmo OrderItem retorna 400 inclusive após exclusão lógica
        Review.objects.create(
            order_item=self.order_item,
            user=self.user,
            store=self.store,
            product=self.product,
            store_product=self.store_product,
            rating=4,
            is_deleted=True,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_with_return_request_not_rejected_fails(self):
        # RN-04 / CA-03: Itens com devolução não recusada não podem ser avaliados
        ReturnRequest.objects.create(
            order=self.order,
            status=ReturnStatus.REQUESTED,
            reason='Defeito no borrifador',
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_with_rejected_return_request_succeeds(self):
        ReturnRequest.objects.create(
            order=self.order,
            status=ReturnStatus.REJECTED,
            reason='Defeito',
            description='Produto fora da garantia',
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_review_with_more_than_3_photos_fails(self):
        # RN-06 / CA-04: Máximo 3 fotos
        self.client.force_authenticate(user=self.user)
        photos = [generate_test_image() for _ in range(4)]
        response = self.client.post(
            '/api/v1/reviews/',
            {
                'order_item': self.order_item.id,
                'rating': 5,
                'photos': photos,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('3', str(response.data))

    def test_cannot_review_other_user_order_item(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(
            '/api/v1/reviews/',
            {'order_item': self.order_item.id, 'rating': 5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
