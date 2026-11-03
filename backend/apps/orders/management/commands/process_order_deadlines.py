from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.orders.models import DeliveryConfirmedBy, Order, OrderStatus, OrderStatusHistory


class Command(BaseCommand):
    help = "Processa prazos de entrega e solicitações pendentes (RF-15 RN-08/RN-12)"

    def handle(self, *args, **options):
        now = timezone.now()
        # Auto-confirmação: SHIPPED > 30 dias
        cutoff = now - timedelta(days=30)
        for order in Order.objects.filter(status=OrderStatus.SHIPPED, shipped_at__lt=cutoff):
            old_status = order.status
            order.status = OrderStatus.DELIVERED
            order.delivered_at = now
            order.delivery_confirmed_by = DeliveryConfirmedBy.SYSTEM
            order.save(update_fields=["status", "delivered_at", "delivery_confirmed_by", "updated_at"])
            OrderStatusHistory.objects.create(
                order=order,
                from_status=old_status,
                to_status=OrderStatus.DELIVERED,
                actor=None,
                reason="Auto-confirmação por prazo (30 dias)",
            )
            self.stdout.write(self.style.SUCCESS(f"Auto-confirmado pedido {order.id}"))

        # RN-12: cancelar solicitações > 48h automaticamente? 
        # "solicitações de cancelamento (CANCEL_REQUESTED) e devolução (REQUESTED) sem resposta em 48h são aprovadas automaticamente"
        from apps.orders.services import OrderPostPurchaseService

        cutoff48 = now - timedelta(hours=48)
        for order in Order.objects.filter(status=OrderStatus.CANCEL_REQUESTED, cancel_requested_at__lt=cutoff48):
            try:
                OrderPostPurchaseService.respond_cancel_request(order, None, approve=True, reason="")
                self.stdout.write(self.style.SUCCESS(f"Cancelamento aprovado automaticamente {order.id}"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Erro auto-aprovar {order.id}: {e}"))

        self.stdout.write(self.style.SUCCESS("Finalizado"))
