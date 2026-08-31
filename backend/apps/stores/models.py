from django.conf import settings
from django.db import models


class Store(models.Model):
    """
    Representa uma loja/tenant no marketplace NŌTA.
    Um usuário SELLER pode ter múltiplas lojas (filiais),
    mas no MVP os endpoints operam sobre stores.first().
    """

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

    legal_name = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Razão Social",
    )

    cnpj = models.CharField(
        max_length=14,  # Armazenado somente dígitos (sanitizado no serializer)
        unique=True,
        verbose_name="CNPJ",
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name="Telefone",
    )

    bio = models.TextField(
        blank=True,
        default="",
        verbose_name="Bio Olfativa",
    )

    logo_url = models.URLField(
        blank=True,
        default="",
        verbose_name="URL da Logo",
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Loja Ativa",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
