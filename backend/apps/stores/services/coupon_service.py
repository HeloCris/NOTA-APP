import logging
from decimal import Decimal
from django.utils import timezone
from apps.stores.models import StoreCoupon

logger = logging.getLogger(__name__)


def notify_store_followers_new_coupon(coupon: StoreCoupon):
    """
    Dispara notificação para todos os clientes que seguem a loja (RF-18 / RN-09).
    Integrado com a central de mensageria da Sprint 4 (apps.communication).
    """
    store = coupon.store
    followers = store.followers.select_related("user")
    discount_display = (
        f"{coupon.discount_value:.0f}%"
        if coupon.discount_type == StoreCoupon.DISCOUNT_TYPE_PERCENTAGE
        else f"R$ {coupon.discount_value:.2f}"
    )
    title = f"Novo cupom em {store.name}!"
    message = (
        f"A loja {store.name} acabou de lançar o cupom {coupon.code} "
        f"de {discount_display} OFF! Aproveite."
    )

    try:
        from apps.communication.services import notify_user
    except ImportError:
        notify_user = None

    count = 0
    for follower in followers:
        if notify_user and follower.user:
            try:
                notify_user(
                    user=follower.user,
                    title=title,
                    message=message,
                    type_="NEW_ORDER",
                    target_url=f"/store/{store.id}",
                )
            except Exception as e:
                logger.warning(f"Erro ao disparar notificação de cupom para {follower.user_id}: {e}")
        logger.info(f"[NOTIFICAÇÃO RF-18/RF-19] Para: {follower.user.email} | Mensagem: {message}")
        count += 1

    return count


def validate_and_calculate_coupon_discount(store_id: int, code: str, subtotal: Decimal):
    """
    Valida um cupom para a loja e calcula o desconto aplicável (RN-01, RN-02, RN-03).
    Retorna dict com status, mensagem de erro se houver e valores calculados.
    """
    clean_code = (code or "").strip().upper()
    if not clean_code:
        return {"valid": False, "error": "Código do cupom não informado."}

    try:
        coupon = StoreCoupon.objects.get(store_id=store_id, code=clean_code)
    except StoreCoupon.DoesNotExist:
        return {"valid": False, "error": "Cupom inválido para esta loja."}

    if not coupon.is_active:
        return {"valid": False, "error": "Este cupom está inativo."}

    if coupon.valid_until and coupon.valid_until < timezone.now():
        return {"valid": False, "error": "Este cupom já expirou."}

    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        return {"valid": False, "error": "O limite de utilizações deste cupom foi atingido."}

    subtotal_dec = Decimal(str(subtotal))
    if subtotal_dec < coupon.min_purchase_amount:
        return {
            "valid": False,
            "error": f"O valor mínimo para utilizar este cupom é de R$ {coupon.min_purchase_amount:.2f}."
        }

    # Cálculo do desconto
    if coupon.discount_type == StoreCoupon.DISCOUNT_TYPE_PERCENTAGE:
        applied_discount = (subtotal_dec * (coupon.discount_value / Decimal("100"))).quantize(Decimal("0.01"))
        # Desconto não pode exceder o subtotal
        if applied_discount > subtotal_dec:
            applied_discount = subtotal_dec
    else:
        applied_discount = min(coupon.discount_value, subtotal_dec)

    new_subtotal = max(Decimal("0.00"), subtotal_dec - applied_discount)

    return {
        "valid": True,
        "coupon_id": coupon.id,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": str(coupon.discount_value),
        "applied_discount": str(applied_discount),
        "new_subtotal": str(new_subtotal),
    }
