from datetime import timedelta
from decimal import Decimal

from django.db.models import F, Sum
from django.utils import timezone

from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderStatus, ReturnRequest, ReturnStatus


VALID_STATUSES = [
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
]
COMMISSION_RATE = Decimal("0.10")


def build_dashboard(store, period: str = "7d") -> dict:
    days = 30 if period == "30d" else 7
    start = timezone.now() - timedelta(days=days)
    orders = Order.objects.filter(store=store, created_at__gte=start)
    valid_orders = orders.filter(status__in=VALID_STATUSES)
    gross = valid_orders.aggregate(value=Sum("total_amount"))["value"] or Decimal("0")
    subtotal = (
        valid_orders.filter(items__isnull=False)
        .aggregate(value=Sum(F("items__quantity") * F("items__unit_price")))["value"]
        or Decimal("0")
    )
    returned_refunds = (
        ReturnRequest.objects.filter(
            order__store=store, status=ReturnStatus.REFUNDED, updated_at__gte=start
        ).aggregate(value=Sum("refund_amount"))["value"]
        or Decimal("0")
    )
    cancelled_refunds = (
        orders.filter(status=OrderStatus.CANCELLED)
        .aggregate(value=Sum("total_amount"))["value"]
        or Decimal("0")
    )
    refunds = returned_refunds + cancelled_refunds
    cancelled = orders.filter(status=OrderStatus.CANCELLED).count()
    returned = orders.filter(status=OrderStatus.REFUNDED).count()
    total_orders = orders.count()
    commission = subtotal * COMMISSION_RATE
    stock_value = sum(
        (item.price * item.stock_quantity for item in StoreProduct.objects.filter(
            store=store, is_available=True
        )),
        Decimal("0"),
    )

    chart_labels = []
    chart_values = []
    for offset in range(days - 1, -1, -1):
        day = (timezone.localdate() - timedelta(days=offset))
        value = valid_orders.filter(created_at__date=day).aggregate(
            total=Sum("total_amount")
        )["total"] or Decimal("0")
        chart_labels.append(day.strftime("%d/%m"))
        chart_values.append(float(value))

    recent = (
        orders.select_related("user")
        .prefetch_related("items__store_product__product")
        .order_by("-created_at")[:5]
    )
    recent_orders = []
    for order in recent:
        first_item = order.items.first()
        product = first_item.store_product.product if first_item else None
        recent_orders.append({
            "id": order.code,
            "date": timezone.localtime(order.created_at).strftime("%d/%m/%Y"),
            "client": (
                getattr(order.user, "get_full_name", lambda: "")()
                or order.user.email
            ),
            "frag": product.name if product else "Pedido",
            "vol": f"{first_item.store_product.volume_ml}ml" if first_item else "",
            "val": f"R$ {order.total_amount:.2f}",
            "status": order.status,
        })

    return {
        "period": period if period in ("7d", "30d") else "7d",
        "kpis": {
            "gross_revenue": float(gross),
            "net_revenue": float(gross - refunds - commission),
            "commission": float(commission),
            "refunds": float(refunds),
            "average_ticket": float(gross / valid_orders.count()) if valid_orders.exists() else 0,
            "pending_orders": orders.filter(
                status__in=[OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING]
            ).count(),
            "stock_alerts": StoreProduct.objects.filter(
                store=store, is_available=True, stock_quantity__lt=3
            ).count(),
            "stock_value": float(stock_value),
            "store_views": store.views_count,
            "cancellation_rate": round(cancelled / total_orders * 100, 1) if total_orders else 0,
            "return_rate": round(returned / total_orders * 100, 1) if total_orders else 0,
        },
        "chart": {"labels": chart_labels, "values": chart_values},
        "recent_orders": recent_orders,
        "restock_alerts": [
            {"id": item.id, "name": item.product.name, "qty": item.stock_quantity}
            for item in StoreProduct.objects.filter(
                store=store, is_available=True, stock_quantity__lt=3
            ).select_related("product")[:5]
        ],
    }
