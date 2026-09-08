import re

from rest_framework import serializers

from .models import Store


class StorePublicSerializer(serializers.ModelSerializer):

    class Meta:
        model = Store
        fields = ["id", "name", "logo_url", "cover_url", "is_active", "vacation_mode"]


class StoreOwnerSerializer(serializers.ModelSerializer):



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
            "is_official",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_official", "created_at", "updated_at"]

    def validate_cnpj(self, value: str) -> str:
        digits = re.sub(r"\D", "", value)

        if len(digits) != 14:
            raise serializers.ValidationError(
                "CNPJ inválido — deve conter 14 dígitos numéricos."
            )


        qs = Store.objects.filter(cnpj=digits)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "Este CNPJ já está cadastrado na plataforma."
            )


        return digits
