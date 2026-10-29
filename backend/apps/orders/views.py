from typing import cast

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsSeller, get_user_store_id
from apps.inventory.models import StoreProduct
from apps.stores.models import Store

from .models import Order, OrderItem, OrderStatus, ReturnRequest, ReturnStatus
from .serializers import (
    CustomerOrderDetailSerializer,
    OrderSerializer,
    ReturnRequestSerializer,
    ShippingUpdateSerializer,
    StoreOrderDetailSerializer,
    StoreOrderSerializer,
    UpdateOrderStatusSerializer,
)
from .services import OrderPostPurchaseService


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerOrderDetailSerializer
        return OrderSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return (
                Order.objects.filter(user=self.request.user)
                .prefetch_related('items__store_product__product')
                .order_by('-created_at')
            )
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])

        if not items_data:
            return Response(
                {"error": "O pedido deve conter pelo menos um item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        out_of_stock = []
        store_products_map = {}

        try:
            with transaction.atomic():
                # 1. Bloqueio de linhas (select_for_update) e validação de estoque
                for item in items_data:
                    product_id = item.get('store_product_id')
                    requested_qty = item.get('quantity', 0)

                    try:
                        store_product = (
                            StoreProduct.objects.select_for_update()
                            .select_related('product', 'store')
                            .get(id=product_id)
                        )
                    except StoreProduct.DoesNotExist:  # type: ignore
                        return Response(
                            {
                                "error": (
                                    f"Produto de estoque ID {product_id} não"
                                    " encontrado."
                                )
                            },
                            status=status.HTTP_404_NOT_FOUND,
                        )

                    if store_product.stock_quantity < requested_qty:
                        out_of_stock.append({
                            "product_id": store_product.id,
                            "name": getattr(
                                store_product.product,
                                'name',
                                f"Produto #{store_product.id}",
                            ),
                            "requested": requested_qty,
                            "available": store_product.stock_quantity,
                        })
                    else:
                        store_products_map[product_id] = store_product

                # Se houver itens fora de estoque, aborta a transação e retorna 400
                if out_of_stock:
                    return Response(
                        {
                            "error": (
                                "Estoque insuficiente para um ou mais itens."
                            ),
                            "out_of_stock_items": out_of_stock,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 2. Agrupamento dos itens por Loja (Split Multi-Loja)
                items_by_store: dict[int, list[dict]] = {}
                for item in items_data:
                    p_id = item['store_product_id']
                    sp = store_products_map[p_id]
                    store_id = sp.store_id
                    if store_id not in items_by_store:
                        items_by_store[store_id] = []
                    items_by_store[store_id].append(item)

                total_stores_count = len(items_by_store)
                global_shipping_cost = float(data.get('shipping_cost', 0.00))
                # Se houver mais de uma loja, divide o frete global entre elas
                per_store_shipping = round(global_shipping_cost / total_stores_count, 2) if total_stores_count > 0 else 0.00

                created_orders = []

                # 3. Criação de cada Order por Loja e seus OrderItems
                for store_id, store_items in items_by_store.items():
                    store_items_subtotal = sum(
                        float(it['unit_price']) * int(it['quantity']) for it in store_items
                    )
                    store_order_total = round(store_items_subtotal + per_store_shipping, 2)

                    order = Order.objects.create(
                        user=request.user,
                        store_id=store_id,
                        total_amount=store_order_total,
                        shipping_cost=per_store_shipping,
                        shipping_service=data.get('shipping_service'),
                        shipping_address=data['shipping_address'],
                        status=OrderStatus.PENDING,
                    )

                    OrderPostPurchaseService.log_history(
                        order,
                        from_status=OrderStatus.PENDING,
                        to_status=OrderStatus.PENDING,
                        actor=request.user,
                        reason="Pedido criado pelo cliente.",
                    )

                    for item in store_items:
                        product_id = item['store_product_id']
                        qty = item['quantity']
                        store_product = store_products_map[product_id]

                        OrderItem.objects.create(
                            order=order,
                            store_product=store_product,
                            quantity=qty,
                            unit_price=item['unit_price'],
                        )

                        store_product.stock_quantity -= qty
                        store_product.save(update_fields=['stock_quantity'])

                    created_orders.append(order)

            primary_order = created_orders[0]
            order_ids = [o.id for o in created_orders]

            return Response(
                {
                    "order_id": primary_order.id,
                    "order_ids": order_ids,
                    "orders": [
                        {
                            "id": o.id,
                            "code": o.code,
                            "store_id": o.store_id,
                            "store_name": o.store.name,
                            "total_amount": str(o.total_amount),
                            "status": o.status,
                        }
                        for o in created_orders
                    ],
                    "status": primary_order.status,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """
    POST /api/v1/payments/process/
    Processa o pagamento de um ou múltiplos pedidos (Split de Carrinho) via PIX ou Cartão.
    """
    order_id = request.data.get('order_id')
    order_ids = request.data.get('order_ids')
    payment_method = request.data.get('payment_method')
    card_number = str(request.data.get('card_number', ''))
    payment_token = str(request.data.get('payment_token', ''))

    targets = []
    if order_ids and isinstance(order_ids, list):
        targets = [int(i) for i in order_ids if str(i).isdigit()]
    elif order_id:
        targets = [int(order_id)]

    if not targets or not payment_method:
        return Response(
            {
                "error": (
                    "Os parâmetros 'order_id' ou 'order_ids' e 'payment_method' são"
                    " obrigatórios."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        orders = list(Order.objects.filter(id__in=targets, user=request.user))
        if not orders:
            return Response(
                {"error": "Nenhum pedido encontrado para o usuário."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment_method == 'CREDIT_CARD':
            if card_number.endswith('0000') or payment_token == 'tok_refused':
                return Response(
                    {"error": "Pagamento recusado pela operadora do cartão."},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

        updated_ids = []
        with transaction.atomic():
            for order in orders:
                old_status = order.status
                order.status = OrderStatus.PAID
                order.save(update_fields=['status', 'updated_at'])

                OrderPostPurchaseService.log_history(
                    order,
                    from_status=old_status,
                    to_status=OrderStatus.PAID,
                    actor=request.user,
                    reason="Pagamento aprovado.",
                )
                updated_ids.append(order.id)

        return Response(
            {
                "message": "Pagamento processado com sucesso",
                "order_id": updated_ids[0] if updated_ids else None,
                "order_ids": updated_ids,
                "status": OrderStatus.PAID,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class StoreOrderListView(APIView):
    permission_classes = [IsSeller]

    def get(self, request):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        status_filter = str(request.query_params.get("status", "ALL")).upper()
        valid_statuses = {"ALL"} | {choice for choice, _ in OrderStatus.choices}
        if status_filter not in valid_statuses:
            return Response(
                {
                    "error": (
                        "Filtro de status inválido. Use um de:"
                        f" {', '.join(sorted(valid_statuses))}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        orders = (
            Order.objects.filter(store_id=store_id)
            .select_related("user")
            .prefetch_related("items__store_product__product")
            .order_by("-created_at")
        )
        if status_filter != "ALL":
            orders = orders.filter(status=status_filter)

        store = Store.objects.filter(pk=store_id).first()
        serializer = StoreOrderSerializer(
            orders, many=True, context={"store": store}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsSeller]

    def patch(self, request, pk):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UpdateOrderStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']

        if new_status != OrderStatus.PROCESSING:
            return Response(
                {
                    "error": (
                        "Transição de status não permitida. Use {'status':"
                        " 'PROCESSING'} (PAID → PROCESSING)."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status != OrderStatus.PAID:
            return Response(
                {
                    "error": (
                        f"Transição não permitida: {order.status} →"
                        " PROCESSING. Apenas pedidos pagos (PAID) podem iniciar"
                        " a separação."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = order.status
        order.status = OrderStatus.PROCESSING
        order.save(update_fields=['status', 'updated_at'])

        OrderPostPurchaseService.log_history(
            order,
            from_status=old_status,
            to_status=OrderStatus.PROCESSING,
            actor=request.user,
            reason="Iniciada separação do pedido pelo lojista.",
        )

        store = Store.objects.filter(pk=order.store_id).first()
        response_serializer = StoreOrderSerializer(order, context={'store': store})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class ShipOrderView(APIView):
    permission_classes = [IsSeller]

    def patch(self, request, pk):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status != OrderStatus.PROCESSING:
            return Response(
                {
                    "error": (
                        f"Transição não permitida: {order.status} → SHIPPED."
                        " Apenas pedidos em separação podem ser despachados."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ShippingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = order.status
        order.status = OrderStatus.SHIPPED
        shipping_data = cast(dict, serializer.validated_data)
        order.carrier = shipping_data["carrier"]
        order.tracking_code = shipping_data["tracking_code"]
        if "carrier_url" in shipping_data:
            order.carrier_url = shipping_data["carrier_url"]
        order.shipped_at = timezone.now()
        order.save(
            update_fields=[
                "status",
                "carrier",
                "tracking_code",
                "carrier_url",
                "shipped_at",
                "updated_at",
            ]
        )

        OrderPostPurchaseService.log_history(
            order,
            from_status=old_status,
            to_status=OrderStatus.SHIPPED,
            actor=request.user,
            reason=(
                f"Pedido despachado via {order.carrier} (Rastreio:"
                f" {order.tracking_code})."
            ),
        )

        store = Store.objects.filter(pk=order.store_id).first()
        response_serializer = StoreOrderSerializer(order, context={"store": store})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


# ==========================================
# ENDPOINTS CLIENTE — RF-15 (PÓS-COMPRA)
# ==========================================

class CustomerCancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        reason = request.data.get('reason', '')
        try:
            updated_order = OrderPostPurchaseService.cancel_by_customer(
                order, request.user, reason
            )
            return Response(
                {
                    "status": updated_order.status,
                    "message": "Solicitação de cancelamento processada.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class CustomerChangeAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        try:
            updated_order = OrderPostPurchaseService.change_shipping_address(
                order, request.data
            )
            return Response(
                {
                    "address_changed": updated_order.address_changed,
                    "shipping_address": updated_order.shipping_address,
                    "message": "Endereço de entrega atualizado com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class CustomerConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        try:
            updated_order = OrderPostPurchaseService.confirm_delivery(
                order, request.user, 'CUSTOMER'
            )
            return Response(
                {
                    "status": updated_order.status,
                    "delivered_at": updated_order.delivered_at,
                    "message": "Entrega confirmada com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class CustomerDisputeDeliveryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        reason = request.data.get('reason', '')
        try:
            updated_order = OrderPostPurchaseService.dispute_delivery(
                order, request.user, reason
            )
            return Response(
                {
                    "status": updated_order.status,
                    "message": "Contestação de entrega registrada com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class CustomerCreateReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        reason = request.data.get('reason', '')
        description = request.data.get('description', '')
        items_data = request.data.get('items', [])
        if isinstance(items_data, str):
            try:
                import json
                items_data = json.loads(items_data)
            except Exception:
                items_data = []

        photos = request.FILES.getlist('photos')

        try:
            return_req = OrderPostPurchaseService.create_return_request(
                order=order,
                customer_user=request.user,
                reason=reason,
                description=description,
                items_data=items_data,
                photos=photos,
            )
            return Response(
                ReturnRequestSerializer(return_req).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# ENDPOINTS LOJA — RF-15 (PÓS-COMPRA)
# ==========================================

class StoreOrderDetailView(APIView):
    permission_classes = [IsSeller]

    def get(self, request, pk):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para acessar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StoreOrderDetailSerializer(order, context={'store': order.store})
        return Response(serializer.data, status=status.HTTP_200_OK)


class StoreCancelOrderView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        reason = request.data.get('reason', '')
        try:
            updated_order = OrderPostPurchaseService.cancel_by_store(
                order, request.user, reason
            )
            return Response(
                {
                    "status": updated_order.status,
                    "message": "Pedido cancelado com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class StoreRespondCancelRequestView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk, action):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        approve = action.lower() == 'approve'
        reason = request.data.get('reason', '')
        try:
            updated_order = OrderPostPurchaseService.respond_cancel_request(
                order, request.user, approve, reason
            )
            return Response(
                {
                    "status": updated_order.status,
                    "message": "Resposta ao cancelamento gravada com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class StoreMarkDeliveredView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            updated_order = OrderPostPurchaseService.confirm_delivery(
                order, request.user, 'SELLER'
            )
            return Response(
                {
                    "status": updated_order.status,
                    "delivered_at": updated_order.delivered_at,
                    "message": "Entrega confirmada pelo lojista com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class StoreResolveDisputeView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk, action):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(Order, pk=pk)
        if order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para alterar este pedido."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tracking_code = request.data.get('tracking_code', '')
        try:
            updated_order = OrderPostPurchaseService.resolve_dispute(
                order, request.user, action, tracking_code
            )
            return Response(
                {
                    "status": updated_order.status,
                    "message": "Contestação resolvida com sucesso.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )


class StoreProcessReturnView(APIView):
    permission_classes = [IsSeller]

    def post(self, request, pk, action):
        store_id = get_user_store_id(request)
        if store_id is None:
            return Response(
                {"error": "Nenhuma loja vinculada a este lojista."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return_req = get_object_or_404(ReturnRequest, pk=pk)
        if return_req.order.store_id != store_id:
            return Response(
                {"error": "Você não tem permissão para gerenciar esta devolução."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            action_lower = action.lower()
            if action_lower == 'approve':
                return_req.status = ReturnStatus.APPROVED
                return_req.save()
                # RF-16.8 / RN-05: Ao aprovar devolução, ocultar avaliação dos itens devolvidos
                from apps.reviews.models import Review
                item_ids = return_req.items.values_list('order_item_id', flat=True)
                if item_ids:
                    Review.objects.filter(order_item_id__in=item_ids).update(is_hidden=True)
                else:
                    Review.objects.filter(order_item__order=return_req.order).update(is_hidden=True)
            elif action_lower == 'reject':
                reason = request.data.get('reason', '')
                if not reason:
                    return Response(
                        {"error": "Motivo é obrigatório para recusa."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                return_req.status = ReturnStatus.REJECTED
                return_req.save()
            elif action_lower == 'receive':
                resellable = request.data.get('resellable', False)
                return_req = OrderPostPurchaseService.process_return_receipt(
                    return_req, request.user, resellable
                )
            else:
                return Response(
                    {"error": "Ação inválida."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                ReturnRequestSerializer(return_req).data, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )