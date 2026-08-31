from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    message = (
        "Acesso restrito a administradores da plataforma."
    )

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsStoreOwner(BasePermission):
    message = (
        "Você não tem permissão para acessar dados de outra loja."
    )

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["SELLER", "CUSTOMER"]
        )

    def has_object_permission(self, request, view, obj):
        user_store_id = request.auth.get("store_id")

        if hasattr(obj, "store_id"):
            return obj.store_id == user_store_id

        if hasattr(obj, "store"):
            return obj.store.id == user_store_id

        return False


class IsCustomerOwner(BasePermission):
    message = (
        "Você não tem permissão para acessar dados de outro cliente."
    )

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "customer_id"):
            return obj.customer_id == request.user.id

        if hasattr(obj, "user_id"):
            return obj.user_id == request.user.id

        return False