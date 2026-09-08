from decimal import Decimal, InvalidOperation

from django.db.models import Q, QuerySet
from rest_framework import generics, permissions

from apps.inventory.models import StoreProduct
from apps.stores.models import Store

from .serializers import ShowcaseProductSerializer, ShowcaseStoreSerializer


class PublicProductQuerysetMixin:
    def public_products(self) -> QuerySet[StoreProduct]:
        queryset = StoreProduct.objects.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True,
            product__is_approved=True,
        ).select_related("store", "product__brand")
        params = self.request.query_params

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
