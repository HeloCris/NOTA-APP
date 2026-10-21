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
            and request.user.role in ["SELLER", "CUSTOMER", "BRAND_OWNER"]
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


class IsBrandOwner(BasePermission):
    message = "Acesso restrito a proprietários de marcas oficiais (BRAND_OWNER)."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "BRAND_OWNER"
        )


def get_user_store_id(request):
    auth = getattr(request, "auth", None)
    if auth is not None and hasattr(auth, "get"):
        store_id = auth.get("store_id")
        if store_id:
            return store_id

    user = getattr(request, "user", None)
    if user is not None and user.is_authenticated:
        from apps.stores.models import Store
        from apps.catalog.models import Brand

        store = Store.objects.filter(owner=user).first()
        if store:
            return store.id

        official_store_id = (
            Brand.objects
            .filter(owner=user, d2c_store__isnull=False)
            .values_list("d2c_store_id", flat=True)
            .first()
        )
        if official_store_id:
            return official_store_id

    return None


class IsSeller(BasePermission):
    message = "Você não tem permissão para acessar pedidos de outra loja."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("SELLER", "BRAND_OWNER")
        )

    def has_object_permission(self, request, view, obj):
        user_store_id = get_user_store_id(request)

        if user_store_id is None:
            return False

        if hasattr(obj, "store_id"):
            return obj.store_id == user_store_id

        if hasattr(obj, "store"):
            return obj.store.id == user_store_id

        return False