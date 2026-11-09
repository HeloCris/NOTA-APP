from django.urls import path

from .views import (
    ShowcaseHomeFeedView,
    ShowcaseProductListView,
    ShowcaseStoreDetailView,
)

urlpatterns = [
    path("home/", ShowcaseHomeFeedView.as_view(), name="showcase-home-feed"),
    path("products/", ShowcaseProductListView.as_view(), name="showcase-products"),
    path("stores/<slug:slug>/", ShowcaseStoreDetailView.as_view(), name="showcase-store"),
]
