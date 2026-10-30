from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    """
    Avaliação de um item comprado (OrderItem) de acordo com RF-16.
    1 avaliação por OrderItem (mesmo após exclusão lógica RN-08).
    """
    order_item = models.OneToOneField(
        'orders.OrderItem',
        on_delete=models.CASCADE,
        related_name='review',
        verbose_name='Item do Pedido',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Cliente Autor',
    )
    store = models.ForeignKey(
        'stores.Store',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Loja Avaliada',
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Perfume Avaliado',
    )
    store_product = models.ForeignKey(
        'inventory.StoreProduct',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Oferta Comprada',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Nota (1-5)',
    )
    comment = models.TextField(
        max_length=1000,
        blank=True,
        default='',
        verbose_name='Comentário',
    )
    edited_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Data da Edição',
    )
    is_hidden = models.BooleanField(
        default=False,
        verbose_name='Oculto por Devolução',
    )
    is_deleted = models.BooleanField(
        default=False,
        verbose_name='Exclusão Lógica',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data de Criação',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Atualização',
    )

    objects = models.Manager()

    class Meta:
        verbose_name = 'Avaliação'
        verbose_name_plural = 'Avaliações'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['store', 'is_hidden', 'is_deleted']),
            models.Index(fields=['store', 'product', 'is_hidden', 'is_deleted']),
        ]

    def __str__(self):
        return f'Review {self.pk} - {self.rating}★ by {self.user}'

    @property
    def is_edited(self):
        return self.edited_at is not None

    @property
    def author_display_name(self):
        """
        Formata o nome do autor como "Primeiro Nome + Inicial do Sobrenome" (RN-12).
        Ex: 'Maria Silva' -> 'Maria S.'
        """
        first_name = (self.user.first_name or '').strip()
        last_name = (self.user.last_name or '').strip()
        if first_name and last_name:
            return f'{first_name} {last_name[0].upper()}.'
        elif first_name:
            return first_name
        elif last_name:
            return last_name
        # Fallback para o email
        identifier = self.user.email.split('@')[0] if self.user.email else 'Cliente'
        parts = identifier.replace('.', ' ').replace('_', ' ').split()
        if len(parts) >= 2:
            return f'{parts[0].capitalize()} {parts[1][0].upper()}.'
        return parts[0].capitalize() if parts else 'Cliente N.'


class ReviewPhoto(models.Model):
    """
    Fotos da avaliação (até 3 fotos por avaliação - RN-06).
    """
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='Avaliação',
    )
    image = models.ImageField(
        upload_to='reviews/photos/%Y/%m/',
        verbose_name='Foto da Avaliação',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data de Envio',
    )

    objects = models.Manager()

    class Meta:
        verbose_name = 'Foto da Avaliação'
        verbose_name_plural = 'Fotos das Avaliações'
        ordering = ['id']

    def __str__(self):
        return f'Photo {self.pk} of Review {self.review.pk}'


class ReviewReply(models.Model):
    """
    Resposta pública da loja à avaliação (1 resposta por avaliação - RN-09).
    """
    review = models.OneToOneField(
        Review,
        on_delete=models.CASCADE,
        related_name='reply',
        verbose_name='Avaliação Respondida',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_replies',
        verbose_name='Autor da Resposta',
    )
    text = models.TextField(
        max_length=1000,
        verbose_name='Texto da Resposta',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data da Resposta',
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Edição',
    )

    objects = models.Manager()

    class Meta:
        verbose_name = 'Resposta da Loja'
        verbose_name_plural = 'Respostas das Lojas'
        ordering = ['created_at']

    def __str__(self):
        return f'Reply to Review {self.review.pk}'
