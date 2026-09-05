from rest_framework import generics, permissions

from .models import Brand, Product
from .serializers import BrandSerializer, ProductSerializer


class BrandListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = BrandSerializer
    queryset = Brand.objects.all()


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.filter(is_approved=True).select_related("brand")
        params = self.request.query_params

        if search := params.get("search"):
            queryset = queryset.filter(name__icontains=search)
        if brand := params.get("brand"):
            queryset = queryset.filter(brand_id=brand)
        if family := params.get("olfactory_family"):
            queryset = queryset.filter(olfactory_family__iexact=family)
        for field in ("top_notes", "heart_notes", "base_notes"):
            if note := params.get(field):
                queryset = queryset.filter(**{f"{field}__icontains": note})

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_approved=True).select_related("brand")