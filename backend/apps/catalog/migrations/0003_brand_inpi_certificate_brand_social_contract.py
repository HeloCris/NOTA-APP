

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_brand_cnpj_brand_d2c_store_brand_inpi_registration_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='brand',
            name='inpi_certificate',
            field=models.FileField(blank=True, null=True, upload_to='brands/documents/'),
        ),
        migrations.AddField(
            model_name='brand',
            name='social_contract',
            field=models.FileField(blank=True, null=True, upload_to='brands/documents/'),
        ),
    ]
