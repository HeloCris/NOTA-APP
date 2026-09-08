from django.conf import settings
from django.db import models


class Brand(models.Model):
    class BrandStatus(models.TextChoices):
        PENDING = "PENDING", "Pendente"
        APPROVED = "APPROVED", "Aprovada"
        REJECTED = "REJECTED", "Rejeitada"

    name = models.CharField(max_length=150, unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="brands",
    )
    cnpj = models.CharField(max_length=14, unique=True, null=True)
    inpi_registration = models.CharField(max_length=50, null=True)
    status = models.CharField(
        max_length=20,
        choices=BrandStatus.choices,
        default=BrandStatus.PENDING,
    )
    social_contract = models.FileField(upload_to="brands/documents/", null=True, blank=True)
    inpi_certificate = models.FileField(upload_to="brands/documents/", null=True, blank=True)
    is_official = models.BooleanField(default=False)
    d2c_store = models.OneToOneField(
        "stores.Store",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="official_brand",
    )

    objects = models.Manager()

    class Meta:
        db_table = "catalog_brands"
        ordering = ["name"]

    def __str__(self) -> str:
        return str(self.name)


class Product(models.Model):
    class OlfactoryFamily(models.TextChoices):
        WOODY = "Amadeirado", "Amadeirado"
        CITRUS = "Cítrico", "Cítrico"
        ORIENTAL = "Oriental", "Oriental"
        FLORAL = "Floral", "Floral"
        FOUGERE = "Fougère", "Fougère"
        AQUATIC = "Aquático", "Aquático"
        GOURMAND = "Gourmand", "Gourmand"

    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=200)
    ean = models.CharField(max_length=13, unique=True, null=True, blank=True)
    anvisa_code = models.CharField(max_length=30, unique=True, null=True, blank=True)
    olfactory_family = models.CharField(max_length=30, choices=OlfactoryFamily.choices)
    top_notes = models.JSONField(default=list)
    heart_notes = models.JSONField(default=list)
    base_notes = models.JSONField(default=list)
    description = models.TextField(blank=True, default="")
    image_url = models.URLField(blank=True, default="")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        db_table = "catalog_products"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["brand", "name"], name="catalog_product_brand_name_uniq"),
        ]

    def __str__(self) -> str:
        return f"{self.brand.name} {self.name}"