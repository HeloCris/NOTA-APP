

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='olfactory_families',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='customuser',
            name='preferred_notes',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
