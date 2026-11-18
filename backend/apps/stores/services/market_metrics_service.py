from collections import Counter, defaultdict
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set

from django.db.models import F, Q, Sum

from apps.catalog.models import Product
from apps.inventory.models import StoreProduct
from apps.orders.models import OrderItem, OrderStatus
from apps.stores.models import Store
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
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
]


def _get_effective_price(offer: StoreProduct) -> Decimal:
    if offer.promotional_price is not None and offer.promotional_price > 0:
        return offer.promotional_price
    return offer.price


def build_market_metrics(current_store: Optional[Store]) -> Dict[str, Any]:
    """
    Gera indicadores agregados e anônimos de inteligência de mercado
    do ecossistema NŌTA para o painel de lojistas e marcas (RF-23).
    Otimizado sem consultas N+1.
    """
    # Carrega catálogo aprovado e ofertas ativas em lote (evita N+1)
    all_approved_prods = list(
        Product.objects.filter(is_approved=True).select_related("brand")
    )
    all_active_offers = list(
        StoreProduct.objects.filter(
            is_available=True,
            store__is_active=True,
            product__is_approved=True,
        ).select_related("product", "product__brand", "store")
    )

    # 1. Clientes ativos com perfil olfativo
    customers_qs = CustomUser.objects.filter(
        is_active=True,
        role=CustomUser.Roles.CUSTOMER,
    )
    customers_list = list(
        customers_qs.only("olfactory_families", "preferred_notes")
    )

    total_customers_with_profile = sum(
        1
        for u in customers_list
        if (u.olfactory_families and len(u.olfactory_families) > 0)
        or (u.preferred_notes and len(u.preferred_notes) > 0)
    )

    # 2. Preferência por Família Olfativa (RN-02)
    customers_with_families = [
        u
        for u in customers_list
        if u.olfactory_families and isinstance(u.olfactory_families, list)
    ]
    total_users_families = len(customers_with_families)

    family_counts: Dict[str, int] = Counter()
    for user in customers_with_families:
        for fam in user.olfactory_families:
            if isinstance(fam, str) and fam.strip():
                clean_fam = fam.strip().capitalize()
                for off in OFFICIAL_FAMILIES:
                    if clean_fam.lower() == off.lower():
                        clean_fam = off
                        break
                family_counts[clean_fam] += 1

    # Contagem de produtos aprovados por família em memória
    catalog_family_counts: Dict[str, int] = Counter()
    for prod in all_approved_prods:
        if not prod.olfactory_family:
            continue
        matched_fam = next(
            (off for off in OFFICIAL_FAMILIES if prod.olfactory_family.strip().lower() == off.lower()),
            None,
        )
        if matched_fam:
            catalog_family_counts[matched_fam] += 1

    family_demand: List[Dict[str, Any]] = []
    for fam in OFFICIAL_FAMILIES:
        c_count = family_counts.get(fam, 0)
        share_pct = (
            round((c_count / total_users_families) * 100)
            if total_users_families > 0
            else 0
        )
        family_demand.append({
            "family": fam,
            "customers_count": c_count,
            "share_pct": share_pct,
            "catalog_products_count": catalog_family_counts.get(fam, 0),
        })

    family_demand.sort(
        key=lambda x: (
            x["share_pct"],
            x["customers_count"],
            x["catalog_products_count"],
            x["family"],
        ),
        reverse=True,
    )

    # 3. Top 10 Notas Olfativas (RN-03)
    customers_with_notes = [
        u
        for u in customers_list
        if u.preferred_notes and isinstance(u.preferred_notes, list)
    ]
    total_users_notes = len(customers_with_notes)

    note_user_counts: Dict[str, int] = Counter()
    for user in customers_with_notes:
        seen_for_user = set()
        for note in user.preferred_notes:
            if isinstance(note, str) and note.strip():
                clean_note = note.strip().title()
                if clean_note not in seen_for_user:
                    seen_for_user.add(clean_note)
                    note_user_counts[clean_note] += 1

    # Fallback inteligente (RN-03): se houver menos de 5 clientes com notas preenchidas,
    # complementa com notas da pirâmide dos perfumes mais vendidos
    if total_users_notes < 5:
        top_sold_prods = sorted(
            all_approved_prods, key=lambda p: p.sold_count or 0, reverse=True
        )[:10]
        for prod in top_sold_prods:
            seen_for_prod = set()
            all_prod_notes = (
                (prod.top_notes or [])
                + (prod.heart_notes or [])
                + (prod.base_notes or [])
            )
            for note in all_prod_notes:
                if isinstance(note, str) and note.strip():
                    clean_note = note.strip().title()
                    if clean_note not in seen_for_prod:
                        seen_for_prod.add(clean_note)
                        note_user_counts[clean_note] += 1

    sorted_notes = note_user_counts.most_common(10)
    denom_notes = max(total_customers_with_profile, 1)

    top_notes_demand: List[Dict[str, Any]] = []
    for note, count in sorted_notes:
        pct = min(round((count / denom_notes) * 100), 100)
        top_notes_demand.append({
            "note": note,
            "customers_count": count,
            "share_pct": pct,
        })

    # 4. Termômetro de Formato (Decants <= 15ml vs Frascos > 15ml — RN-04)
    decants_offers_count = sum(1 for sp in all_active_offers if sp.volume_ml <= 15)
    bottles_offers_count = sum(1 for sp in all_active_offers if sp.volume_ml > 15)

    order_items_qs = OrderItem.objects.filter(order__status__in=VALID_ORDER_STATUSES)
    decant_items = order_items_qs.filter(store_product__volume_ml__lte=15)
    bottle_items = order_items_qs.filter(store_product__volume_ml__gt=15)

    decant_units = decant_items.aggregate(total=Sum("quantity"))["total"] or 0
    bottle_units = bottle_items.aggregate(total=Sum("quantity"))["total"] or 0
    total_units = decant_units + bottle_units

    decant_revenue = (
        decant_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"]
        or Decimal("0.00")
    )
    bottle_revenue = (
        bottle_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"]
        or Decimal("0.00")
    )

    if total_units > 0:
        decant_share = round((decant_units / total_units) * 100)
        bottle_share = 100 - decant_share
    else:
        total_offers = decants_offers_count + bottles_offers_count
        if total_offers > 0:
            decant_share = round((decants_offers_count / total_offers) * 100)
            bottle_share = 100 - decant_share
        else:
            decant_share = 50
            bottle_share = 50

    decant_avg_ticket = (
        f"{(decant_revenue / decant_units):.2f}" if decant_units > 0 else "0.00"
    )
    bottle_avg_ticket = (
        f"{(bottle_revenue / bottle_units):.2f}" if bottle_units > 0 else "0.00"
    )

    format_thermometer = {
        "decants": {
            "active_offers_count": decants_offers_count,
            "units_sold": decant_units,
            "sales_share_pct": decant_share,
            "avg_ticket": decant_avg_ticket,
        },
        "bottles": {
            "active_offers_count": bottles_offers_count,
            "units_sold": bottle_units,
            "sales_share_pct": bottle_share,
            "avg_ticket": bottle_avg_ticket,
        },
    }

    # 5. Radar de Competitividade do Catálogo da Loja (Por Perfume + Volumetria — RN-05)
    catalog_price_comparison: List[Dict[str, Any]] = []
    if current_store:
        my_offers = [
            sp
            for sp in all_active_offers
            if sp.store_id == current_store.id
        ]
        # Caso a loja esteja temporariamente inativa mas autenticada no painel,
        # busca as ofertas disponíveis dela no banco
        if not my_offers and not current_store.is_active:
            my_offers = list(
                StoreProduct.objects.filter(
                    store=current_store,
                    is_available=True,
                    product__is_approved=True,
                ).select_related("product", "product__brand", "store")
            )

        my_offers.sort(
            key=lambda sp: (
                -(sp.product.sold_count or 0),
                sp.product.name.lower(),
                sp.volume_ml,
            )
        )

        for my_offer in my_offers:
            my_effective_price = _get_effective_price(my_offer)
            target_name = my_offer.product.name.lower()
            target_brand = my_offer.product.brand.name.lower()

            all_product_offers = [
                sp
                for sp in all_active_offers
                if sp.product_id == my_offer.product_id
                or (
                    sp.product.name.lower() == target_name
                    and sp.product.brand.name.lower() == target_brand
                )
            ]
            if my_offer not in all_product_offers:
                all_product_offers.append(my_offer)

            all_product_stores = {sp.store_id for sp in all_product_offers}
            sellers_c = len(all_product_stores) or 1

            same_vol_offers = [
                sp for sp in all_product_offers if sp.volume_ml == my_offer.volume_ml
            ]
            same_vol_stores = {sp.store_id for sp in same_vol_offers}

            # Se outras lojas vendem a exata mesma volumetria, compara por volumetria;
            # caso contrário, compara com todas as ofertas ativas do mesmo perfume
            # (unificando Lojas Oficiais e Lojistas multimarcas que vendem o perfume).
            comparison_pool = (
                same_vol_offers if len(same_vol_stores) > 1 else all_product_offers
            )

            effective_prices = [_get_effective_price(sp) for sp in comparison_pool]
            if effective_prices:
                market_min = min(effective_prices)
                market_avg = sum(effective_prices, Decimal("0.00")) / Decimal(
                    len(effective_prices)
                )
            else:
                market_min = my_effective_price
                market_avg = my_effective_price

            if sellers_c <= 1:
                position = "exclusive"
            elif my_effective_price <= market_min:
                position = "lowest"
            elif my_effective_price <= (market_avg * Decimal("1.05")):
                position = "competitive"
            else:
                position = "above_market"

            catalog_price_comparison.append({
                "store_product_id": my_offer.id,
                "product_id": my_offer.product.id,
                "product_name": my_offer.product.name,
                "brand_name": my_offer.product.brand.name,
                "olfactory_family": my_offer.product.olfactory_family,
                "volume_ml": my_offer.volume_ml,
                "is_decant": my_offer.volume_ml <= 15,
                "my_price": f"{my_effective_price:.2f}",
                "market_min_price": f"{market_min:.2f}",
                "market_avg_price": f"{market_avg:.2f}",
                "sellers_count": sellers_c,
                "position": position,
            })

    # 6. Trending Products (Top 5 Perfumes mais vendidos — RN-06) sem N+1
    offers_by_product: Dict[int, List[StoreProduct]] = defaultdict(list)
    for sp in all_active_offers:
        offers_by_product[sp.product_id].append(sp)

    my_store_product_ids: Set[int] = set()
    if current_store:
        my_store_product_ids = set(
            StoreProduct.objects.filter(
                store=current_store,
                is_available=True,
                product__is_approved=True,
            ).values_list("product_id", flat=True)
        )

    order_units_by_product: Dict[int, int] = {
        row["store_product__product_id"]: row["total"] or 0
        for row in order_items_qs.values("store_product__product_id").annotate(
            total=Sum("quantity")
        )
    }

    trending_candidates: List[Dict[str, Any]] = []
    for prod in all_approved_prods:
        prod_offers = offers_by_product.get(prod.id, [])
        effective_prices = [_get_effective_price(sp) for sp in prod_offers]
        min_p = min(effective_prices) if effective_prices else None
        sellers_c = len({sp.store_id for sp in prod_offers})

        real_order_units = order_units_by_product.get(prod.id, 0)
        effective_sold_count = max(prod.sold_count or 0, real_order_units)

        trending_candidates.append({
            "id": prod.id,
            "name": prod.name,
            "brand_name": prod.brand.name,
            "olfactory_family": prod.olfactory_family,
            "sold_count": effective_sold_count,
            "min_market_price": f"{min_p:.2f}" if min_p is not None else "0.00",
            "sellers_count": sellers_c,
            "in_my_catalog": prod.id in my_store_product_ids,
        })

    trending_candidates.sort(
        key=lambda x: (x["sold_count"], x["sellers_count"], x["id"]),
        reverse=True,
    )
    trending_products = trending_candidates[:5]

    # Summary
    top_family = family_demand[0]["family"] if family_demand else "Nenhum"
    top_note = top_notes_demand[0]["note"] if top_notes_demand else "Nenhum"
    total_active_catalog = len(all_approved_prods)
    total_active_offers = len(all_active_offers)
    my_store_products_count = len(my_store_product_ids)

    summary = {
        "total_customers_with_profile": total_customers_with_profile,
        "total_active_catalog_products": total_active_catalog,
        "total_active_marketplace_offers": total_active_offers,
        "my_store_products_count": my_store_products_count,
        "top_family_name": top_family,
        "top_note_name": top_note,
        "decant_sales_share_pct": decant_share,
    }

    return {
        "summary": summary,
        "family_demand": family_demand,
        "top_notes_demand": top_notes_demand,
        "format_thermometer": format_thermometer,
        "catalog_price_comparison": catalog_price_comparison,
        "trending_products": trending_products,
    }
