from django.urls import path

from . import views

urlpatterns = [
    path("chats/", views.ChatListCreateView.as_view(), name="chat-list-create"),
    path("chats/<int:pk>/messages/", views.ChatMessageListCreateView.as_view(), name="chat-messages"),
    path("chats/<int:pk>/read/", views.ChatMarkReadView.as_view(), name="chat-mark-read"),
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/read/", views.NotificationMarkReadView.as_view(), name="notification-mark-read"),
    path("notifications/read-all/", views.NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),
]
