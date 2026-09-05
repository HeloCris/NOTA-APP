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

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
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


class UserSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = fields

    def get_store_id(self, obj):
        if obj.role != CustomUser.Roles.SELLER:
            return None

        stores_manager = getattr(obj, "stores", None)

        if stores_manager is None:
            return None

        store = stores_manager.first()

        return store.id if store else None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "Credenciais inválidas.",
    }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["user_id"] = user.id
        token["email"] = user.email
        token["role"] = user.role

        if user.role == CustomUser.Roles.SELLER:
            stores_manager = getattr(user, "stores", None)

            store = (
                stores_manager.first()
                if stores_manager is not None
                else None
            )

            token["store_id"] = store.id if store else None

        return token

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except serializers.ValidationError:
            raise serializers.ValidationError(
                {
                    "detail": "Credenciais inválidas.",
                }
            )