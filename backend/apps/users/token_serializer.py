from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Injeta claims customizados no payload do JWT:
    - `email` — identificação legível do usuário
    - `role`  — perfil do usuário (ADMIN, SELLER, CUSTOMER)
    - `store_id` — ID da primeira loja do lojista (apenas para role == SELLER)

    O `store_id` no token elimina queries extras para identificar
    o tenant em cada request protegido por IsStoreOwner.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Claims padrão para todos os perfis
        token["email"] = user.email
        token["role"] = user.role

        # Claim exclusivo para lojistas
        if user.role == "SELLER":
            store = user.stores.first()
            token["store_id"] = store.id if store else None

        return token
