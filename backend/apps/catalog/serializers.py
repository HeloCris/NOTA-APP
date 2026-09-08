import re
from rest_framework import serializers

from .models import Brand, Product


class BrandOnboardingSerializer(serializers.ModelSerializer):
    cnpj = serializers.CharField(max_length=20)

    class Meta:
        model = Brand
        fields = ["name", "cnpj", "inpi_registration", "social_contract", "inpi_certificate"]
    
    def validate_cnpj(self, value):
        cnpj = re.sub(r'[^0-9]', '', value) if value else None
        if not cnpj or len(cnpj) != 14:
            raise serializers.ValidationError("CNPJ deve ter 14 dígitos.")
        return cnpj


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "owner", "cnpj", "inpi_registration", "status", "is_official", "d2c_store"]
        read_only_fields = ["id", "owner", "status", "is_official", "d2c_store"]


class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True  # type: ignore
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "brand", "brand_id", "ean", "anvisa_code", "olfactory_family", "top_notes",
            "heart_notes", "base_notes", "description", "image_url", "is_approved"
        ]
        read_only_fields = ["id", "is_approved"]

    def validate_top_notes(self, value: list[str]) -> list[str]:
        return self._validate_notes(value)

    def validate_heart_notes(self, value: list[str]) -> list[str]:
        return self._validate_notes(value)

    def validate_base_notes(self, value: list[str]) -> list[str]:
        return self._validate_notes(value)

    @staticmethod
    def _validate_notes(value: list[str]) -> list[str]:
        if not isinstance(value, list) or not value or not all(isinstance(note, str) and note.strip() for note in value):
            raise serializers.ValidationError("Informe ao menos uma nota olfativa válida.")
        return value


class BrandProductSerializer(ProductSerializer):
    brand_id = serializers.PrimaryKeyRelatedField(read_only=True)
    ean = serializers.CharField(max_length=13, required=True)
    anvisa_code = serializers.CharField(max_length=30, required=True)

    class Meta(ProductSerializer.Meta):
        read_only_fields = ["id", "is_approved", "brand", "brand_id"]
        
    def validate_ean(self, value):
        if not value or len(value) != 13 or not value.isdigit():
            raise serializers.ValidationError("O EAN deve ter exatamente 13 dígitos numéricos.")
        return value