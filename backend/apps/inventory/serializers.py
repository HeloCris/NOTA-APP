from rest_framework import serializers
from .models import StoreProduct

class VitrineSerializer(serializers.ModelSerializer):
    # Puxando dados dos outros modelos (Product e Store) através das chaves estrangeiras
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True) # Supondo que exista 'brand' no Product
    product_image = serializers.URLField(source='product.image_url', read_only=True) # Supondo que exista imagem
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = StoreProduct
        fields = [
            'id', 
            'store_name',
            'product_name', 
            'product_brand',
            'product_image',
            'volume_ml', 
            'price', 
            'promotional_price', 
            'is_available'
        ]