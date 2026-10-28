import json
from datetime import timedelta
from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    DeliveryConfirmedBy,
    Order,
    OrderStatus,
    OrderStatusHistory,
    ReturnItem,
    ReturnRequest,
    ReturnStatus,
)


class OrderPostPurchaseService:

    @staticmethod
    def log_history(order, from_status, to_status, actor=None, reason=''):
        """Registra histórico de alteração de status do pedido."""
        OrderStatusHistory.objects.create(
            order=order,
            from_status=from_status,
            to_status=to_status,
            actor=actor,
            reason=reason
        )

    @staticmethod
    def restore_stock(order_items):
        """Restaura o estoque no StoreProduct dos itens do pedido."""
        for item in order_items:
            store_prod = getattr(item, 'store_product', None)
            if store_prod:
                store_prod.stock_quantity += item.quantity
                store_prod.save(update_fields=['stock_quantity'])

    @staticmethod
    @transaction.atomic
    def cancel_by_customer(order: Order, user, reason: str):
        """Cancela pedido pelo cliente ou solicita cancelamento se em separação/transporte."""
        if not reason:
            raise ValidationError({'reason': 'Motivo obrigatório para cancelamento.'})

        old_status = order.status

        # 1. Cancelamento direto em PENDING ou PAID
        if old_status in [OrderStatus.PENDING, OrderStatus.PAID]:
            order.status = OrderStatus.CANCELLED
            order.cancel_reason = reason
            order.save(update_fields=['status', 'cancel_reason', 'updated_at'])
            
            OrderPostPurchaseService.restore_stock(order.items.all())
            OrderPostPurchaseService.log_history(
                order, old_status, OrderStatus.CANCELLED, actor=user, reason=reason
            )
            return order

        # 2. Solicitação de cancelamento em PROCESSING ou SHIPPED
        elif old_status in [OrderStatus.PROCESSING, OrderStatus.SHIPPED]:
            order.status = OrderStatus.CANCEL_REQUESTED
            order.cancel_reason = reason
            order.cancel_requested_at = timezone.now()
            order.save(update_fields=['status', 'cancel_reason', 'cancel_requested_at', 'updated_at'])
            
            OrderPostPurchaseService.log_history(
                order, old_status, OrderStatus.CANCEL_REQUESTED, actor=user, reason=reason
            )
            return order

        else:
            raise ValidationError('Não é possível solicitar cancelamento para um pedido no status atual.')

    @staticmethod
    @transaction.atomic
    def respond_cancel_request(order: Order, store_user, approve: bool, reason: str = ''):
        """Lojista aprova ou recusa uma solicitação de cancelamento enviada pelo cliente."""
        if order.status != OrderStatus.CANCEL_REQUESTED:
            raise ValidationError('O pedido não possui solicitação de cancelamento pendente.')

        # Restaura para o status imediatamente anterior (PROCESSING ou SHIPPED)
        prev_history = OrderStatusHistory.objects.filter(
            order=order, to_status=OrderStatus.CANCEL_REQUESTED
        ).order_by('-created_at').first()
        
        fallback_status = prev_history.from_status if prev_history else OrderStatus.PROCESSING
        old_status = order.status

        if approve:
            order.status = OrderStatus.CANCELLED
            order.save(update_fields=['status', 'updated_at'])
            OrderPostPurchaseService.restore_stock(order.items.all())
            OrderPostPurchaseService.log_history(
                order, old_status, OrderStatus.CANCELLED, actor=store_user, reason='Cancelamento aprovado pelo lojista.'
            )
        else:
            if not reason:
                raise ValidationError({'reason': 'Motivo obrigatório para recusar o cancelamento.'})
            order.status = fallback_status
            order.save(update_fields=['status', 'updated_at'])
            OrderPostPurchaseService.log_history(
                order, old_status, fallback_status, actor=store_user, reason=f'Cancelamento recusado: {reason}'
            )

        return order

    @staticmethod
    @transaction.atomic
    def cancel_by_store(order: Order, store_user, reason: str):
        """Lojista cancela o pedido diretamente."""
        if not reason:
            raise ValidationError({'reason': 'Motivo obrigatório para cancelamento.'})

        if order.status not in [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.CANCEL_REQUESTED]:
            raise ValidationError('Apenas pedidos em Pagamento Aprovado ou Em Separação podem ser cancelados.')

        old_status = order.status
        order.status = OrderStatus.CANCELLED
        order.cancel_reason = reason
        order.save(update_fields=['status', 'cancel_reason', 'updated_at'])

        if reason != 'Sem estoque':
            OrderPostPurchaseService.restore_stock(order.items.all())

        OrderPostPurchaseService.log_history(
            order, old_status, OrderStatus.CANCELLED, actor=store_user, reason=reason
        )
        return order

    @staticmethod
    @transaction.atomic
    def change_shipping_address(order: Order, new_address_data: dict):
        """
        Atualiza o endereço de entrega garantindo que seja para a mesma Cidade/UF
        e salvando de forma persistente no JSONField do modelo.
        """
        if order.status not in [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING]:
            raise ValidationError('Endereço só pode ser alterado até a etapa de separação.')

        if order.address_changed:
            raise ValidationError('O endereço de entrega já foi alterado anteriormente para este pedido.')

        current_addr = order.shipping_address or {}
        if isinstance(current_addr, str):
            try:
                current_addr = json.loads(current_addr)
            except Exception:
                current_addr = {}

        old_city = (
            current_addr.get('city') or current_addr.get('shipping_city') or ''
        ).strip().upper()

        old_state = (
            current_addr.get('state') or current_addr.get('shipping_state') or ''
        ).strip().upper()

        new_city = (new_address_data.get('shipping_city') or new_address_data.get('city') or '').strip().upper()
        new_state = (new_address_data.get('shipping_state') or new_address_data.get('state') or '').strip().upper()

        # Regra estrita de frete
        if old_city and new_city and old_city != new_city:
            raise ValidationError('Alteração permitida apenas para a mesma Cidade/UF.')

        if old_state and new_state and old_state != new_state:
            raise ValidationError('Alteração permitida apenas para a mesma Cidade/UF.')

        updated_json = {
            "street": new_address_data.get('shipping_street') or new_address_data.get('street', ''),
            "number": new_address_data.get('shipping_number') or new_address_data.get('number', ''),
            "complement": new_address_data.get('shipping_complement') or new_address_data.get('complement', ''),
            "neighborhood": new_address_data.get('shipping_neighborhood') or new_address_data.get('neighborhood', ''),
            "city": new_city or old_city,
            "state": new_state or old_state,
            "zip_code": new_address_data.get('shipping_zip_code') or new_address_data.get('zip_code', ''),
        }
        order.shipping_address = updated_json
        order.address_changed = True
        order.save(update_fields=['shipping_address', 'address_changed', 'updated_at'])

        OrderPostPurchaseService.log_history(
            order, order.status, order.status, reason="Endereço de entrega alterado pelo cliente."
        )

        return order

    @staticmethod
    @transaction.atomic
    def confirm_delivery(order: Order, user, confirmed_by: str):
        """Confirma o recebimento do pedido pelo cliente ou lojista."""
        if order.status != OrderStatus.SHIPPED:
            raise ValidationError('Apenas pedidos enviados podem ter a entrega confirmada.')

        old_status = order.status
        order.status = OrderStatus.DELIVERED
        order.delivered_at = timezone.now()
        order.delivery_confirmed_by = confirmed_by
        order.save(update_fields=['status', 'delivered_at', 'delivery_confirmed_by', 'updated_at'])

        OrderPostPurchaseService.log_history(
            order, old_status, OrderStatus.DELIVERED, actor=user, reason=f'Entrega confirmada por {confirmed_by}'
        )
        return order

    @staticmethod
    @transaction.atomic
    def dispute_delivery(order: Order, customer_user, reason: str = ''):
        """Registra contestação 'Não recebi meu pedido' dentro da janela de 7 dias."""
        if order.status != OrderStatus.DELIVERED:
            raise ValidationError('Apenas pedidos entregues podem ser contestados.')

        if order.delivery_confirmed_by != DeliveryConfirmedBy.SELLER:
            raise ValidationError('Contestação permitida apenas para confirmações realizadas pelo lojista.')

        if not order.delivered_at or timezone.now() > order.delivered_at + timedelta(days=7):
            raise ValidationError('Prazo para contestar a entrega (7 dias) expirado.')

        old_status = order.status
        order.status = OrderStatus.DELIVERY_DISPUTED
        order.save(update_fields=['status', 'updated_at'])

        OrderPostPurchaseService.log_history(
            order, old_status, OrderStatus.DELIVERY_DISPUTED, actor=customer_user, reason=reason or 'Não recebi meu pedido'
        )
        return order

    @staticmethod
    @transaction.atomic
    def resolve_dispute(order: Order, store_user, action: str, tracking_code: str = ''):
        """Lojista resolve a contestação de entrega com reenvio ou reembolso."""
        if order.status != OrderStatus.DELIVERY_DISPUTED:
            raise ValidationError('Pedido não está em contestação.')

        old_status = order.status

        if action in ['reship', 'resend']:
            order.status = OrderStatus.SHIPPED
            if tracking_code:
                order.tracking_code = tracking_code
            order.delivered_at = None
            order.delivery_confirmed_by = None
            order.save(update_fields=['status', 'tracking_code', 'delivered_at', 'delivery_confirmed_by', 'updated_at'])
            OrderPostPurchaseService.log_history(
                order, old_status, OrderStatus.SHIPPED, actor=store_user, reason='Pedido reenviado pelo lojista.'
            )

        elif action == 'refund':
            order.status = OrderStatus.REFUNDED
            order.save(update_fields=['status', 'updated_at'])
            OrderPostPurchaseService.restore_stock(order.items.all())
            OrderPostPurchaseService.log_history(
                order, old_status, OrderStatus.REFUNDED, actor=store_user, reason='Reembolso aprovado pelo lojista após contestação.'
            )
        else:
            raise ValidationError('Ação inválida para resolução da contestação.')

        return order

    @staticmethod
    @transaction.atomic
    def create_return_request(order: Order, customer_user, reason: str, description: str, items_data: list, photos: list = []):
        """Cria solicitação de devolução de produtos pelo cliente dentro dos 7 dias corridos."""
        if order.status != OrderStatus.DELIVERED:
            raise ValidationError('Devolução só pode ser solicitada para pedidos entregues.')

        if not order.delivered_at or timezone.now() > order.delivered_at + timedelta(days=7):
            raise ValidationError('O prazo de 7 dias após a entrega para solicitar devolução expirou.')

        if not items_data:
            raise ValidationError('Selecione ao menos um item para devolução.')

        if len(photos) > 3:
            raise ValidationError('Você pode enviar no máximo 3 fotos.')

        total_refund = Decimal('0.00')
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

            previous_returned_qty = ReturnItem.objects.filter(
                return_request__order=order,
                order_item=order_item,
                return_request__status__in=[
                    ReturnStatus.REQUESTED, 
                    ReturnStatus.APPROVED, 
                    ReturnStatus.RECEIVED, 
                    ReturnStatus.REFUNDED
                ]
            ).exclude(return_request=return_req).aggregate(total=models.Sum('quantity'))['total'] or 0

            max_allowed = order_item.quantity - previous_returned_qty

            if qty <= 0 or qty > max_allowed:
                item_name = getattr(order_item.store_product, 'name', f'#{order_item.id}') if getattr(order_item, 'store_product', None) else f'#{order_item.id}'
                raise ValidationError(f'Quantidade inválida ({qty}) para o item {item_name}. Máximo permitido: {max_allowed}.')

            ReturnItem.objects.create(return_request=return_req, order_item=order_item, quantity=qty)
            total_refund += order_item.unit_price * qty

        return_req.refund_amount = total_refund
        return_req.save(update_fields=['refund_amount', 'updated_at'])

        for photo in photos:
            return_req.photos.create(image=photo)

        return return_req

    @staticmethod
    @transaction.atomic
    def process_return_receipt(return_req: ReturnRequest, store_user, resellable: bool):
        """Processa o recebimento físico da devolução e faz a re-estocagem se o item for reutilizável."""
        if return_req.status not in [ReturnStatus.APPROVED, ReturnStatus.REQUESTED]:
            raise ValidationError('Solicitação de devolução precisa estar aprovada para recebimento.')

        return_req.resellable = resellable
        return_req.status = ReturnStatus.RECEIVED
        return_req.save(update_fields=['resellable', 'status', 'updated_at'])

        if resellable:
            for r_item in return_req.items.all():
                store_prod = getattr(r_item.order_item, 'store_product', None)
                if store_prod:
                    store_prod.stock_quantity += r_item.quantity
                    store_prod.save(update_fields=['stock_quantity'])

        order = return_req.order
        old_status = order.status
        order.status = OrderStatus.REFUNDED
        order.save(update_fields=['status', 'updated_at'])

        OrderPostPurchaseService.log_history(
            order,
            old_status,
            OrderStatus.REFUNDED,
            actor=store_user,
            reason=f'Devolução #{return_req.id} processada. Re-estocado: {resellable}. Reembolso de R${return_req.refund_amount}'
        )
        return return_req