import re
from rest_framework import serializers
from .models import Store
from apps.inventory.models import StoreProduct


class StorePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "slug", "name", "logo_url", "cover_url", "bio", "is_active", "vacation_mode"]


class StoreOwnerSerializer(serializers.ModelSerializer):
    cnpj = serializers.CharField(max_length=18)

    class Meta:
        model = Store
        fields = [
            "id", "name", "legal_name", "cnpj", "phone", "bio",
            "logo_url", "cover_url", "is_active", "vacation_mode",
            "is_official", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_official", "created_at", "updated_at"]

    def validate_cnpj(self, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if len(digits) != 14:
            raise serializers.ValidationError("CNPJ inválido — deve conter 14 dígitos numéricos.")
        qs = Store.objects.filter(cnpj=digits)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este CNPJ já está cadastrado na plataforma.")
        return digits


class StoreProductPublicSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    brand_name = serializers.CharField(source='product.brand.name', read_only=True)
    olfactory_family = serializers.CharField(source='product.olfactory_family', read_only=True)
    image_url = serializers.URLField(source='product.image_url', read_only=True)

    class Meta:
        model = StoreProduct
        fields = ['id', 'product_name', 'brand_name', 'olfactory_family', 'price', 'promotional_price', 'volume_ml', 'image_url']