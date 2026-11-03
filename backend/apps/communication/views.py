from django.db.models import Q
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.stores.models import Store

from .models import ChatConversation, ChatMessage, Notification
from .serializers import (
    ChatConversationSerializer,
    ChatMessageSerializer,
    NotificationSerializer,
)

MAX_CONSECUTIVE_MESSAGES = 10


def get_user_store(user):
    """Retorna a loja do usuário autenticado (lojista/marca), se existir."""
    if not user or not getattr(user, "is_authenticated", False):
        return None

    if hasattr(user, "stores"):
        store = user.stores.first()
        if store:
            return store

    return Store.objects.filter(owner=user).first()


def notification_queryset(user):
    """Notificações visíveis para o usuário, respeitando o isolamento por loja."""
    store = get_user_store(user)
    if store:
        return Notification.objects.filter(
            Q(user=user) | Q(store=store)
        ).distinct()

    return Notification.objects.filter(user=user)


def get_conversation_for_user(user, pk):
    conversation = (
        ChatConversation.objects.select_related("customer", "store", "order")
        .filter(pk=pk)
        .first()
    )
    if not conversation:
        return None, Response(
            {"detail": "Conversa não encontrada"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if conversation.customer_id == user.id:
        return conversation, None

    store = get_user_store(user)
    if store and conversation.store_id == store.id:
        return conversation, None

    return None, Response(
        {"detail": "Não autorizado"},
        status=status.HTTP_403_FORBIDDEN,
    )


class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ChatListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        store = get_user_store(user)

        if store:
            queryset = ChatConversation.objects.filter(store=store)
        else:
            queryset = ChatConversation.objects.filter(customer=user)

        queryset = queryset.select_related("customer", "store", "order")
        serializer = ChatConversationSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        store_id = request.data.get("store_id") or request.data.get("store")
        order_id = request.data.get("order_id") or request.data.get("order")

        if not store_id:
            return Response(
                {"detail": "store_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        store = Store.objects.filter(id=store_id).first()
        if not store:
            return Response(
                {"detail": "Loja não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        order = None
        if order_id:
            order = Order.objects.filter(pk=order_id).first()
            if not order:
                return Response(
                    {"order_id": "Pedido não encontrado"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if order.user_id != user.id or order.store_id != store.id:
                return Response(
                    {"order_id": "Pedido não pertence a este cliente/loja"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        conversation, _ = ChatConversation.objects.get_or_create(
            customer=user,
            store=store,
            defaults={"order_id": order.id if order else None},
        )

        if order and conversation.order_id != order.id:
            conversation.order_id = order.id
            conversation.save(update_fields=["order_id", "updated_at"])

        serializer = ChatConversationSerializer(
            conversation, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        conversation, error = get_conversation_for_user(user, pk)
        if error:
            return error

        queryset = conversation.messages.select_related("sender").order_by(
            "created_at"
        )

        since_id = request.query_params.get("since_id")
        if since_id is not None:
            try:
                queryset = queryset.filter(id__gt=int(since_id))
            except (TypeError, ValueError):
                return Response(
                    {"since_id": "Valor inválido"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # RN-04 / CA-03: ao abrir a conversa, mensagens recebidas viram lidas.
        conversation.messages.exclude(sender=user).filter(is_read=False).update(
            is_read=True
        )

        paginator = MessagePagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = ChatMessageSerializer(
            page, many=True, context={"request": request}
        )
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, pk):
        user = request.user
        conversation, error = get_conversation_for_user(user, pk)
        if error:
            return error

        serializer = ChatMessageSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        recent_messages = list(
            conversation.messages.order_by("-created_at")[:MAX_CONSECUTIVE_MESSAGES]
        )
        if (
            len(recent_messages) >= MAX_CONSECUTIVE_MESSAGES
            and all(message.sender_id == user.id for message in recent_messages)
        ):
            return Response(
                {"detail": "Limite de mensagens consecutivas atingido."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        message = serializer.save(conversation=conversation, sender=user)
        conversation.save(update_fields=["updated_at"])

        from .services import notify_store, notify_user

        if conversation.customer_id == user.id:
            notify_store(
                conversation.store,
                "Nova mensagem",
                f"{user.first_name or 'Cliente'} enviou uma mensagem",
                "NEW_MESSAGE",
                f"/store/messages?chat={conversation.id}",
            )
        else:
            notify_user(
                conversation.customer,
                "Nova mensagem",
                f"{conversation.store.name} respondeu sua mensagem",
                "NEW_MESSAGE",
                f"/(shop)/chat/{conversation.id}",
            )

        output = ChatMessageSerializer(message, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)


class ChatMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        conversation, error = get_conversation_for_user(user, pk)
        if error:
            return error

        conversation.messages.exclude(sender=user).filter(is_read=False).update(
            is_read=True
        )
        return Response({"detail": "Marcado como lido"})


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = notification_queryset(user).order_by("-created_at")

        is_read = request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")

        unread_count = notification_queryset(user).filter(is_read=False).count()

        paginator = NotificationPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = NotificationSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data["unread_count"] = unread_count
        return response


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        notification = notification_queryset(user).filter(pk=pk).first()
        if not notification:
            return Response(
                {"detail": "Notificação não encontrada"},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        notification_queryset(user).filter(is_read=False).update(is_read=True)
        return Response({"detail": "Todas marcadas como lidas"})
