from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Brand",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150, unique=True)),
            ],
            options={"db_table": "catalog_brands", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("olfactory_family", models.CharField(choices=[("Amadeirado", "Amadeirado"), ("Cítrico", "Cítrico"), ("Oriental", "Oriental"), ("Floral", "Floral"), ("Fougère", "Fougère"), ("Aquático", "Aquático"), ("Gourmand", "Gourmand")], max_length=30)),
                ("top_notes", models.JSONField(default=list)),
                ("heart_notes", models.JSONField(default=list)),
                ("base_notes", models.JSONField(default=list)),
                ("description", models.TextField(blank=True, default="")),
                ("image_url", models.URLField(blank=True, default="")),
                ("is_approved", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("brand", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.brand")),
            ],
            options={"db_table": "catalog_products", "ordering": ["name"]},
        ),
        migrations.AddConstraint(model_name="product", constraint=models.UniqueConstraint(fields=("brand", "name"), name="catalog_product_brand_name_uniq")),
    ]