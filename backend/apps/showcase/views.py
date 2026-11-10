from decimal import Decimal, InvalidOperation

from django.db.models import Avg, Count, F, Prefetch, Q, QuerySet
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.catalog.services.recommendation_service import calculate_olfactory_match
from apps.inventory.models import StoreProduct
from apps.stores.models import Store, StoreFollower

from .serializers import (
    HomeProductSerializer,
    HomeStoreSerializer,
    ShowcaseProductSerializer,
    ShowcaseStoreSerializer,
)


class PublicProductQuerysetMixin:
    def public_products(self) -> QuerySet[StoreProduct]:
        queryset = StoreProduct.objects.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True,
            product__is_approved=True,
        ).select_related("store", "product__brand")
        params = getattr(self, "request").query_params

        if params.get("brand"):
            brand = params["brand"]
            queryset = queryset.filter(Q(product__brand__name__iexact=brand) | Q(product__brand_id=brand))
        if params.get("family"):
            queryset = queryset.filter(product__olfactory_family__iexact=params["family"])
        if params.get("search"):
            search = params["search"]
            queryset = queryset.filter(Q(product__name__icontains=search) | Q(product__brand__name__icontains=search))
        for parameter, lookup in (("min_price", "gte"), ("max_price", "lte")):
            value = params.get(parameter)
            if value:
                try:
                    queryset = queryset.filter(**{f"price__{lookup}": Decimal(value)})
                except (InvalidOperation, ValueError):
                    continue
        return queryset


class ShowcaseProductListView(PublicProductQuerysetMixin, generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ShowcaseProductSerializer

    def get_queryset(self):
        return self.public_products()


class ShowcaseStoreDetailView(PublicProductQuerysetMixin, generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ShowcaseStoreSerializer
    lookup_field = "slug"

    def get_queryset(self):
        store_products = self.public_products()
        return Store.objects.filter(is_active=True).prefetch_related(
            serializers_prefetch(store_products)
        )


def serializers_prefetch(products):
    from django.db.models import Prefetch

    return Prefetch("store_products", queryset=products, to_attr="public_products")


class ShowcaseHomeFeedView(APIView):
    """
    Feed dinâmico da Home Mobile (RF-21 / RN-01 a RN-04).
    Retorna lojas ativas em destaque, produtos recomendados por afinidade olfativa (ou popularidade)
    e destaques de decants disponíveis com estoque.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        user = request.user if request.user and request.user.is_authenticated else None
        user_families = getattr(user, "olfactory_families", []) or [] if user else []
        user_notes = getattr(user, "preferred_notes", []) or [] if user else []
        has_olfactory_profile = bool(user and (user_families or user_notes))

        user_summary = {
            "olfactory_families": user_families,
            "preferred_notes": user_notes,
        }

        followed_store_ids = set()
        if user:
            followed_store_ids = set(
                StoreFollower.objects.filter(user=user).values_list("store_id", flat=True)
            )

        # 1. Lojas em destaque ativas e com estoque ativo (RN-03: Vitrine e Ordenação de Lojas)
        # Conforme a RN-03, as lojas oficiais e parceiras ativas são ordenadas prioritariamente
        # pela reputação real calculada (nota média de avaliações dos clientes - avg_rating),
        # de forma decrescente com nulls_last=True para posicionar lojas sem avaliação no final.
        # Os critérios de desempate subsequentes são: maior número de seguidores (-followers_count),
        # selo oficial de verificação (-is_official) e total de visualizações (-views_count).
        # distinct=True em Count("reviews") evita duplicação de contagem gerada pelo join com StoreProduct.
        featured_stores = (
            Store.objects.filter(
                is_active=True,
                store_products__is_available=True,
                store_products__stock_quantity__gt=0,
            )
            .annotate(
                avg_rating=Avg(
                    "reviews__rating",
                    filter=Q(
                        reviews__is_hidden=False,
                        reviews__is_deleted=False,
                    ),
                ),
                total_reviews=Count(
                    "reviews",
                    filter=Q(
                        reviews__is_hidden=False,
                        reviews__is_deleted=False,
                    ),
                    distinct=True,
                ),
            )
            .distinct()
            .order_by(
                F("avg_rating").desc(nulls_last=True),
                "-followers_count",
                "-is_official",
                "-views_count",
            )[:8]
        )

        active_store_products_prefetch = Prefetch(
            "store_products",
            queryset=StoreProduct.objects.filter(
                is_available=True,
                stock_quantity__gt=0,
                store__is_active=True,
            ).select_related("store"),
        )

        # 2. Base de perfumes aprovados com oferta em estoque ativo (RN-01, RN-04)
        base_products = list(
            Product.objects.filter(
                is_approved=True,
                store_products__is_available=True,
                store_products__stock_quantity__gt=0,
                store_products__store__is_active=True,
            )
            .select_related("brand")
            .prefetch_related(active_store_products_prefetch)
            .distinct()
        )

        if has_olfactory_profile and user:
            for prod in base_products:
                match_data = calculate_olfactory_match(
                    user, prod, followed_store_ids=followed_store_ids
                )
                prod.match_percentage = match_data.get("match_percentage")

            # Ordena por maior afinidade olfativa (RN-02) e desempata por vendas/criação
            base_products.sort(
                key=lambda p: (
                    p.match_percentage if p.match_percentage is not None else -1,
                    p.sold_count or 0,
                    p.id,
                ),
                reverse=True,
            )
            recommended_products = base_products[:10]
        else:
            base_products.sort(
                key=lambda p: (p.sold_count or 0, p.id),
                reverse=True,
            )
            recommended_products = base_products[:10]

        # 3. Destaques de decants (volume <= 15ml) com estoque ativo
        decant_products = list(
            Product.objects.filter(
                is_approved=True,
                store_products__is_available=True,
                store_products__stock_quantity__gt=0,
                store_products__store__is_active=True,
                store_products__volume_ml__lte=15,
            )
            .select_related("brand")
            .prefetch_related(active_store_products_prefetch)
            .distinct()
        )
        decant_products.sort(
            key=lambda p: (p.sold_count or 0, p.id),
            reverse=True,
        )
        decant_highlights = decant_products[:6]

        context = {"request": request, "followed_store_ids": followed_store_ids}

        return Response({
            "has_olfactory_profile": has_olfactory_profile,
            "user_summary": user_summary,
            "recommended_products": HomeProductSerializer(
                recommended_products, many=True, context=context
            ).data,
            "featured_stores": HomeStoreSerializer(
                featured_stores, many=True, context=context
            ).data,
            "decant_highlights": HomeProductSerializer(
                decant_highlights, many=True, context=context
            ).data,
        })
