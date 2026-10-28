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
            'volume_ml',
            'order_id',
            'edited_at',
            'is_edited',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'photos',
            'reply',
            'author_name',
            'product_name',
            'volume_ml',
            'order_id',
            'edited_at',
            'is_edited',
            'created_at',
            'updated_at',
        ]
