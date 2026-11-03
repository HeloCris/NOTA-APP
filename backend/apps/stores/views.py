import re
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView
from rest_framework.response import Response

# pyrefly: ignore [missing-import]
from apps.core.permissions import IsStoreOwner

from .models import Store, StoreFollower
from apps.inventory.models import StoreProduct
from .serializers import (
    StoreOwnerSerializer, 
    StorePublicSerializer, 
    StoreProductPublicSerializer
)


class StoreListView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsStoreOwner()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StoreOwnerSerializer
        return StorePublicSerializer

    def get_queryset(self):
        qs = Store.objects.filter(is_active=True)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        user = self.request.user
        if user.role == "CUSTOMER":  # type: ignore[union-attr]
            user.role = "SELLER"  # type: ignore[union-attr]
            user.save(update_fields=["role"])  # type: ignore[call-arg]


class StoreDetailView(generics.RetrieveAPIView):
    serializer_class = StorePublicSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Store.objects.filter(is_active=True)


class StoreViewIncrementView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk, *args, **kwargs):
        updated = Store.objects.filter(pk=pk, is_active=True).update(
            views_count=F("views_count") + 1
        )
        if not updated:
            raise NotFound("Loja não encontrada.")
        views = Store.objects.values_list("views_count", flat=True).get(pk=pk)
        return Response({"views_count": views}, status=status.HTTP_200_OK)


class StoreMeView(generics.RetrieveUpdateAPIView):
    serializer_class = StoreOwnerSerializer
    permission_classes = [IsStoreOwner]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> Store:
        store = Store.objects.filter(owner=self.request.user).first()  # type: ignore[misc]
        if store is None:
            raise NotFound("Nenhuma loja encontrada para este usuário.")
        return store

    def perform_update(self, serializer):
        store = self.get_object()
        # Se for loja oficial vinculada a uma marca registrada/aprovada, protege o Nome e CNPJ
        if store.is_official:
            serializer.validated_data.pop("name", None)
            serializer.validated_data.pop("cnpj", None)
        serializer.save()


class StoreDashboardView(APIView):
    permission_classes = [IsStoreOwner]

    def get(self, request, *args, **kwargs):
        user = self.request.user
        store = Store.objects.filter(owner=user).first()  # type: ignore[misc]
        if not store and hasattr(user, 'brands'):
            brand = user.brands.filter(d2c_store__isnull=False).first()
            if brand and brand.d2c_store:
                store = brand.d2c_store

        if store is None:
            raise NotFound("Nenhuma loja encontrada para este usuário.")

        from apps.reviews.models import Review
        from django.db.models import Avg
        from .services.dashboard_service import build_dashboard

        rev_qs = Review.objects.filter(store=store, is_hidden=False, is_deleted=False)
        avg_rating = rev_qs.aggregate(avg=Avg('rating'))['avg']
        rating_val = round(float(avg_rating), 1) if avg_rating is not None else 0.0
        reviews_count = rev_qs.count()

        data = {
            "rating": rating_val,
            "reviews_count": reviews_count,
            "is_verified": bool(store.is_official),
            **build_dashboard(store, request.query_params.get("period", "7d")),
        }
        return Response(data)


class StoreProductListView(generics.ListAPIView):
    serializer_class = StoreProductPublicSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        store_id = self.kwargs.get('pk')
        store = get_object_or_404(Store, pk=store_id, is_active=True)

        queryset = StoreProduct.objects.filter(
            store=store,
            product__is_approved=True,
            is_available=True,
        ).select_related('store', 'product', 'product__brand')
        requested_ids = self.request.query_params.get("store_product_ids")
        if requested_ids:
            try:
                ids = [int(value) for value in requested_ids.split(",") if value.strip()]
            except ValueError:
                ids = []
            queryset = queryset.filter(id__in=ids)
        else:
            queryset = queryset.filter(stock_quantity__gt=0)

        search = self.request.query_params.get('search', None)
        family = self.request.query_params.get('olfactory_family', None)

        if family and family.lower() != 'todos':
            queryset = queryset.filter(product__olfactory_family__iexact=family)

        if search:
            queryset = queryset.filter(
                Q(product__name__icontains=search) | 
                Q(product__brand__name__icontains=search)
            )

        return queryset


class StoreFollowToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        store = get_object_or_404(Store, pk=pk, is_active=True)
        follower, created = StoreFollower.objects.get_or_create(store=store, user=request.user)

        if not created:
            follower.delete()
            is_following = False
        else:
            is_following = True

        return Response({
            "is_following": is_following,
            "followers_count": store.followers.count()
        }, status=status.HTTP_200_OK)


