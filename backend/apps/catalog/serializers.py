import re
from rest_framework import serializers
from .models import Brand, Product
from apps.catalog.services.recommendation_service import calculate_olfactory_match


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


class ProductStoreOfferSerializer(serializers.Serializer):
    id = serializers.IntegerField()  # ID do StoreProduct no inventário
    store_product_id = serializers.IntegerField(source='id')
    store_id = serializers.IntegerField(source='store.id')
    store_name = serializers.CharField(source='store.name')
    store_slug = serializers.CharField(source='store.slug')
    is_official = serializers.BooleanField(source='store.is_official')
    city = serializers.CharField(source='store.city', allow_blank=True, default='')
    state = serializers.CharField(source='store.state', allow_blank=True, default='')
    volume_ml = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    promotional_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    stock_quantity = serializers.IntegerField()
    store_logo = serializers.URLField(source='store.logo_url', allow_blank=True, default='')


class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True, required=False
    )
    brand_name = serializers.CharField(source='brand.name', read_only=True)

    store_offers = serializers.SerializerMethodField()
    available_volumes = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    store_is_official = serializers.SerializerMethodField()
    store_city = serializers.SerializerMethodField()
    store_state = serializers.SerializerMethodField()

    match_percentage = serializers.SerializerMethodField()
    matched_notes = serializers.SerializerMethodField()
    matched_family = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "brand", "brand_id", "brand_name", "ean", "anvisa_code",
            "concentration", "gender", "olfactory_family", "top_notes", "heart_notes",
            "base_notes", "description", "image_url", "is_approved", "sold_count",
            "store_offers", "available_volumes", "min_price", "store_name",
            "store_is_official", "store_city", "store_state",
            "match_percentage", "matched_notes", "matched_family"
        ]
        read_only_fields = [
            "id", "is_approved", "store_offers", "available_volumes", "min_price",
            "store_name", "store_is_official", "store_city", "store_state",
            "match_percentage", "matched_notes", "matched_family"
        ]

    def get_store_offers(self, obj):
        offers = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).select_related('store').order_by('price')
        return ProductStoreOfferSerializer(offers, many=True).data

    def get_available_volumes(self, obj):
        vols = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).values_list('volume_ml', flat=True).distinct().order_by('volume_ml')
        return list(vols)

    def get_min_price(self, obj):
        min_sp = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).order_by('price').first()
        return float(min_sp.price) if min_sp else None

    def get_store_name(self, obj):
        first_sp = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).select_related('store').first()
        return first_sp.store.name if first_sp and first_sp.store else ""

    def get_store_is_official(self, obj):
        first_sp = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).select_related('store').first()
        return bool(first_sp.store.is_official) if first_sp and first_sp.store else False

    def get_store_city(self, obj):
        first_sp = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).select_related('store').first()
        return first_sp.store.city if first_sp and first_sp.store else ""

    def get_store_state(self, obj):
        first_sp = obj.store_products.filter(
            is_available=True,
            stock_quantity__gt=0,
            store__is_active=True
        ).select_related('store').first()
        return first_sp.store.state if first_sp and first_sp.store else ""

    def _get_match_data(self, obj):
        if not hasattr(self, '_match_cache'):
            self._match_cache = {}

        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return {"match_percentage": None, "matched_notes": [], "matched_family": False}

        user_id = request.user.id
        cache_key = f"{user_id}_{obj.id}"

        if cache_key not in self._match_cache:
            followed_store_ids = self.context.get('followed_store_ids')
            self._match_cache[cache_key] = calculate_olfactory_match(
                request.user, obj, followed_store_ids=followed_store_ids
            )
        return self._match_cache[cache_key]

    def get_match_percentage(self, obj):
        return self._get_match_data(obj)["match_percentage"]

    def get_matched_notes(self, obj):
        return self._get_match_data(obj)["matched_notes"]

    def get_matched_family(self, obj):
        return self._get_match_data(obj)["matched_family"]

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