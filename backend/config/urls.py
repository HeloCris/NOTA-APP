from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, path
from django.views.generic import RedirectView

from apps.stores.views import (
    CustomerFollowingStoresListView,
    ValidateCouponView,
    StoreCouponListCreateView,
    StoreCouponDetailView,
    StoreInstallmentsSettingsView,
)

urlpatterns: list[URLPattern | URLResolver] = [
    path("", RedirectView.as_view(url="/api/v1/showcase/home/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/stores/", include("apps.stores.urls")),

    # Rotas específicas RF-19 (Lojas Seguidas, Checkout Cupom e Lojista Cupons/Parcelamento)
    path("api/v1/customers/following-stores/", CustomerFollowingStoresListView.as_view(), name="customer-following-stores"),
    path("api/v1/checkout/validate-coupon/", ValidateCouponView.as_view(), name="checkout-validate-coupon"),
    path("api/v1/store/coupons/", StoreCouponListCreateView.as_view(), name="store-coupons-direct"),
    path("api/v1/store/coupons/<int:pk>/", StoreCouponDetailView.as_view(), name="store-coupons-detail-direct"),
    path("api/v1/store/settings/installments/", StoreInstallmentsSettingsView.as_view(), name="store-installments-settings-direct"),

    path(
    "api/v1/",
    include("apps.catalog.urls", namespace="catalog"),
    ),
    path("api/v1/", include("apps.inventory.urls")),
    path("api/v1/showcase/", include("apps.showcase.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    path("api/v1/", include("apps.communication.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)