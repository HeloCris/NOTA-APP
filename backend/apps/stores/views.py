from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound

# pyrefly: ignore [missing-import]
from apps.core.permissions import IsStoreOwner

from .models import Store
from .serializers import StoreOwnerSerializer, StorePublicSerializer


class StoreListView(generics.ListCreateAPIView):
    """
    GET  /api/v1/stores/ — Listagem pública de lojas ativas. Suporta ?search=<nome>.
    POST /api/v1/stores/ — Cria uma nova loja vinculada ao lojista autenticado.
    """

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
        store = serializer.save(owner=self.request.user)
        if self.request.user.role == "CUSTOMER":
            self.request.user.role = "SELLER"
            self.request.user.save(update_fields=["role"])


class StoreDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/stores/<id>/
    Detalhe público de uma loja específica.
    """

    serializer_class = StorePublicSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Store.objects.filter(is_active=True)


class StoreMeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/stores/me/ — retorna perfil completo da loja do lojista autenticado.
    PATCH /api/v1/stores/me/ — atualização parcial dos dados da loja.

    Permissão: IsStoreOwner (role == SELLER obrigatório).
    Isolamento: a loja é resolvida pelo owner=request.user,
    garantindo que o lojista só veja/edite seus próprios dados.
    """

    serializer_class = StoreOwnerSerializer
    permission_classes = [IsStoreOwner]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> Store:
        store = Store.objects.filter(owner=self.request.user).first()
        if store is None:
            raise NotFound("Nenhuma loja encontrada para este usuário.")
        return store


from rest_framework.views import APIView
from rest_framework.response import Response

class StoreDashboardView(APIView):
    """
    GET /api/v1/stores/me/dashboard/ — retorna dados de dashboard para a loja do lojista autenticado.
    Atualmente retorna 0/dados vazios pois o módulo de pedidos e analytics ainda não existe.
    """
    
    permission_classes = [IsStoreOwner]

    def get(self, request, *args, **kwargs):
        store = Store.objects.filter(owner=self.request.user).first()
        if store is None:
            raise NotFound("Nenhuma loja encontrada para este usuário.")
            
        data = {
            "rating": 0.0,
            "is_verified": False,
            "kpis": {
                "revenue_month": 0,
                "pending_orders": 0,
                "stock_alerts": 0,
                "store_views": 0
            },
            "weekly_sales": [0, 0, 0, 0, 0, 0, 0],
            "recent_orders": [],
            "top_perfumes": [],
            "restock_alerts": []
        }
        return Response(data)
