from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework.exceptions import ValidationError
from .models import Order, OrderStatus, OrderStatusHistory, ReturnRequest, ReturnStatus, ReturnItem, DeliveryConfirmedBy


class OrderPostPurchaseService:

    @staticmethod
    def log_history(order, from_status, to_status, actor=None, reason=''):
        OrderStatusHistory.objects.create(
            order=order,
            from_status=from_status,
            to_status=to_status,
            actor=actor,
            reason=reason
        )

    @staticmethod
    def restore_stock(order_items):
        for item in order_items:
            product = item.product
            product.stock_quantity += item.quantity
            product.save(update_fields=['stock_quantity'])

    @staticmethod
    @transaction.atomic
    def cancel_by_customer(order: Order, user, reason: str):
        if not reason:
            raise ValidationError({'reason': 'Motivo obrigatório para cancelamento.'})

        old_status = order.status

        if old_status in [OrderStatus.PENDING, OrderStatus.PAID]:
            order.status = OrderStatus.CANCELLED
            order.cancel_reason = reason
            order.save()
            OrderPostPurchaseService.restore_stock(order.items.all())
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.CANCELLED, actor=user, reason=reason)
            return order

        elif old_status == OrderStatus.PROCESSING:
            order.status = OrderStatus.CANCEL_REQUESTED
            order.cancel_reason = reason
            order.cancel_requested_at = timezone.now()
            order.save()
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.CANCEL_REQUESTED, actor=user, reason=reason)
            return order

        else:
            raise ValidationError('Não é possível cancelar um pedido no status atual.')

    @staticmethod
    @transaction.atomic
    def respond_cancel_request(order: Order, store_user, approve: bool, reason: str = ''):
        if order.status != OrderStatus.CANCEL_REQUESTED:
            raise ValidationError('O pedido não possui solicitação de cancelamento pendente.')

        if approve:
            old_status = order.status
            order.status = OrderStatus.CANCELLED
            order.save()
            OrderPostPurchaseService.restore_stock(order.items.all())
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.CANCELLED, actor=store_user, reason='Cancelamento aprovado pelo lojista.')
        else:
            if not reason:
                raise ValidationError({'reason': 'Motivo obrigatório para recusar o cancelamento.'})
            old_status = order.status
            order.status = OrderStatus.PROCESSING
            order.save()
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.PROCESSING, actor=store_user, reason=f'Cancelamento recusado: {reason}')

        return order

    @staticmethod
    @transaction.atomic
    def cancel_by_store(order: Order, store_user, reason: str):
        if not reason:
            raise ValidationError({'reason': 'Motivo obrigatório para cancelamento.'})

        if order.status not in [OrderStatus.PAID, OrderStatus.PROCESSING]:
            raise ValidationError('Apenas pedidos em Pagamento Aprovado ou Em Separação podem ser cancelados.')

        old_status = order.status
        order.status = OrderStatus.CANCELLED
        order.cancel_reason = reason
        order.save()

        # Se motivo não for "Sem estoque", devolve ao estoque
        if reason != 'Sem estoque':
            OrderPostPurchaseService.restore_stock(order.items.all())

        OrderPostPurchaseService.log_history(order, old_status, OrderStatus.CANCELLED, actor=store_user, reason=reason)
        return order

    @staticmethod
    def change_shipping_address(order: Order, new_address_data: dict):
        if order.status not in [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING]:
            raise ValidationError('Endereço só pode ser alterado até a etapa de separação.')

        new_city = new_address_data.get('shipping_city', '').strip().upper()
        new_state = new_address_data.get('shipping_state', '').strip().upper()

        if new_city != order.shipping_city.upper() or new_state != order.shipping_state.upper():
            raise ValidationError('Alteração de endereço permitida apenas para a mesma Cidade/UF.')

        order.shipping_street = new_address_data.get('shipping_street', order.shipping_street)
        order.shipping_number = new_address_data.get('shipping_number', order.shipping_number)
        order.shipping_neighborhood = new_address_data.get('shipping_neighborhood', order.shipping_neighborhood)
        order.shipping_zip_code = new_address_data.get('shipping_zip_code', order.shipping_zip_code)
        order.address_changed = True
        order.save()

        return order

    @staticmethod
    @transaction.atomic
    def confirm_delivery(order: Order, user, confirmed_by: str):
        if order.status != OrderStatus.SHIPPED:
            raise ValidationError('Apenas pedidos enviados podem ter a entrega confirmada.')

        old_status = order.status
        order.status = OrderStatus.DELIVERED
        order.delivered_at = timezone.now()
        order.delivery_confirmed_by = confirmed_by
        order.save()

        OrderPostPurchaseService.log_history(order, old_status, OrderStatus.DELIVERED, actor=user, reason=f'Entrega confirmada por {confirmed_by}')
        return order

    @staticmethod
    @transaction.atomic
    def dispute_delivery(order: Order, customer_user, reason: str = ''):
        if order.status != OrderStatus.DELIVERED:
            raise ValidationError('Apenas pedidos entregues podem ser contestados.')

        if order.delivery_confirmed_by != DeliveryConfirmedBy.SELLER:
            raise ValidationError('Contestação permitida apenas para confirmações realizadas pelo lojista.')

        if not order.delivered_at or timezone.now() > order.delivered_at + timedelta(days=7):
            raise ValidationError('Prazo para contestar a entrega (7 dias) expirado.')

        old_status = order.status
        order.status = OrderStatus.DELIVERY_DISPUTED
        order.save()

        OrderPostPurchaseService.log_history(order, old_status, OrderStatus.DELIVERY_DISPUTED, actor=customer_user, reason=reason or 'Não recebi meu pedido')
        return order

    @staticmethod
    @transaction.atomic
    def resolve_dispute(order: Order, store_user, action: str, tracking_code: str = ''):
        if order.status != OrderStatus.DELIVERY_DISPUTED:
            raise ValidationError('Pedido não está em contestação.')

        old_status = order.status

        if action == 'reship':
            order.status = OrderStatus.SHIPPED
            if tracking_code:
                order.tracking_code = tracking_code
            order.delivered_at = None
            order.delivery_confirmed_by = None
            order.save()
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.SHIPPED, actor=store_user, reason='Pedido reenviado pelo lojista.')

        elif action == 'refund':
            order.status = OrderStatus.REFUNDED
            order.save()
            OrderPostPurchaseService.log_history(order, old_status, OrderStatus.REFUNDED, actor=store_user, reason='Reembolso aprovado pelo lojista após contestação.')

        return order

    @staticmethod
    @transaction.atomic
    def create_return_request(order: Order, customer_user, reason: str, description: str, items_data: list, photos: list = []):
        if order.status != OrderStatus.DELIVERED:
            raise ValidationError('Devolução só pode ser solicitada para pedidos entregues.')

        if not order.delivered_at or timezone.now() > order.delivered_at + timedelta(days=7):
            raise ValidationError('O prazo de 7 dias após a entrega para solicitar devolução expirou.')

        if not items_data:
            raise ValidationError('Selecione ao menos um item para devolução.')

        if len(photos) > 3:
            raise ValidationError('Você pode enviar no máximo 3 fotos.')

        total_refund = 0
        return_req = ReturnRequest.objects.create(
            order=order,
            reason=reason,
            description=description,
            status=ReturnStatus.REQUESTED
        )

        for item_info in items_data:
            order_item_id = item_info.get('order_item_id')
            qty = item_info.get('quantity', 0)

            try:
                order_item = order.items.get(id=order_item_id)
            except Exception:
                raise ValidationError(f'Item do pedido #{order_item_id} inválido.')

            # Calcular quantidade já devolvida anteriormente
            previous_returned_qty = ReturnItem.objects.filter(
                return_request__order=order,
                order_item=order_item,
                return_request__status__in=[ReturnStatus.REQUESTED, ReturnStatus.APPROVED, ReturnStatus.RECEIVED, ReturnStatus.REFUNDED]
            ).exclude(return_request=return_req).aggregate(total=models.Sum('quantity'))['total'] or 0

            max_allowed = order_item.quantity - previous_returned_qty

            if qty <= 0 or qty > max_allowed:
                raise ValidationError(f'Quantidade inválida ({qty}) para o item {order_item.product_name}. Máximo permitido: {max_allowed}.')

            ReturnItem.objects.create(return_request=return_req, order_item=order_item, quantity=qty)
            total_refund += order_item.unit_price * qty

        return_req.refund_amount = total_refund
        return_req.save()

        for photo in photos:
            return_req.photos.create(image=photo)

        return return_req

    @staticmethod
    @transaction.atomic
    def process_return_receipt(return_req: ReturnRequest, store_user, resellable: bool):
        if return_req.status not in [ReturnStatus.APPROVED, ReturnStatus.REQUESTED]:
            raise ValidationError('Solicitação de devolução precisa estar aprovada para recebimento.')

        return_req.resellable = resellable
        return_req.status = ReturnStatus.REFUNDED
        return_req.save()

        if resellable:
            for r_item in return_req.items.all():
                prod = r_item.order_item.product
                prod.stock_quantity += r_item.quantity
                prod.save(update_fields=['stock_quantity'])

        OrderPostPurchaseService.log_history(
            return_req.order,
            return_req.order.status,
            return_req.order.status,
            actor=store_user,
            reason=f'Devolução #{return_req.id} processada. Produto religado ao estoque: {resellable}. Reembolso de R${return_req.refund_amount}'
        )
        return return_req