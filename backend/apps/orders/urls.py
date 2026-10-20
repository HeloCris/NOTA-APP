from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, process_payment

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('payments/process/', process_payment, name='process-payment'),
]