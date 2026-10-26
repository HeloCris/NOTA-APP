from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, OrderStatus, ReturnRequest, ReturnStatus
from apps.orders.services import OrderPostPurchaseService


class Command(BaseCommand):
    help = 'Processa prazos automáticos de pedidos (RN-08 e RN-12)'

    def handle(self, *args, **options):
        now = timezone.now()

        # RN-08: Pedidos em SHIPPED há mais de 30 dias mudam para DELIVERED (SYSTEM)
        thirty_days_ago = now - timedelta(days=30)
        shipped_orders = Order.objects.filter(status=OrderStatus.SHIPPED, shipped_at__lte=thirty_days_ago)

        auto_delivered_count = 0
        for order in shipped_orders:
            OrderPostPurchaseService.confirm_delivery(order, user=None, confirmed_by='SYSTEM')
            auto_delivered_count += 1

        # RN-12: Solicitacoes de cancelamento (CANCEL_REQUESTED) sem resposta ha 48h sao aprovadas
        forty_eight_hours_ago = now - timedelta(hours=48)
        pending_cancels = Order.objects.filter(status=OrderStatus.CANCEL_REQUESTED, cancel_requested_at__lte=forty_eight_hours_ago)

        auto_cancel_count = 0
        for order in pending_cancels:
            OrderPostPurchaseService.respond_cancel_request(order, store_user=None, approve=True, reason='Aprovado automaticamente por tempo limite de 48h.')
            auto_cancel_count += 1

        # RN-12: Devoluções solicitadas (REQUESTED) sem resposta em 48h são aprovadas
        pending_returns = ReturnRequest.objects.filter(status=ReturnStatus.REQUESTED, created_at__lte=forty_eight_hours_ago)

        auto_return_count = 0
        for ret in pending_returns:
            ret.status = ReturnStatus.APPROVED
            ret.save()
            auto_return_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Prazos processados: {auto_delivered_count} entregas auto-confirmadas, '
                f'{auto_cancel_count} cancelamentos aprovados, {auto_return_count} devoluções aprovadas.'
            )
        )