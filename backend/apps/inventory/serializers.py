from rest_framework import serializers

from apps.catalog.models import Product

from .models import StoreProduct


class ProductSummarySerializer(serializers.ModelSerializer):

    brand = serializers.StringRelatedField()

    class Meta:
        model = Product
        fields = ["id", "name", "brand"]


class StoreProductSerializer(serializers.ModelSerializer):

    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_approved=True),
        source="product",
        write_only=True,
    )

    product = ProductSummarySerializer(read_only=True)

    class Meta:
        model = StoreProduct
        fields = [
            "id",
            "product_id",
            "product",
            "volume_ml",
            "price",
            "promotional_price",
            "stock_quantity",
            "is_available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "product", "created_at", "updated_at"]

    def validate_volume_ml(self, value: int) -> int:
        if value <= 0:
            raise serializers.ValidationError("O volume deve ser maior que zero.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("O preço deve ser maior que zero.")
        return value

    def validate_promotional_price(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "O preço promocional deve ser maior que zero."
            )
        return value

    def validate_stock_quantity(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError(
                "A quantidade em estoque não pode ser negativa."
            )
        return value

    def validate(self, attrs):
        request = self.context.get("request")

        price = attrs.get("price", getattr(self.instance, "price", None))
        promotional_price = attrs.get(
            "promotional_price",
            getattr(self.instance, "promotional_price", None),
        )

        if promotional_price is not None and price is not None and promotional_price >= price:
            raise serializers.ValidationError(
                {"promotional_price": "O preço promocional deve ser menor que o preço de venda."}
            )

        store_id = getattr(request.auth, "get", lambda _k: None)("store_id")
        product = attrs.get("product", getattr(self.instance, "product", None))
        volume_ml = attrs.get("volume_ml", getattr(self.instance, "volume_ml", None))

        if store_id and product and volume_ml is not None:
            qs = StoreProduct.objects.filter(
                store_id=store_id,
                product=product,
                volume_ml=volume_ml,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"detail": "Este produto já está no seu estoque."}
                )

        return attrs