
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.catalog.views import RecommendedProductListView, CatalogNotesView

from .views import (
    BrandListView, 
    ProductDetailView, 
    ProductListCreateView,
    BrandRegisterView,
    BrandMeView,
    BrandProductViewSet,
    ActivateD2CView,
    DeactivateD2CView,
    AdminBrandApproveView,
    BrandOnboardingView,
    BrandStatusView
)

app_name = "catalog"

router = DefaultRouter()
router.register(r'brands/me/products', BrandProductViewSet, basename='brand-products')


urlpatterns = [
    path("brands/", BrandListView.as_view(), name="brand-list"),
    path("brands/status/", BrandStatusView.as_view(), name="brand-status"),
    path("brands/onboarding/", BrandOnboardingView.as_view(), name="brand-onboarding"),
    path("brands/register/", BrandRegisterView.as_view(), name="brand-register"),
    path("brands/me/", BrandMeView.as_view(), name="brand-me"),
    path("brands/me/activate-d2c/", ActivateD2CView.as_view(), name="activate-d2c"),
    path("brands/me/deactivate-d2c/", DeactivateD2CView.as_view(), name="deactivate-d2c"),
    path("admin/brands/<int:pk>/approve/", AdminBrandApproveView.as_view(), name="admin-brand-approve"),
    path("", include(router.urls)),
    
    path("products/", ProductListCreateView.as_view(), name="product-list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path('products/recommended/', RecommendedProductListView.as_view(), name='recommended-products'),
    path('catalog/notes/', CatalogNotesView.as_view(), name='catalog-notes'),
]