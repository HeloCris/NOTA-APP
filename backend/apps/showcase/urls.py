from django.urls import path

from .views import ShowcaseProductListView, ShowcaseStoreDetailView

urlpatterns = [
    path("products/", ShowcaseProductListView.as_view(), name="showcase-products"),
    path("stores/<slug:slug>/", ShowcaseStoreDetailView.as_view(), name="showcase-store"),
]
