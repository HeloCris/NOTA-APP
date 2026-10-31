from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0010_store_shipping_local_pac_store_shipping_local_sedex_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="store",
            name="views_count",
            field=models.PositiveIntegerField(default=0, verbose_name="Visualizações da loja"),
        ),
    ]
