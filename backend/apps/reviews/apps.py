from django.apps import AppConfig


class ReviewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'  # type: ignore
    name = 'apps.reviews'
    verbose_name = 'Avaliações'
