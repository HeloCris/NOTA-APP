from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('stores', '0006_store_slug'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='shipping_handling_days',
            field=models.PositiveIntegerField(
                default=1,
                verbose_name='Prazo de Preparação / Despacho (dias úteis)',
            ),
        ),
        migrations.AddField(
            model_name='store',
            name='free_shipping_threshold',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                verbose_name='Valor Mínimo para Frete Grátis (R$)',
            ),
        ),
    ]
