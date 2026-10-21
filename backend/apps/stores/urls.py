from django.urls import path

from .views import (
    StoreDetailView, 
    StoreListView, 
    StoreMeView, 
    StoreDashboardView,
    StoreProductListView,
    StoreFollowToggleView,
    StoreShippingQuoteView,
)

urlpatterns = [
    path("", StoreListView.as_view(), name="store-list"),
    path("me/", StoreMeView.as_view(), name="store-me"),
    path("me/dashboard/", StoreDashboardView.as_view(), name="store-dashboard"),
    path("<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
    
    # Nova rota para a vitrine mobile da loja (RF-08.1 e RF-08.8)
    path("<int:pk>/products/", StoreProductListView.as_view(), name="store-products-list"),
    path("<int:pk>/follow/", StoreFollowToggleView.as_view(), name="store-follow-toggle"),

    # Rota de cotação de frete por loja (RF-10)
    path("<int:pk>/shipping-quote/", StoreShippingQuoteView.as_view(), name="store-shipping-quote"),
]