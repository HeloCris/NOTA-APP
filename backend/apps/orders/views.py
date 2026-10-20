from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Order, OrderItem
from apps.inventory.models import StoreProduct
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Garante que o usuário autenticado acesse apenas seus próprios pedidos."""
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user).order_by('-created_at')
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])

        if not items_data:
            return Response(
                {"error": "O pedido deve conter pelo menos um item."},
                status=status.HTTP_400_BAD_REQUEST
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
                        store_product = StoreProduct.objects.select_for_update().get(id=product_id)
                    except StoreProduct.DoesNotExist:
                        return Response(
                            {"error": f"Produto de estoque ID {product_id} não encontrado."},
                            status=status.HTTP_404_NOT_FOUND
                        )

                    if store_product.stock_quantity < requested_qty:
                        out_of_stock.append({
                            "product_id": store_product.id,
                            "name": getattr(store_product.product, 'name', f"Produto #{store_product.id}"),
                            "requested": requested_qty,
                            "available": store_product.stock_quantity
                        })
                    else:
                        store_products_map[product_id] = store_product

                # Se houver itens fora de estoque, aborta a transação e retorna 400 (RF-11.7 / CA-03)
                if out_of_stock:
                    return Response({
                        "error": "Estoque insuficiente para um ou mais itens.",
                        "out_of_stock_items": out_of_stock
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 2. Criação do Pedido
                order = Order.objects.create(
                    user=request.user,
                    store_id=data['store_id'],
                    total_amount=data['total_amount'],
                    shipping_cost=data.get('shipping_cost', 0.00),
                    shipping_address=data['shipping_address'],
                    status='PENDING'
                )

                # 3. Criação dos Itens e Baixa Atômica no Estoque
                for item in items_data:
                    product_id = item['store_product_id']
                    qty = item['quantity']
                    store_product = store_products_map[product_id]

                    OrderItem.objects.create(
                        order=order,
                        store_product=store_product,
                        quantity=qty,
                        unit_price=item['unit_price']
                    )

                    store_product.stock_quantity -= qty
                    store_product.save(update_fields=['stock_quantity'])

            return Response(
                {"order_id": order.id, "status": order.status},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """
    POST /api/v1/payments/process/
    Processa o pagamento do pedido (PIX ou Cartão de Crédito).
    AVISO DE SEGURANÇA: Dados sensíveis (CVV ou número completo do cartão) NUNCA são persistidos ou gravados em logs.
    """
    order_id = request.data.get('order_id')
    payment_method = request.data.get('payment_method')
    card_number = str(request.data.get('card_number', ''))
    payment_token = str(request.data.get('payment_token', ''))

    if not order_id or not payment_method:
        return Response(
            {"error": "Os parâmetros 'order_id' e 'payment_method' são obrigatórios."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        order = Order.objects.get(id=order_id, user=request.user)

        # Regra de negócio (CA-04): Simulação de recusa caso cartão termine em '0000' ou token seja 'tok_refused'
        if payment_method == 'CREDIT_CARD':
            if card_number.endswith('0000') or payment_token == 'tok_refused':
                return Response(
                    {"error": "Pagamento recusado pela operadora do cartão."},
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

        # Transição de status do pedido (PENDING -> PAID)
        order.status = 'PAID'
        order.save(update_fields=['status'])

        return Response(
            {
                "message": "Pagamento processado com sucesso",
                "order_id": order.id,
                "status": order.status
            },
            status=status.HTTP_200_OK
        )

    except Order.DoesNotExist:
        return Response(
            {"error": "Pedido não encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )