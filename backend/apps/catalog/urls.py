from django.urls import path

from .views import BrandListView, ProductDetailView, ProductListCreateView


urlpatterns = [
    path("brands/", BrandListView.as_view(), name="brand-list"),
    path("products/", ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
]