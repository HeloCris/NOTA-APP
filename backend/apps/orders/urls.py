from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet,
    ShipOrderView,
    StoreOrderListView,
    UpdateOrderStatusView,
    process_payment,
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('payments/process/', process_payment, name='process-payment'),
    path('store/orders/', StoreOrderListView.as_view(), name='store-orders'),
    path('store/orders/<int:pk>/status/', UpdateOrderStatusView.as_view(), name='store-order-status'),
    path('store/orders/<int:pk>/ship/', ShipOrderView.as_view(), name='store-order-ship'),
]