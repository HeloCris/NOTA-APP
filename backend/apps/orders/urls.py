from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerCancelOrderView,
    CustomerChangeAddressView,
    CustomerConfirmDeliveryView,
    CustomerCreateReturnView,
    CustomerDisputeDeliveryView,
    OrderViewSet,
    ShipOrderView,
    StoreCancelOrderView,
    StoreMarkDeliveredView,
    StoreOrderDetailView,
    StoreOrderListView,
    StoreProcessReturnView,
    StoreResolveDisputeView,
    StoreRespondCancelRequestView,
    UpdateOrderStatusView,
    process_payment,
)

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    # Roteador padrão para listagem e criação de pedidos do cliente (/orders/ e /orders/{id}/)
    path('', include(router.urls)),
    # Processamento de pagamento
    path('payments/process/', process_payment, name='process-payment'),
    # Endpoints de Pós-Compra do Cliente (RF-15)
    path(
        'orders/<int:pk>/cancel/',
        CustomerCancelOrderView.as_view(),
        name='customer-order-cancel',
    ),
    path(
        'orders/<int:pk>/address/',
        CustomerChangeAddressView.as_view(),
        name='customer-order-address',
    ),
    path(
        'orders/<int:pk>/confirm-delivery/',
        CustomerConfirmDeliveryView.as_view(),
        name='customer-order-confirm-delivery',
    ),
    path(
        'orders/<int:pk>/dispute-delivery/',
        CustomerDisputeDeliveryView.as_view(),
        name='customer-order-dispute-delivery',
    ),
    path(
        'orders/<int:pk>/returns/',
        CustomerCreateReturnView.as_view(),
        name='customer-order-returns',
    ),
    # Endpoints do Lojista / Painel da Loja (RF-12, RF-13 e RF-15)
    path('store/orders/', StoreOrderListView.as_view(), name='store-orders'),
    path(
        'store/orders/<int:pk>/',
        StoreOrderDetailView.as_view(),
        name='store-order-detail',
    ),
    path(
        'store/orders/<int:pk>/status/',
        UpdateOrderStatusView.as_view(),
        name='store-order-status',
    ),
    path(
        'store/orders/<int:pk>/ship/',
        ShipOrderView.as_view(),
        name='store-order-ship',
    ),
    path(
        'store/orders/<int:pk>/cancel/',
        StoreCancelOrderView.as_view(),
        name='store-order-cancel',
    ),
    path(
        'store/orders/<int:pk>/cancel-request/<str:action>/',
        StoreRespondCancelRequestView.as_view(),
        name='store-order-cancel-request',
    ),
    path(
        'store/orders/<int:pk>/mark-delivered/',
        StoreMarkDeliveredView.as_view(),
        name='store-order-mark-delivered',
    ),
    path(
        'store/orders/<int:pk>/dispute/<str:action>/',
        StoreResolveDisputeView.as_view(),
        name='store-order-dispute',
    ),
    path(
        'store/returns/<int:pk>/<str:action>/',
        StoreProcessReturnView.as_view(),
        name='store-return-process',
    ),
]