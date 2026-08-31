from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound

from apps.core.permissions import IsStoreOwner

from .models import Store
from .serializers import StoreOwnerSerializer, StorePublicSerializer


class StoreListView(generics.ListAPIView):
    """
    GET /api/v1/stores/
    Listagem pública de lojas ativas no marketplace.
    Suporta busca por nome via ?search=<termo>.
    """

    serializer_class = StorePublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Store.objects.filter(is_active=True)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


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
