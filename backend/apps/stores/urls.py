from django.urls import path

from .views import StoreDetailView, StoreListView, StoreMeView, StoreDashboardView

urlpatterns = [
    path("", StoreListView.as_view(), name="store-list"),
    path("me/", StoreMeView.as_view(), name="store-me"),
    path("me/dashboard/", StoreDashboardView.as_view(), name="store-dashboard"),
    path("<int:pk>/", StoreDetailView.as_view(), name="store-detail"),
]
