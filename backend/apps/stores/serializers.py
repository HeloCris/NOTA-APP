import re

from rest_framework import serializers

from .models import Store


class StorePublicSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem pública de lojas no marketplace.
    Expõe apenas campos seguros para consumo não autenticado.
    """

    class Meta:
        model = Store
        fields = ["id", "name", "logo_url", "cover_url", "is_active", "vacation_mode"]


class StoreOwnerSerializer(serializers.ModelSerializer):
    """
    Serializer completo para o lojista autenticado.
    Usado em GET /stores/me/ e PATCH /stores/me/.
    Inclui validação de formato e unicidade de CNPJ.
    """

    # max_length=18 aceita tanto dígitos puros quanto formato com máscara
    # (ex: "12.345.678/0001-99"). O validate_cnpj sanitiza antes de persistir.
    cnpj = serializers.CharField(max_length=18)

    class Meta:
        model = Store
        fields = [
            "id",
            "name",
            "legal_name",
            "cnpj",
            "phone",
            "bio",
            "logo_url",
            "cover_url",
            "is_active",
            "vacation_mode",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_cnpj(self, value: str) -> str:
        """
        Sanitiza (remove pontuação) e valida o CNPJ.
        Garante unicidade excluindo a instância atual no caso de PATCH.
        """
        digits = re.sub(r"\D", "", value)

        if len(digits) != 14:
            raise serializers.ValidationError(
                "CNPJ inválido — deve conter 14 dígitos numéricos."
            )

        # Verifica unicidade, excluindo a própria loja em caso de atualização
        qs = Store.objects.filter(cnpj=digits)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "Este CNPJ já está cadastrado na plataforma."
            )

        # Persiste apenas dígitos (formato limpo)
        return digits
