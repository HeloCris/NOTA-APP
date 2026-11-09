from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.services.recommendation_service import calculate_olfactory_match
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


class HomeProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    brand_id = serializers.IntegerField(source="brand.id", read_only=True)
    min_price = serializers.SerializerMethodField()
    has_decant = serializers.SerializerMethodField()
    match_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "brand_name",
            "brand_id",
            "olfactory_family",
            "concentration",
            "gender",
            "image_url",
            "min_price",
            "has_decant",
            "match_percentage",
            "sold_count",
        ]

    def get_min_price(self, obj):
        # Otimização N+1: consome os objetos pré-carregados em memória quando disponíveis
        if hasattr(obj, "_prefetched_objects_cache") and "store_products" in obj._prefetched_objects_cache:
            active_sps = [
                sp
                for sp in obj.store_products.all()
                if sp.is_available
                and sp.stock_quantity > 0
                and getattr(sp.store, "is_active", True)
            ]
        else:
            active_sps = obj.store_products.filter(
                is_available=True,
                stock_quantity__gt=0,
                store__is_active=True,
            )
        prices = [
            float(sp.promotional_price or sp.price)
            for sp in active_sps
            if (sp.promotional_price or sp.price) is not None
        ]
        return min(prices) if prices else None

    def get_has_decant(self, obj):
        # Otimização N+1: consome os objetos pré-carregados em memória quando disponíveis
        if hasattr(obj, "_prefetched_objects_cache") and "store_products" in obj._prefetched_objects_cache:
            return any(
                sp.is_available
                and sp.stock_quantity > 0
                and getattr(sp.store, "is_active", True)
                and (sp.volume_ml is not None and sp.volume_ml <= 15)
                for sp in obj.store_products.all()
            )
        return obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True,
            volume_ml__lte=15,
        ).exists()

    def get_match_percentage(self, obj):
        if hasattr(obj, "match_percentage"):
            return obj.match_percentage

        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            followed_store_ids = self.context.get("followed_store_ids")
            calc = calculate_olfactory_match(
                request.user,
                obj,
                followed_store_ids=followed_store_ids,
            )
            return calc.get("match_percentage")
        return None


class HomeStoreSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "id",
            "name",
            "slug",
            "logo_url",
            "cover_url",
            "city",
            "state",
            "is_official",
            "followers_count",
            "rating",
            "reviews_count",
        ]

    def get_rating(self, obj):
        if hasattr(obj, "avg_rating"):
            avg = obj.avg_rating
        else:
            from apps.reviews.models import Review
            from django.db.models import Avg

            avg = Review.objects.filter(
                store=obj,
                is_hidden=False,
                is_deleted=False,
            ).aggregate(Avg("rating"))["rating__avg"]
        return round(float(avg), 1) if avg is not None else None

    def get_reviews_count(self, obj):
        if hasattr(obj, "total_reviews"):
            return obj.total_reviews
        from apps.reviews.models import Review

        return Review.objects.filter(
            store=obj,
            is_hidden=False,
            is_deleted=False,
        ).count()
