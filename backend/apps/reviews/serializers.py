from rest_framework import serializers
from .models import Review, ReviewPhoto, ReviewReply


class ReviewPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewPhoto
        fields = ['id', 'image', 'created_at']


class ReviewReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewReply
        fields = ['id', 'text', 'author_name', 'created_at', 'updated_at']

    def get_author_name(self, obj):
        return obj.author.first_name or obj.author.email or 'Loja'


class ReviewSerializer(serializers.ModelSerializer):
    photos = ReviewPhotoSerializer(many=True, read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    author_name = serializers.CharField(source='author_display_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    volume_ml = serializers.IntegerField(source='store_product.volume_ml', read_only=True)
    order_id = serializers.IntegerField(source='order_item.order_id', read_only=True)
    product_image = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id',
            'order_item',
            'rating',
            'comment',
            'photos',
            'reply',
            'author_name',
            'product_name',
            'product_image',
            'volume_ml',
            'order_id',
            'edited_at',
            'is_edited',
            'can_edit',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'photos',
            'reply',
            'author_name',
            'product_name',
            'product_image',
            'volume_ml',
            'order_id',
            'edited_at',
            'is_edited',
            'can_edit',
            'created_at',
            'updated_at',
        ]

    def get_can_edit(self, obj):
        from django.utils import timezone
        if obj.is_deleted or obj.edited_at is not None:
            return False
        try:
            order = obj.order_item.order
            if not order.delivered_at or (timezone.now() - order.delivered_at).days > 30:
                return False
        except Exception:
            return False
        return True

    def get_product_image(self, obj):
        try:
            product = obj.product
            if not product:
                return None
            if hasattr(product, 'photos'):
                primary_photo = product.photos.filter(is_primary=True).first() or product.photos.first()
                if primary_photo and hasattr(primary_photo, 'image') and primary_photo.image:
                    return primary_photo.image.url
            if getattr(product, 'image_url', None):
                return product.image_url
        except Exception:
            pass
        return None
