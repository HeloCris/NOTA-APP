from django.urls import path
from .views import FeedPublicoView, VitrineLojaView

urlpatterns = [
    # Rota para o feed geral: /api/inventory/feed/
    path('feed/', FeedPublicoView.as_view(), name='feed-publico'),
    
    # Rota para a vitrine de uma loja específica: /api/inventory/store/1/vitrine/
    path('store/<int:store_id>/vitrine/', VitrineLojaView.as_view(), name='vitrine-loja'),
]