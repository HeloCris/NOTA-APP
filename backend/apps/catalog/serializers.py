from rest_framework import serializers

from .models import Brand, Product


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name"]


class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "brand", "brand_id", "olfactory_family", "top_notes",
            "heart_notes", "base_notes", "description", "image_url",
        ]
        read_only_fields = ["id"]

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