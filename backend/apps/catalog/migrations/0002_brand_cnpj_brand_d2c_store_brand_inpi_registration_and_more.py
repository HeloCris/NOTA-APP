

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
        ('stores', '0005_store_is_official'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='brand',
            name='cnpj',
            field=models.CharField(max_length=14, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='brand',
            name='d2c_store',
            field=models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='official_brand', to='stores.store'),
        ),
        migrations.AddField(
            model_name='brand',
            name='inpi_registration',
            field=models.CharField(max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='brand',
            name='is_official',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='brand',
            name='owner',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='brands', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='brand',
            name='status',
            field=models.CharField(choices=[('PENDING', 'Pendente'), ('APPROVED', 'Aprovada'), ('REJECTED', 'Rejeitada')], default='PENDING', max_length=20),
        ),
        migrations.AddField(
            model_name='product',
            name='anvisa_code',
            field=models.CharField(blank=True, max_length=30, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='product',
            name='ean',
            field=models.CharField(blank=True, max_length=13, null=True, unique=True),
        ),
    ]
