from django.db import models

from apps.catalog.models import Product
from apps.stores.models import Store


class StoreProduct(models.Model):

    store = models.ForeignKey(
        Store,
        on_delete=models.PROTECT,
        related_name="store_products",
        db_index=True,
        verbose_name="Loja",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="store_products",
        verbose_name="Produto",
    )

    volume_ml = models.PositiveIntegerField(verbose_name="Volume (ml)")

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Preço",
    )

    promotional_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Preço Promocional",
    )

    stock_quantity = models.PositiveIntegerField(
        default=0,
        verbose_name="Quantidade em Estoque",
    )

    is_available = models.BooleanField(
        default=True,
        verbose_name="Disponível",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        db_table = "inventory_store_products"
        ordering = ["product__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["store", "product", "volume_ml"],
                name="inventory_store_product_volume_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=["store", "product"],
                name="inventory_store_product_idx",
            ),
        ]
        verbose_name = "Produto da Loja"
        verbose_name_plural = "Produtos da Loja"

    def __str__(self) -> str:
        return f"{self.store.name} — {self.product} ({self.volume_ml}ml)"