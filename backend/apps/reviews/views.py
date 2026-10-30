from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.orders.models import OrderItem, OrderStatus, ReturnRequest, ReturnStatus
from apps.stores.models import Store
from .models import Review, ReviewPhoto, ReviewReply
from .serializers import ReviewReplySerializer, ReviewSerializer


def calculate_review_summary(queryset):
    """
    Calcula média, contagem total e distribuição por estrela (1 a 5).
    """
    count = queryset.count()
    if count == 0:
        return {
            'count': 0,
            'average': 0.0,
            'distribution': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0},
        }

    avg_rating = queryset.aggregate(avg=Avg('rating'))['avg'] or 0.0
    average = round(float(avg_rating), 1)

    dist = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
    counts = queryset.values('rating').annotate(total=Count('id'))
    for item in counts:
        r = str(item['rating'])
        if r in dist:
            dist[r] = item['total']

    return {
        'count': count,
        'average': average,
        'distribution': dist,
    }


class CustomerReviewViewSet(viewsets.ModelViewSet):
    """
    Endpoints do cliente:
    - POST /api/v1/reviews/ (criação multipart)
    - PATCH /api/v1/reviews/{id}/ (edição única)
    - DELETE /api/v1/reviews/{id}/ (exclusão lógica)
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user, is_deleted=False)  # type: ignore[misc]

    def perform_create(self, serializer):
        user = self.request.user
        order_item_id = self.request.data.get('order_item')  # type: ignore[union-attr]
        if not order_item_id:
            raise ValidationError({'order_item': 'O item do pedido é obrigatório.'})

        try:
            order_item = OrderItem.objects.select_related('order', 'store_product__store', 'store_product__product').get(  # type: ignore[misc]
                id=order_item_id, order__user=user
            )
        except OrderItem.DoesNotExist:  # type: ignore
            raise ValidationError({'order_item': 'Item de pedido não encontrado ou não pertence a você.'})

        # RN-02: Apenas 1 avaliação por OrderItem (inclusive após exclusão)
        if hasattr(order_item, 'review'):
            raise ValidationError({'order_item': 'Este item já foi avaliado anteriormente.'})

        # RN-03: Só pode avaliar itens de pedidos DELIVERED, em até 30 dias após delivered_at
        order = order_item.order
        if order.status != OrderStatus.DELIVERED or not order.delivered_at:
            raise ValidationError({'order_item': 'Só é possível avaliar pedidos entregues.'})

        now = timezone.now()
        if (now - order.delivered_at).days > 30:
            raise ValidationError({'order_item': 'O prazo de 30 dias para avaliação expirou.'})

        # RN-04: Itens com devolução (ReturnRequest não recusada) não podem ser avaliados
        has_active_return = ReturnRequest.objects.filter(
            order=order, items__order_item=order_item
        ).exclude(status=ReturnStatus.REJECTED).exists()
        if not has_active_return:
            # Fallback se devolução for no pedido como um todo
            has_active_return = ReturnRequest.objects.filter(
                order=order
            ).exclude(status=ReturnStatus.REJECTED).exists()

        if has_active_return:
            raise ValidationError({'order_item': 'Não é possível avaliar itens com processo de devolução em aberto ou concluído.'})

        # RN-06: Até 3 fotos
        photos = self.request.FILES.getlist('photos')
        if len(photos) > 3:
            raise ValidationError({'photos': 'Você pode enviar no máximo 3 fotos por avaliação.'})

        rating = self.request.data.get('rating')  # type: ignore[union-attr]
        if not rating or int(rating) < 1 or int(rating) > 5:
            raise ValidationError({'rating': 'A nota de 1 a 5 é obrigatória.'})

        comment = self.request.data.get('comment', '')  # type: ignore[union-attr]
        if len(comment) > 1000:
            raise ValidationError({'comment': 'O comentário pode ter no máximo 1000 caracteres.'})

        with transaction.atomic():
            review = serializer.save(
                order_item=order_item,
                user=user,
                store=order_item.store_product.store,
                product=order_item.store_product.product,
                store_product=order_item.store_product,
                rating=int(rating),
                comment=comment,
            )
            for photo in photos:
                ReviewPhoto.objects.create(review=review, image=photo)

    def partial_update(self, request, *args, **kwargs):
        review = self.get_object()

        # RN-07: Edição única em até 30 dias
        if review.edited_at is not None:
            return Response(
                {'error': 'A avaliação já foi editada anteriormente. Permitida apenas 1 edição.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = review.order_item.order
        if not order.delivered_at or (timezone.now() - order.delivered_at).days > 30:
            return Response(
                {'error': 'O prazo de 30 dias para edição expirou.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating = request.data.get('rating')
        if rating is not None:
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    return Response({'error': 'A nota deve ser entre 1 e 5.'}, status=status.HTTP_400_BAD_REQUEST)
                review.rating = rating
            except ValueError:
                return Response({'error': 'Nota inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'comment' in request.data:
            comment = request.data.get('comment', '')
            if len(comment) > 1000:
                return Response({'error': 'Comentário muito longo.'}, status=status.HTTP_400_BAD_REQUEST)
            review.comment = comment

        photos = request.FILES.getlist('photos')
        if photos:
            if len(photos) > 3:
                return Response({'error': 'Máximo 3 fotos.'}, status=status.HTTP_400_BAD_REQUEST)
            with transaction.atomic():
                review.photos.all().delete()
                for p in photos:
                    ReviewPhoto.objects.create(review=review, image=p)

        review.edited_at = timezone.now()
        review.save()
        return Response(self.get_serializer(review).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        # RN-08: Exclusão lógica
        review = self.get_object()
        review.is_deleted = True
        review.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Listagens públicas com filtros e resumo (RF-16.4 e RF-16.5):
    - GET /api/v1/stores/{id}/reviews/
    - GET /api/v1/stores/{id}/products/{product_id}/reviews/
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        store_id = self.kwargs.get('store_id')
        product_id = self.kwargs.get('product_id')

        qs = Review.objects.filter(  # type: ignore[misc]
            is_hidden=False,
            is_deleted=False,
        ).select_related('user', 'product', 'store_product', 'order_item', 'reply')

        if store_id:
            qs = qs.filter(store_id=store_id)

        if product_id:
            qs = qs.filter(product_id=product_id)

        # Filtros de query params
        perfume_param = self.request.query_params.get('product')
        if perfume_param:
            qs = qs.filter(product_id=perfume_param)

        rating_param = self.request.query_params.get('rating')
        if rating_param:
            qs = qs.filter(rating=rating_param)

        with_photos = self.request.query_params.get('with_photos')
        if with_photos in ['true', 'True', '1']:
            qs = qs.filter(photos__isnull=False).distinct()

        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering in ['-created_at', 'created_at', '-rating', 'rating']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        summary = calculate_review_summary(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            res = self.get_paginated_response(serializer.data)
            res.data['summary'] = summary
            return res

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'summary': summary,
            'results': serializer.data,
        })


class StoreReviewViewSet(viewsets.GenericViewSet):
    """
    Visão do Lojista (RF-16.6):
    - GET /api/v1/store/reviews/
    - PUT /api/v1/store/reviews/{id}/reply/
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_store(self):
        user = self.request.user
        store = getattr(user, 'store', None)
        if not store:
            store = Store.objects.filter(owner=user).first()  # type: ignore[misc]
        if not store and hasattr(user, 'brands'):
            brand = user.brands.filter(d2c_store__isnull=False).first()
            if brand and brand.d2c_store:
                store = brand.d2c_store
        return store

    def list(self, request):
        store = self._get_store()
        if not store:
            return Response({'error': 'Loja não encontrada.'}, status=status.HTTP_403_FORBIDDEN)

        qs = Review.objects.filter(
            store=store,
            is_hidden=False,
            is_deleted=False,
        ).select_related('user', 'product', 'store_product', 'order_item', 'reply')

        product_id = request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)

        rating_param = request.query_params.get('rating')
        if rating_param:
            qs = qs.filter(rating=rating_param)

        with_photos = request.query_params.get('with_photos')
        if with_photos in ['true', 'True', '1']:
            qs = qs.filter(photos__isnull=False).distinct()

        unanswered = request.query_params.get('unanswered')
        if unanswered in ['true', 'True', '1']:
            qs = qs.filter(reply__isnull=True)

        ordering = request.query_params.get('ordering', '-created_at')
        if ordering in ['-created_at', 'created_at', '-rating', 'rating']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        summary = calculate_review_summary(qs)
        serializer = self.get_serializer(qs, many=True)
        return Response({
            'summary': summary,
            'results': serializer.data,
        })

    @action(detail=True, methods=['put'], url_path='reply')
    def reply(self, request, pk=None):
        store = self._get_store()
        if not store:
            return Response({'error': 'Loja não encontrada.'}, status=status.HTTP_403_FORBIDDEN)

        review = get_object_or_404(Review, pk=pk, store=store, is_deleted=False)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Texto da resposta é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(text) > 1000:
            return Response({'error': 'Texto muito longo (máximo 1000 caracteres).'}, status=status.HTTP_400_BAD_REQUEST)

        reply, _ = ReviewReply.objects.update_or_create(
            review=review,
            defaults={
                'author': request.user,
                'text': text,
                'updated_at': timezone.now(),
            },
        )
        return Response(ReviewReplySerializer(reply).data, status=status.HTTP_200_OK)
