from collections import Counter, defaultdict
from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set

from django.db.models import F, Sum
from django.utils import timezone

from apps.catalog.models import Product
from apps.inventory.models import StoreProduct
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.stores.models import Store, StoreCoupon, StoreFollower
from apps.users.models import CustomUser

OFFICIAL_FAMILIES = [
    "Floral",
    "Amadeirado",
    "Oriental",
    "Cítrico",
    "Fougère",
    "Aquático",
    "Gourmand",
]

VALID_ORDER_STATUSES = [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
]

PERIOD_DAYS = {"7d": 7, "30d": 30}


def _money(value: Any) -> str:
    return f"{Decimal(value or Decimal('0.00')):.2f}"


def _normalized_note(value: Any) -> Optional[str]:
    if isinstance(value, str) and value.strip():
        return value.strip().title()
    return None


def _normalized_family(value: Any) -> Optional[str]:
    if not isinstance(value, str) or not value.strip():
        return None
    return next(
        (family for family in OFFICIAL_FAMILIES if value.strip().lower() == family.lower()),
        None,
    )


def _product_notes(product: Product) -> Set[str]:
    notes: Set[str] = set()
    for note in (product.top_notes or []) + (product.heart_notes or []) + (product.base_notes or []):
        normalized = _normalized_note(note)
        if normalized:
            notes.add(normalized)
    return notes


