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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

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
            self.slug = candidate
        return super().save(*args, **kwargs)
