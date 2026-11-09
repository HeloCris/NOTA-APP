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
            "max_installments", "free_interest_installments", "min_installment_amount",
            "has_complete_address", "has_shipping_configured", "is_ready_to_sell",
        ]

    def get_rating(self, obj):
        from apps.reviews.models import Review
        from django.db.models import Avg
        avg = Review.objects.filter(
            store=obj, is_hidden=False, is_deleted=False
        ).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else None

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
            "max_installments", "free_interest_installments", "min_installment_amount",
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


class StoreCouponSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import StoreCoupon
        model = StoreCoupon
        fields = [
            "id", "code", "discount_type", "discount_value",
            "min_purchase_amount", "usage_limit", "max_uses_per_user",
            "used_count", "valid_from", "valid_until", "is_active", "created_at",
        ]
        read_only_fields = ["id", "used_count", "created_at"]

    def validate_code(self, value: str) -> str:
        clean_code = value.strip().upper()
        if not clean_code:
            raise serializers.ValidationError("O código do cupom é obrigatório.")
        return clean_code

    def validate(self, attrs):
        discount_type = attrs.get("discount_type") or (self.instance.discount_type if self.instance else "PERCENTAGE")
        discount_value = attrs.get("discount_value") if "discount_value" in attrs else (self.instance.discount_value if self.instance else None)

        if discount_value is not None:
            if discount_value <= 0:
                raise serializers.ValidationError({"discount_value": "O valor do desconto deve ser maior que zero."})
            if discount_type == "PERCENTAGE" and discount_value > 100:
                raise serializers.ValidationError({"discount_value": "Desconto em porcentagem não pode ultrapassar 100%."})

        min_purchase = attrs.get("min_purchase_amount")
        if min_purchase is not None and min_purchase < 0:
            raise serializers.ValidationError({"min_purchase_amount": "O valor mínimo de compra não pode ser negativo."})

        max_per_user = attrs.get("max_uses_per_user")
        if max_per_user is not None and max_per_user < 1:
            raise serializers.ValidationError({"max_uses_per_user": "O limite de usos por usuário deve ser de pelo menos 1."})

        valid_from = attrs.get("valid_from") or (self.instance.valid_from if self.instance else None)
        valid_until = attrs.get("valid_until") or (self.instance.valid_until if self.instance else None)
        if valid_from and valid_until and valid_until < valid_from:
            raise serializers.ValidationError({"valid_until": "A data final de validade não pode ser anterior à data inicial."})

        return attrs


class StoreInstallmentsSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = [
            "max_installments", "free_interest_installments", "min_installment_amount"
        ]

    def validate(self, attrs):
        max_inst = attrs.get("max_installments", getattr(self.instance, "max_installments", 6))
        free_inst = attrs.get("free_interest_installments", getattr(self.instance, "free_interest_installments", 3))
        min_amount = attrs.get("min_installment_amount", getattr(self.instance, "min_installment_amount", 30))

        if not (1 <= max_inst <= 12):
            raise serializers.ValidationError({"max_installments": "O número máximo de parcelas deve ser entre 1 e 12."})

        if not (1 <= free_inst <= max_inst):
            raise serializers.ValidationError({
                "free_interest_installments": f"Parcelas sem juros devem estar entre 1 e o máximo configurado ({max_inst})."
            })

        if min_amount <= 0:
            raise serializers.ValidationError({"min_installment_amount": "O valor mínimo da parcela deve ser maior que zero."})

        return attrs


class FollowingStoreSerializer(serializers.ModelSerializer):
    followed_at = serializers.DateTimeField(source="created_at", read_only=True)
    store_id = serializers.IntegerField(source="store.id", read_only=True)
    name = serializers.CharField(source="store.name", read_only=True)
    slug = serializers.CharField(source="store.slug", read_only=True)
    logo_url = serializers.CharField(source="store.logo_url", read_only=True)
    is_official = serializers.BooleanField(source="store.is_official", read_only=True)
    followers_count = serializers.IntegerField(source="store.followers_count", read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        from .models import StoreFollower
        model = StoreFollower
        fields = [
            "store_id", "name", "slug", "logo_url", "is_official",
            "followers_count", "rating", "followed_at"
        ]

    def get_rating(self, obj):
        from apps.reviews.models import Review
        from django.db.models import Avg
        avg = Review.objects.filter(
            store=obj.store,
            product__isnull=True,
            is_hidden=False,
            is_deleted=False
        ).aggregate(Avg('rating'))['rating__avg']
        return round(float(avg), 1) if avg is not None else 0.0
