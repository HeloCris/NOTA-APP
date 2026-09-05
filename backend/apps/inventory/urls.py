from django.urls import path

from .views import StoreProductDetailView, StoreProductListCreateView

urlpatterns = [
    path(
        "store-products/",
        StoreProductListCreateView.as_view(),
        name="store-product-list",
    ),
    path(
        "store-products/<int:pk>/",
        StoreProductDetailView.as_view(),
        name="store-product-detail",
    ),
]