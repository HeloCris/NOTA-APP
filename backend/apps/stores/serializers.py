import re
from rest_framework import serializers
from .models import Store
from apps.inventory.models import StoreProduct


class StorePublicSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = [
            "id", "slug", "name", "logo_url", "cover_url", "bio",
            "is_active", "vacation_mode", "is_official",
            "rating", "reviews_count", "followers_count", "is_following",
            "city", "state", "postal_code",
            "shipping_local_pac", "shipping_local_sedex",
            "shipping_pac_price", "shipping_sedex_price",
            "shipping_handling_days", "free_shipping_threshold",
            "has_complete_address", "has_shipping_configured", "is_ready_to_sell",
        ]

    def get_rating(self, obj):
        from apps.reviews.models import Review
        from django.db.models import Avg
        avg = Review.objects.filter(
            store=obj, is_hidden=False, is_deleted=False
        ).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else 0.0

    def get_reviews_count(self, obj):
        from apps.reviews.models import Review
        return Review.objects.filter(
            store=obj, is_hidden=False, is_deleted=False
        ).count()

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return obj.followers.filter(user=request.user).exists()
        return False


class StoreOwnerSerializer(serializers.ModelSerializer):
    cnpj = serializers.CharField(max_length=18)

    class Meta:
        model = Store
        fields = [
            "id", "name", "legal_name", "cnpj", "phone",
            "postal_code", "street", "number", "complement",
            "neighborhood", "city", "state",
            "bio", "logo_url", "cover_url", "is_active", "vacation_mode",
            "shipping_local_pac", "shipping_local_sedex",
            "shipping_pac_price", "shipping_sedex_price",
            "shipping_handling_days", "free_shipping_threshold",
            "has_complete_address", "has_shipping_configured", "is_ready_to_sell",
            "is_official", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "is_official", "has_complete_address",
            "has_shipping_configured", "is_ready_to_sell",
            "created_at", "updated_at"
        ]

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
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    brand_name = serializers.CharField(source='product.brand.name', read_only=True)
    olfactory_family = serializers.CharField(source='product.olfactory_family', read_only=True)
    image_url = serializers.URLField(source='product.image_url', read_only=True)
    store_id = serializers.IntegerField(source='store.id', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    is_official = serializers.BooleanField(source='store.is_official', read_only=True)
    store_city = serializers.CharField(source='store.city', read_only=True)
    store_state = serializers.CharField(source='store.state', read_only=True)
    sold_count = serializers.IntegerField(source='product.sold_count', read_only=True)
    rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = StoreProduct
        fields = [
            'id', 'product_id', 'product_name', 'brand_name', 'olfactory_family',
            'price', 'promotional_price', 'volume_ml', 'image_url',
            'store_id', 'store_name', 'is_official', 'store_city', 'store_state', 'sold_count',
            'stock_quantity', 'rating', 'reviews_count'
        ]

    def get_rating(self, obj):
        from apps.reviews.models import Review
        from django.db.models import Avg
        avg = Review.objects.filter(
            store_id=obj.store_id,
            product_id=obj.product_id,
            is_hidden=False,
            is_deleted=False
        ).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else 0.0

    def get_reviews_count(self, obj):
        from apps.reviews.models import Review
        return Review.objects.filter(
            store_id=obj.store_id,
            product_id=obj.product_id,
            is_hidden=False,
            is_deleted=False
        ).count()