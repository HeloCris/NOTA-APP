from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.users.models import CustomUser


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

        if user.role == CustomUser.Roles.BRAND_OWNER:
            brands_manager = getattr(user, "brands", None)
            brand = brands_manager.first() if brands_manager is not None else None

            if brand:
                token["brand_id"] = brand.id
                if brand.d2c_store_id:
                    token["store_id"] = brand.d2c_store_id
            else:
                token["brand_id"] = None
                token["store_id"] = None

        return token

    def validate(self, attrs):
        from rest_framework.exceptions import AuthenticationFailed

        email = attrs.get("email") or attrs.get(self.username_field)


        user = CustomUser.objects.filter(email=email).first()
        if user and not user.is_active:
            has_pending = user.brands.filter(status="PENDING").exists()
            has_rejected = user.brands.filter(status="REJECTED").exists()

            if has_pending:
                raise AuthenticationFailed("Sua solicitação ainda não foi aceita, aguarde.")
            elif has_rejected:
                raise AuthenticationFailed("Sua solicitação de marca foi rejeitada.")
            else:
                raise AuthenticationFailed("Sua conta ainda não foi ativada. Aguarde a aprovação.")

        try:
            return super().validate(attrs)
        except AuthenticationFailed:
            raise
        except Exception:
            raise AuthenticationFailed("Credenciais inválidas.")
