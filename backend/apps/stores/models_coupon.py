from decimal import Decimal
from django.conf import settings
from django.db import models


class StoreFollower(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="followers",
        verbose_name="Loja",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following_stores",
        verbose_name="Usuário",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Seguindo desde",
    )

    objects = models.Manager()

    class Meta:
        db_table = "store_followers"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["store", "user"], name="store_user_follow_uniq")
        ]
        verbose_name = "Seguidor da Loja"
        verbose_name_plural = "Seguidores da Loja"

    def __str__(self) -> str:
        store_name = getattr(self.store, "name", str(self.store_id))
        return f"{self.user} segue {store_name}"


class StoreCoupon(models.Model):
    DISCOUNT_TYPE_PERCENTAGE = "PERCENTAGE"
    DISCOUNT_TYPE_FIXED = "FIXED_VALUE"
    DISCOUNT_TYPE_CHOICES = [
        (DISCOUNT_TYPE_PERCENTAGE, "Porcentagem"),
        (DISCOUNT_TYPE_FIXED, "Valor Fixo"),
    ]

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="coupons",
        verbose_name="Loja",
    )
    code = models.CharField(
        max_length=30,
        verbose_name="Código do Cupom",
    )
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default=DISCOUNT_TYPE_PERCENTAGE,
        verbose_name="Tipo de Desconto",
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor do Desconto",
    )
    min_purchase_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name="Valor Mínimo da Compra (R$)",
    )
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Limite Global de Usos",
    )
    used_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Quantidade de Usos Realizados",
    )
    valid_until = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Válido Até",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Cupom Ativo",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Criado em",
    )

    objects = models.Manager()

    class Meta:
        db_table = "store_coupons"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["store", "code"],
                name="store_coupon_code_uniq",
            )
        ]
        verbose_name = "Cupom da Loja"
        verbose_name_plural = "Cupons da Loja"

    def clean(self):
        if self.code:
            self.code = self.code.upper().strip()

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        store_name = getattr(self.store, "name", str(self.store_id))
        return f"{self.code} ({store_name})"
