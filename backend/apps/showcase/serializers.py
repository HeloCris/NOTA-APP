from rest_framework import serializers

from apps.inventory.models import StoreProduct
from apps.stores.models import Store


class ShowcaseProductSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="product.name", read_only=True)
    brand = serializers.CharField(source="product.brand.name", read_only=True)
    family = serializers.CharField(source="product.olfactory_family", read_only=True)
    image_url = serializers.CharField(source="product.image_url", read_only=True)
    top_notes = serializers.ListField(source="product.top_notes", read_only=True)
    heart_notes = serializers.ListField(source="product.heart_notes", read_only=True)
    base_notes = serializers.ListField(source="product.base_notes", read_only=True)
    store_name = serializers.CharField(source="store.name", read_only=True)
    store_slug = serializers.CharField(source="store.slug", read_only=True)
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = StoreProduct
        fields = [
            "id", "name", "brand", "family", "image_url", "top_notes",
            "heart_notes", "base_notes", "volume_ml", "price",
            "promotional_price", "effective_price", "store_name", "store_slug",
        ]

    def get_effective_price(self, obj):
        return obj.promotional_price or obj.price


class ShowcaseStoreSerializer(serializers.ModelSerializer):
    products = ShowcaseProductSerializer(source="public_products", many=True, read_only=True)

    class Meta:
        model = Store
        fields = [
            "id", "slug", "name", "logo_url", "cover_url", "bio",
            "is_official", "products",
        ]
