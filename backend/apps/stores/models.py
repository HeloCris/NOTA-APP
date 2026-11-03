from django.conf import settings  # type: ignore
from django.db import models  # type: ignore
from django.utils.text import slugify


class Store(models.Model):

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stores",
        verbose_name="Proprietário",
    )

    name = models.CharField(
        max_length=200,
        verbose_name="Nome Fantasia",
    )

    slug = models.SlugField(max_length=220, unique=True, blank=True)

    legal_name = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Razão Social",
    )

    cnpj = models.CharField(
        max_length=14,
        unique=True,
        verbose_name="CNPJ",
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name="Telefone",
    )

    postal_code = models.CharField(
        max_length=9,
        blank=True,
        default="",
        verbose_name="CEP de Origem",
    )

    street = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Logradouro / Rua",
    )

    number = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Número",
    )

    complement = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Complemento",
    )

    neighborhood = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Bairro",
    )

    city = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Cidade",
    )

    state = models.CharField(
        max_length=2,
        blank=True,
        default="",
        verbose_name="Estado (UF)",
    )

    bio = models.TextField(
        blank=True,
        default="",
        verbose_name="Bio Olfativa",
    )

    logo_url = models.TextField(
        blank=True,
        default="",
        verbose_name="URL da Logo",
    )

    cover_url = models.TextField(
        blank=True,
        default="",
        verbose_name="URL da Capa",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Loja Ativa",
    )

    is_official = models.BooleanField(
        default=False,
        verbose_name="Loja Oficial",
    )

    vacation_mode = models.BooleanField(
        default=False,
        verbose_name="Modo Férias",
    )

    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Visualizações da loja",
    )

    # Configurações de Frete Regional (RF-10)
    shipping_local_pac = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Frete PAC Estadual / Local (R$)",
    )

    shipping_local_sedex = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Frete SEDEX Estadual / Local (R$)",
    )

    shipping_pac_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Frete PAC Nacional (R$)",
    )

    shipping_sedex_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Frete SEDEX Nacional (R$)",
    )

    shipping_handling_days = models.PositiveIntegerField(
        default=1,
        verbose_name="Prazo de Preparação / Despacho (dias úteis)",
    )

    free_shipping_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Valor Mínimo para Frete Grátis (R$)",
    )

    # Ferramentas Comerciais e Fidelização (RF-19)
    max_installments = models.PositiveSmallIntegerField(
        default=6,
        verbose_name="Máximo de Parcelas Aceitas",
    )
    free_interest_installments = models.PositiveSmallIntegerField(
        default=3,
        verbose_name="Parcelas sem Juros Assumidas pela Loja",
    )
    min_installment_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=30.00,
        verbose_name="Valor Mínimo de Cada Parcela (R$)",
    )
    followers_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Total de Seguidores",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    @property
    def has_complete_address(self) -> bool:
        """Verifica se a loja possui endereço completo de postagem cadastrado."""
        return bool(
            self.postal_code
            and self.street
            and self.number
            and self.neighborhood
            and self.city
            and self.state
        )

    @property
    def has_shipping_configured(self) -> bool:
        """Verifica se a loja definiu os valores base de frete."""
        return (self.shipping_pac_price is not None or self.shipping_local_pac is not None) and (
            self.shipping_sedex_price is not None or self.shipping_local_sedex is not None
        )

    @property
    def is_ready_to_sell(self) -> bool:
        """
        Para uma loja aparecer na vitrine e receber pedidos,
        deve estar ativa, com endereço de origem e tarifas de frete configuradas.
        """
        return bool(self.is_active and self.has_complete_address and self.has_shipping_configured)  # pyrefly: ignore[unnecessary-type-conversion]

    class Meta:
        db_table = "stores"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["owner"], name="stores_owner_idx"),
        ]
        verbose_name = "Loja"
        verbose_name_plural = "Lojas"

    def __str__(self) -> str:
        return f"{self.name} (CNPJ: {self.cnpj})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or f"loja-{self.pk or 'nova'}"
            candidate = base_slug
            suffix = 2
            while type(self).objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{suffix}"
                suffix += 1
            self.slug = candidate  # type: ignore[assignment]
        return super().save(*args, **kwargs)


from .models_coupon import StoreCoupon, StoreFollower

__all__ = ["Store", "StoreCoupon", "StoreFollower"]

