from typing import TYPE_CHECKING, ClassVar

from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from .managers import CustomUserManager

if TYPE_CHECKING:
    from apps.stores.models import Store
    from django.db.models import Manager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        SELLER = "SELLER", "Loja (Não Oficial)"
        CUSTOMER = "CUSTOMER", "Cliente"
        BRAND_OWNER = "BRAND_OWNER", "Loja Oficial"

    email = models.EmailField(
        unique=True,
        max_length=255,
    )

    first_name = models.CharField(
        max_length=150,
    )

    last_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.CUSTOMER,
    )

    is_active = models.BooleanField(default=True)  # type: ignore

    is_staff = models.BooleanField(
        default=False,
    )


    olfactory_families = models.JSONField(
        default=list,
        blank=True,
    )

    preferred_notes = models.JSONField(
        default=list,
        blank=True,
    )

    objects: ClassVar[CustomUserManager] = CustomUserManager()  # type: ignore[assignment]

    id: int
    # Related names declarados em outros apps (apenas para tipagem)
    if TYPE_CHECKING:
        brands: "Manager"
        stores: "Manager[Store]"
        addresses: "Manager[UserAddress]"

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        db_table = "users"
        ordering = ["id"]

    def __str__(self):
        return self.email


class UserAddress(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    tag = models.CharField(
        max_length=50,
        default="Casa",
        help_text="Identificador como Casa, Trabalho, etc.",
    )
    recipient_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="Nome do destinatário",
    )
    street = models.CharField(max_length=255)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=100, blank=True, default="")
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    postal_code = models.CharField(max_length=9)
    phone = models.CharField(max_length=30, blank=True, default="")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_addresses"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.tag} - {self.street}, {self.number} ({self.city}/{self.state})"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Garante que apenas um endereço seja padrão por usuário
            UserAddress.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)