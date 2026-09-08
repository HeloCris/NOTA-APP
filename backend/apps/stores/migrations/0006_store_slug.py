from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0005_store_is_official"),
    ]

    operations = [
        migrations.AddField(
            model_name="store",
            name="slug",
            field=models.SlugField(blank=True, max_length=220, unique=True),
        ),
    ]
