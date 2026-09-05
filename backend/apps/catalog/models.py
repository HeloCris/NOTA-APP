from django.db import models


class Brand(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        db_table = "catalog_brands"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


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
    olfactory_family = models.CharField(max_length=30, choices=OlfactoryFamily.choices)
    top_notes = models.JSONField(default=list)
    heart_notes = models.JSONField(default=list)
    base_notes = models.JSONField(default=list)
    description = models.TextField(blank=True, default="")
    image_url = models.URLField(blank=True, default="")
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_products"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["brand", "name"], name="catalog_product_brand_name_uniq"),
        ]

    def __str__(self) -> str:
        return f"{self.brand.name} {self.name}"