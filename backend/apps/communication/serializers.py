from rest_framework import serializers

from .models import ChatConversation, ChatMessage, Notification


class OrderSummaryLiteSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    number = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_name",
            "text",
            "attachment_image",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "conversation", "sender_id", "sender_name", "is_read", "created_at"]

    def get_sender_name(self, obj):
        full_name = " ".join(
            part for part in (obj.sender.first_name, obj.sender.last_name) if part
        )
        return full_name or obj.sender.email

    def validate(self, attrs):
        text = (attrs.get("text") or "").strip()
        image = attrs.get("attachment_image")
        if not text and not image:
            raise serializers.ValidationError({"detail": "Mensagem vazia"})
        if len(text) > 1500:
            raise serializers.ValidationError(
                {"text": "A mensagem deve ter no máximo 1500 caracteres."}
            )
        attrs["text"] = text
        return attrs


class ChatConversationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    store_name = serializers.CharField(source="store.name", read_only=True)
    order = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatConversation
        fields = [
            "id",
            "customer",
            "store",
            "customer_name",
            "store_name",
            "order",
            "updated_at",
            "created_at",
            "unread_count",
        ]
        read_only_fields = ["id", "updated_at", "created_at"]

    def get_customer_name(self, obj):
        full_name = " ".join(
            part for part in (obj.customer.first_name, obj.customer.last_name) if part
        )
        return full_name or obj.customer.email

    def get_order(self, obj):
        if not obj.order:
            return None
        return {
            "id": obj.order.id,
            "number": getattr(obj.order, "number", None) or f"#{obj.order.id}",
            "status": obj.order.status,
            "total_amount": obj.order.total_amount,
        }

    def get_unread_count(self, obj):
        user = self.context.get("request").user if self.context.get("request") else None
        if not user:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=user).count()



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "store",
            "title",
            "message",
            "type",
            "target_url",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
