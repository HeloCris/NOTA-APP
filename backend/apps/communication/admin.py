from django.contrib import admin

from .models import ChatConversation, ChatMessage, Notification


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "store", "order", "updated_at")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "is_read", "created_at")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "store", "title", "type", "is_read", "created_at")
