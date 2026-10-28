from django.urls import path
from .views import CustomerReviewViewSet, PublicReviewViewSet, StoreReviewViewSet

urlpatterns = [
    # RF-16.2 & RF-16.3: Cliente
    path(
        'reviews/',
        CustomerReviewViewSet.as_view({'post': 'create', 'get': 'list'}),
        name='customer-reviews',
    ),
    path(
        'reviews/<int:pk>/',
        CustomerReviewViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy', 'get': 'retrieve'}),
        name='customer-review-detail',
    ),

    # RF-16.4: Público - Loja
    path(
        'stores/<int:store_id>/reviews/',
        PublicReviewViewSet.as_view({'get': 'list'}),
        name='public-store-reviews',
    ),

    # RF-16.5: Público - Perfume na Loja
    path(
        'stores/<int:store_id>/products/<int:product_id>/reviews/',
        PublicReviewViewSet.as_view({'get': 'list'}),
        name='public-store-product-reviews',
    ),

    # RF-16.6: Lojista
    path(
        'store/reviews/',
        StoreReviewViewSet.as_view({'get': 'list'}),
        name='store-reviews',
    ),
    path(
        'store/reviews/<int:pk>/reply/',
        StoreReviewViewSet.as_view({'put': 'reply'}),
        name='store-review-reply',
    ),
]
