from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from apps.core.permissions import IsStoreOwner

from .models import StoreProduct
from .serializers import StoreProductSerializer


class StoreProductListCreateView(generics.ListCreateAPIView):

    serializer_class = StoreProductSerializer
    permission_classes = [IsStoreOwner]

    def get_store_id(self):
        return getattr(self.request.auth, "get", lambda _k: None)("store_id")

    def get_queryset(self):
        queryset = (
            StoreProduct.objects.filter(store_id=self.get_store_id())
            .select_related("product__brand")
        )
        params = self.request.query_params

        if search := params.get("search"):
            queryset = queryset.filter(product__name__icontains=search)

        if is_active := params.get("is_active"):
            queryset = queryset.filter(is_available=is_active.lower() == "true")

        if status := params.get("status"):
            if status == "active":
                queryset = queryset.filter(is_available=True)
            elif status == "inactive":
                queryset = queryset.filter(is_available=False)
            elif status == "low_stock":
                queryset = queryset.filter(stock_quantity__lt=3)

        return queryset

    def create(self, request, *args, **kwargs):
        if self.get_store_id() is None:
            raise PermissionDenied("Você não possui uma loja associada.")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(store_id=self.get_store_id())


class StoreProductDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = StoreProductSerializer
    permission_classes = [IsStoreOwner]

    def get_store_id(self):
        return getattr(self.request.auth, "get", lambda _k: None)("store_id")

    def get_queryset(self):
        return (
            StoreProduct.objects.filter(store_id=self.get_store_id())
            .select_related("product__brand")
        )

    def perform_update(self, serializer):
        serializer.save(store_id=self.get_store_id())