def get_state_from_cep(cep: str) -> str:
    """Retorna a sigla provável do Estado brasileiro a partir dos dígitos do CEP."""
    if not cep:
        return ""
    clean = re.sub(r"\D", "", cep)
    if not clean:
        return ""
    
    # Faixas de CEP oficiais do Brasil por prefixo de 2 dígitos
    prefix2 = int(clean[:2]) if len(clean) >= 2 else int(clean[0]) * 10
    
    if 10 <= prefix2 <= 19:
        return "SP"
    if 20 <= prefix2 <= 28:
        return "RJ"
    if prefix2 == 29:
        return "ES"
    if 30 <= prefix2 <= 39:
        return "MG"
    if 40 <= prefix2 <= 48:
        return "BA"
    if prefix2 == 49:
        return "SE"
    if 50 <= prefix2 <= 56:
        return "PE"
    if prefix2 == 57:
        return "AL"
    if prefix2 == 58:
        return "PB"
    if prefix2 == 59:
        return "RN"
    if 60 <= prefix2 <= 63:
        return "CE"
    if prefix2 == 64:
        return "PI"
    if prefix2 == 65:
        return "MA"
    if 66 <= prefix2 <= 68:
        return "PA"
    if prefix2 == 68:
        return "AP"
    if prefix2 == 69:
        return "AM"
    if 70 <= prefix2 <= 72:
        return "DF"
    if 72 <= prefix2 <= 76:
        return "GO"
    if prefix2 == 77:
        return "TO"
    if prefix2 == 78:
        return "MT"
    if prefix2 == 79:
        return "MS"
    if 80 <= prefix2 <= 87:
        return "PR"
    if 88 <= prefix2 <= 89:
        return "SC"
    if 90 <= prefix2 <= 99:
        return "RS"

    return ""


class StoreShippingQuoteView(APIView):
    """
    Calcula os métodos, valores e prazos de frete para uma loja específica
    com base nas configurações regionais do vendedor e no CEP de destino (RF-10).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk, *args, **kwargs):
        store = get_object_or_404(Store, pk=pk, is_active=True)
        cep = request.data.get("postal_code") or request.data.get("cep") or ""
        dest_state = request.data.get("state") or get_state_from_cep(str(cep))
        cart_subtotal = request.data.get("cart_subtotal")

        try:
            subtotal = float(cart_subtotal) if cart_subtotal is not None else 0.0
        except (ValueError, TypeError):
            subtotal = 0.0

        handling_days = store.shipping_handling_days or 1
        origin_state = (store.state or "").upper().strip()
        dest_state = dest_state.upper().strip()

        # Determina se o envio é para o mesmo estado (Local) ou Nacional
        is_same_state = bool(origin_state and dest_state and origin_state == dest_state)

        # Seleciona tarifas configuradas (com fallbacks)
        if is_same_state:
            pac_base = float(store.shipping_local_pac) if store.shipping_local_pac is not None else (
                float(store.shipping_pac_price) if store.shipping_pac_price is not None else 14.90
            )
            sedex_base = float(store.shipping_local_sedex) if store.shipping_local_sedex is not None else (
                float(store.shipping_sedex_price) if store.shipping_sedex_price is not None else 24.90
            )
            transit_pac_min, transit_pac_max = 2, 4
            transit_sedex_min, transit_sedex_max = 1, 2
            region_name = f"Estadual ({origin_state})"
        else:
            pac_base = float(store.shipping_pac_price) if store.shipping_pac_price is not None else 22.90
            sedex_base = float(store.shipping_sedex_price) if store.shipping_sedex_price is not None else 42.50
            transit_pac_min, transit_pac_max = 5, 8
            transit_sedex_min, transit_sedex_max = 2, 4
            region_name = f"Nacional ({origin_state} → {dest_state or 'BR'})"

        free_shipping = (
            store.free_shipping_threshold is not None
            and subtotal >= float(store.free_shipping_threshold)
        )

        pac_final_price = 0.0 if free_shipping else pac_base

        methods = [
            {
                "id": "PAC",
                "name": "PAC / Econômico",
                "price": round(pac_final_price, 2),
                "handling_days": handling_days,
                "transit_days_min": transit_pac_min,
                "transit_days_max": transit_pac_max,
                "total_delivery_days_min": handling_days + transit_pac_min,
                "total_delivery_days_max": handling_days + transit_pac_max,
                "description": (
                    f"Envio em até {handling_days} dia(s) útil(eis) + trânsito de {transit_pac_min} a {transit_pac_max} dias "
                    f"(Total estimado: {handling_days + transit_pac_min} a {handling_days + transit_pac_max} dias úteis)"
                ),
                "is_free": free_shipping,
            },
            {
                "id": "SEDEX",
                "name": "SEDEX / Expresso",
                "price": round(sedex_base, 2),
                "handling_days": handling_days,
                "transit_days_min": transit_sedex_min,
                "transit_days_max": transit_sedex_max,
                "total_delivery_days_min": handling_days + transit_sedex_min,
                "total_delivery_days_max": handling_days + transit_sedex_max,
                "description": (
                    f"Envio em até {handling_days} dia(s) útil(eis) + trânsito de {transit_sedex_min} a {transit_sedex_max} dias "
                    f"(Total prioritário: {handling_days + transit_sedex_min} a {handling_days + transit_sedex_max} dias úteis)"
                ),
                "is_free": False,
            }
        ]

        return Response({
            "store_id": store.id,
            "store_name": store.name,
            "origin_state": origin_state,
            "origin_postal_code": store.postal_code,
            "destination_state": dest_state,
            "destination_postal_code": str(cep),
            "region_tier": "LOCAL" if is_same_state else "NATIONAL",
            "region_description": region_name,
            "handling_days": handling_days,
            "free_shipping_threshold": float(store.free_shipping_threshold) if store.free_shipping_threshold else None,
            "qualifies_for_free_shipping": free_shipping,
            "methods": methods,
        }, status=status.HTTP_200_OK)
