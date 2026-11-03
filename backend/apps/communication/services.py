from .models import Notification

LOW_STOCK_THRESHOLD = 3


def notify_store(store, title, message, type_, target_url=""):
    if not store:
        return None
    return Notification.objects.create(
        store=store,
        user=None,
        title=title[:150],
        message=message,
        type=type_,
        target_url=target_url or None,
    )


def notify_user(user, title, message, type_, target_url=""):
    if not user:
        return None
    return Notification.objects.create(
        store=None,
        user=user,
        title=title[:150],
        message=message,
        type=type_,
        target_url=target_url or None,
    )


def notify_low_stock(store_product, previous_quantity=None):
    """Dispara LOW_STOCK quando o produto cruza o limite de 3 unidades."""
    if store_product.stock_quantity >= LOW_STOCK_THRESHOLD:
        return None

    if (
        previous_quantity is not None
        and previous_quantity < LOW_STOCK_THRESHOLD
    ):
        return None

    product_name = getattr(store_product.product, "name", "Perfume")
    return notify_store(
        store_product.store,
        "Estoque baixo",
        (
            f"{product_name} ({store_product.volume_ml}ml) atingiu "
            f"{store_product.stock_quantity} unidades."
        ),
        "LOW_STOCK",
        "/store/inventory",
    )
