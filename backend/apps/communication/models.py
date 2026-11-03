from django.conf import settings
from django.db import models


class ChatConversation(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_conversations",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="store_conversations",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("customer", "store"),)
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Chat {self.customer_id}-{self.store_id}"


class ChatMessage(models.Model):
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    text = models.TextField(max_length=1500, blank=True)
    attachment_image = models.FileField(
        upload_to="chat_attachments/", blank=True, null=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg {self.id} in {self.conversation_id}"


class Notification(models.Model):
    TYPE_CHOICES = (
        ("NEW_ORDER", "Novo pedido"),
        ("NEW_MESSAGE", "Nova mensagem"),
        ("CANCEL_REQUEST", "Solicitação de cancelamento"),
        ("RETURN_REQUEST", "Solicitação de devolução"),
        ("NEW_REVIEW", "Nova avaliação"),
        ("LOW_STOCK", "Estoque baixo"),
        ("ORDER_SHIPPED", "Pedido enviado"),
        ("ORDER_DELIVERED", "Pedido entregue"),
        ("ORDER_UPDATE", "Atualização de pedido"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    target_url = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notif {self.id} - {self.title}"
