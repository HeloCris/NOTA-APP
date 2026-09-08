from rest_framework import serializers
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)

from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False,
    )

    email = serializers.EmailField(
        validators=[],
    )


    olfactory_families = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    preferred_notes = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "olfactory_families",
            "preferred_notes",
        ]

    def validate_email(self, value):
        email = value.strip().lower()

        if CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Este e-mail já está em uso."
            )

        return email

    def create(self, validated_data):
        password = validated_data.pop("password")

        return CustomUser.objects.create_user(
            password=password,
            role=CustomUser.Roles.CUSTOMER,
            **validated_data,
        )

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "email": instance.email,
            "first_name": instance.first_name,
            "role": instance.role,
        }


class MeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[],
    )
    store_id = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "store_id",
            "olfactory_families",
            "preferred_notes",
        ]
        read_only_fields = ["id", "role", "store_id"]

    def validate_email(self, value):
        email = value.strip().lower()

        queryset = CustomUser.objects.filter(email__iexact=email)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Este e-mail já está em uso."
            )

        return email

    def get_store_id(self, obj):
        if obj.role != CustomUser.Roles.SELLER:
            return None

        stores_manager = getattr(obj, "stores", None)

        if stores_manager is None:
            return None

        store = stores_manager.first()

        return store.id if store else None

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.role == CustomUser.Roles.CUSTOMER:
            data.pop("store_id", None)
        else:
            data.pop("olfactory_families", None)
            data.pop("preferred_notes", None)

        return data


from .token_serializer import CustomTokenObtainPairSerializer


class OlfactoryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "olfactory_families",
            "preferred_notes"
        ]

    def validate_olfactory_families(self, value):
        valid_families = [
            "Amadeirado",
            "Cítrico",
            "Oriental",
            "Floral",
            "Fougère",
            "Aquático",
            "Gourmand"
        ]

        for family in value:
            if family not in valid_families:
                raise serializers.ValidationError(f"Família olfativa '{family}' inválida.")

        return value