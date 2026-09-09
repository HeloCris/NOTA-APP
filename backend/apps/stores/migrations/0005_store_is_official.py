

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0004_store_vacation_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='is_official',
            field=models.BooleanField(default=False, verbose_name='Loja Oficial'),
        ),
    ]
