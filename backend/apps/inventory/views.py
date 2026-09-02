from rest_framework import generics
from .models import StoreProduct
from .serializers import VitrineSerializer

# RF-05: Feed Público (Todos os perfumes disponíveis de todas as lojas)
class FeedPublicoView(generics.ListAPIView):
    serializer_class = VitrineSerializer
    permission_classes = [] # Acesso público
    
    def get_queryset(self):
        # Retorna apenas produtos disponíveis e com estoque maior que zero
        return StoreProduct.objects.filter(is_available=True, stock_quantity__gt=0).order_by('-created_at')

# RF-05: Vitrine da Loja (Perfumes de uma loja específica)
class VitrineLojaView(generics.ListAPIView):
    serializer_class = VitrineSerializer
    permission_classes = [] # Acesso público
    
    def get_queryset(self):
        # Pega o ID da loja que virá na URL
        loja_id = self.kwargs['store_id']
        # Filtra pela loja, disponibilidade e estoque
        return StoreProduct.objects.filter(store_id=loja_id, is_available=True, stock_quantity__gt=0)