def build_store_analytics(store: Store, period: str = "30d") -> Dict[str, Any]:
    period = period if period in ("7d", "30d", "all") else "30d"
    start_date = (
        timezone.now() - timedelta(days=PERIOD_DAYS[period])
        if period in PERIOD_DAYS
        else None
    )

    orders_qs = Order.objects.filter(store=store, status__in=VALID_ORDER_STATUSES)
    if start_date is not None:
        orders_qs = orders_qs.filter(created_at__gte=start_date)
    orders = list(orders_qs.select_related("coupon"))

    followers_qs = StoreFollower.objects.filter(store=store)
    followers_in_period = (
        followers_qs.filter(created_at__gte=start_date) if start_date is not None else followers_qs
    )
    store_views = store.views_count
    paid_orders_count = len(orders)

    funnel = {
        "store_views": store_views,
        "followers_count": followers_qs.count(),
        "new_followers_in_period": followers_in_period.count(),
        "paid_orders_count": paid_orders_count,
        "conversion_rate_pct": round(paid_orders_count / max(store_views, 1) * 100, 1),
    }

    items_qs = OrderItem.objects.filter(order__in=orders_qs).select_related(
        "store_product", "store_product__product", "store_product__product__brand"
    )
    decant_items = items_qs.filter(store_product__volume_ml__lte=15)
    bottle_items = items_qs.filter(store_product__volume_ml__gt=15)

    format_mix = {
        "decants_units_sold": decant_items.aggregate(total=Sum("quantity"))["total"] or 0,
        "decants_revenue": _money(
            decant_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"]
        ),
        "bottles_units_sold": bottle_items.aggregate(total=Sum("quantity"))["total"] or 0,
        "bottles_revenue": _money(
            bottle_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"]
        ),
    }

    coupon_orders = [order for order in orders if order.coupon_id]
    coupon_codes = Counter(
        order.coupon.code for order in coupon_orders if order.coupon is not None
    )
    top_coupon_code = coupon_codes.most_common(1)[0][0] if coupon_codes else None
    if top_coupon_code is None:
        top_coupon = StoreCoupon.objects.filter(store=store).order_by("-used_count", "code").first()
        top_coupon_code = top_coupon.code if top_coupon else None

    coupons_performance = {
        "active_coupons_count": StoreCoupon.objects.filter(store=store, is_active=True).count(),
        "orders_with_coupon": len(coupon_orders),
        "total_discount_granted": _money(
            sum((order.discount_amount for order in coupon_orders), Decimal("0.00"))
        ),
        "revenue_with_coupon": _money(
            sum((order.total_amount for order in coupon_orders), Decimal("0.00"))
        ),
        "top_coupon_code": top_coupon_code,
    }

    offer_stats: Dict[int, Dict[str, Any]] = defaultdict(
        lambda: {"units": 0, "revenue": Decimal("0.00")}
    )
    for item in items_qs:
        stats = offer_stats[item.store_product_id]
        stats["units"] += item.quantity
        stats["revenue"] += Decimal(item.quantity) * (item.unit_price or Decimal("0.00"))

    my_offers = {
        offer.id: offer
        for offer in StoreProduct.objects.filter(store=store).select_related(
            "product", "product__brand"
        )
    }
    ranked_offers: List[Dict[str, Any]] = []
    for offer_id, stats in offer_stats.items():
        offer = my_offers.get(offer_id)
        if offer is None:
            continue
        effective_price = (
            offer.promotional_price
            if offer.promotional_price is not None and offer.promotional_price > 0
            else offer.price
        )
        ranked_offers.append({
            "store_product_id": offer.id,
            "product_name": offer.product.name,
            "brand_name": offer.product.brand.name,
            "volume_ml": offer.volume_ml,
            "is_decant": offer.volume_ml <= 15,
            "price": _money(effective_price),
            "stock_quantity": offer.stock_quantity,
            "units_sold": stats["units"],
            "_revenue": stats["revenue"],
        })
    ranked_offers.sort(
        key=lambda item: (item["units_sold"], item["_revenue"], item["store_product_id"]),
        reverse=True,
    )
    top_store_offers = [
        {key: value for key, value in offer.items() if key != "_revenue"}
        | {"revenue": _money(offer["_revenue"])}
        for offer in ranked_offers[:5]
    ]

    active_offers = list(
        StoreProduct.objects.filter(
            store=store,
            is_available=True,
            stock_quantity__gt=0,
            product__is_approved=True,
        ).select_related("product", "product__brand")
    )
    my_product_ids = {offer.product_id for offer in active_offers}
    my_families = {
        normalized
        for normalized in (_normalized_family(offer.product.olfactory_family) for offer in active_offers)
        if normalized
    }
    my_notes: Set[str] = set()
    for offer in active_offers:
        my_notes.update(_product_notes(offer.product))

    approved_products = list(Product.objects.filter(is_approved=True).select_related("brand"))

    def suggest_products(family: Optional[str] = None, note: Optional[str] = None) -> List[Dict[str, Any]]:
        suggestions: List[Dict[str, Any]] = []
        for product in sorted(approved_products, key=lambda item: (-(item.sold_count or 0), item.name)):
            if product.id in my_product_ids:
                continue
            if family is not None and _normalized_family(product.olfactory_family) != family:
                continue
            if note is not None and note not in _product_notes(product):
                continue
            suggestions.append({
                "id": product.id,
                "name": product.name,
                "brand_name": product.brand.name,
            })
            if len(suggestions) == 2:
                break
        return suggestions

    family_counts: Dict[str, int] = Counter()
    note_counts: Dict[str, int] = Counter()
    customers_with_families = 0
    customers_with_notes = 0
    for customer in CustomUser.objects.filter(
        is_active=True, role=CustomUser.Roles.CUSTOMER
    ).only("olfactory_families", "preferred_notes"):
        customer_families = {
            normalized
            for normalized in (_normalized_family(value) for value in customer.olfactory_families or [])
            if normalized
        }
        if customer_families:
            customers_with_families += 1
            for family in customer_families:
                family_counts[family] += 1

        customer_notes = {
            normalized
            for normalized in (_normalized_note(value) for value in customer.preferred_notes or [])
            if normalized
        }
        if customer_notes:
            customers_with_notes += 1
            for note in customer_notes:
                note_counts[note] += 1

    catalog_gaps: List[Dict[str, Any]] = []
    for family, count in sorted(family_counts.items(), key=lambda item: (-item[1], item[0])):
        share = round(count / max(customers_with_families, 1) * 100)
        if share <= 10 or family in my_families:
            continue
        catalog_gaps.append({
            "type": "family",
            "name": family,
            "customer_demand_pct": min(share, 100),
            "my_active_offers_count": 0,
            "suggested_products": suggest_products(family=family),
        })

    for note, count in note_counts.most_common(10):
        if note in my_notes:
            continue
        share = round(count / max(customers_with_notes, 1) * 100)
        catalog_gaps.append({
            "type": "note",
            "name": note,
            "customer_demand_pct": min(share, 100),
            "my_active_offers_count": 0,
            "suggested_products": suggest_products(note=note),
        })

    catalog_gaps.sort(
        key=lambda item: (-item["customer_demand_pct"], item["type"], item["name"])
    )

    return {
        "period": period,
        "funnel": funnel,
        "format_mix": format_mix,
        "coupons_performance": coupons_performance,
        "top_store_offers": top_store_offers,
        "catalog_gaps": catalog_gaps,
    }
