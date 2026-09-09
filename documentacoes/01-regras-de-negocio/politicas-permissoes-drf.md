# Políticas de Permissão — Django REST Framework

Este documento especifica as `Permission Classes` customizadas que serão utilizadas no projeto NŌTA para garantir o isolamento de dados multi-tenant e o controle de acesso por papel (role-based access control).

---

## 1. Estrutura dos Claims do JWT (Payload)

O token JWT emitido pelo backend contém as seguintes informações no payload (`claims`). A customização é feita sobrescrevendo `TokenObtainPairSerializer` do `djangorestframework-simplejwt`.

### Payload Padrão (todos os usuários)

```json
{
  "token_type": "access",
  "exp": 1756591200,
  "iat": 1756504800,
  "jti": "unique-token-id-uuid",
  "user_id": 1,
  "email": "joao@email.com",
  "role": "CUSTOMER"
}
```

### Payload Estendido (Lojista — role `SELLER`)

Quando o usuário possui role `SELLER`, o `store_id` é injetado no token, eliminando a necessidade de uma query extra para identificar o tenant em cada request:

```json
{
  "token_type": "access",
  "exp": 1756591200,
  "iat": 1756504800,
  "jti": "unique-token-id-uuid",
  "user_id": 2,
  "email": "loja@nota.com",
  "role": "SELLER",
  "store_id": 5
}
```

### Payload Estendido (Dono de Marca — role `BRAND_OWNER`)

Quando o usuário é `BRAND_OWNER`, o `brand_id` é injetado no token. Se o D2C estiver ativo, o `store_id` da Loja Oficial também é incluído:

```json
{
  "token_type": "access",
  "exp": 1756591200,
  "iat": 1756504800,
  "jti": "unique-token-id-uuid",
  "user_id": 3,
  "email": "marca@dior.com",
  "role": "BRAND_OWNER",
  "brand_id": 2,
  "store_id": 10
}
```

---

### Implementação do Serializer Customizado

```python
# apps/auth/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Claims customizados
        token["email"] = user.email
        token["role"] = user.role

        if user.role == "SELLER":
            # Assume que cada SELLER tem uma Store associada (1:1 ou 1:N)
            store = user.stores.first()
            token["store_id"] = store.id if store else None

        if user.role == "BRAND_OWNER":
            # Injeta brand_id e, se D2C ativo, o store_id da Loja Oficial
            brand = user.owned_brands.first()
            token["brand_id"] = brand.id if brand else None
            if brand and brand.d2c_store:
                token["store_id"] = brand.d2c_store.id

        return token
```

---

## 2. Permission Classes Customizadas

Todas as classes ficam em `apps/core/permissions.py`.

### 2.1 `IsPlatformAdmin`

Concede acesso irrestrito apenas a usuários com `role == "ADMIN"`. Utilizada em endpoints de gestão da plataforma (aprovação de lojas, gestão do catálogo global, painel de usuários).

```python
# apps/core/permissions.py
from rest_framework.permissions import BasePermission

class IsPlatformAdmin(BasePermission):
    """
    Permite acesso somente a Admins da plataforma.
    """
    message = "Acesso restrito a administradores da plataforma."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
```

**Uso típico:**
```python
# apps/stores/views.py
class StoreApprovalView(UpdateAPIView):
    permission_classes = [IsPlatformAdmin]
```

---

### 2.2 `IsStoreOwner`

Garante que o lojista (`SELLER`) visualize e edite **apenas** dados associados à sua própria `Store`. Esta é a classe mais crítica para o isolamento multi-tenant.

A verificação ocorre em dois níveis:
- **`has_permission`:** Valida se o usuário autenticado é um `SELLER`.
- **`has_object_permission`:** Valida se o objeto alvo (ex.: `Order`, `StoreProduct`) pertence à loja do lojista.

```python
class IsStoreOwner(BasePermission):
    """
    Permite acesso somente ao lojista dono da store associada ao recurso.
    O store_id é lido diretamente do JWT payload para evitar queries extras.
    """
    message = "Você não tem permissão para acessar dados de outra loja."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "SELLER"
        )

    def has_object_permission(self, request, view, obj):
        # O objeto pode ser um Order, StoreProduct, etc.
        # Todos devem ter um atributo `store_id` para a verificação.
        user_store_id = request.auth.get("store_id")  # Lido do JWT

        if hasattr(obj, "store_id"):
            return obj.store_id == user_store_id
        if hasattr(obj, "store"):
            return obj.store.id == user_store_id
        return False
```

**Padrão de QuerySet nos ViewSets (Isolamento a nível de listagem):**

Para garantir que a listagem (`GET /store-products/`) nunca vaze dados de outros tenants, o QuerySet é filtrado na própria view:

```python
class StoreProductViewSet(ModelViewSet):
    permission_classes = [IsStoreOwner]

    def get_queryset(self):
        # Isola o queryset pelo store_id do JWT, não apenas pela permissão de objeto
        store_id = self.request.auth.get("store_id")
        return StoreProduct.objects.filter(store_id=store_id)
```

---

### 2.4 `IsBrandOwner`

Garante que o dono de marca (`BRAND_OWNER`) acesse **apenas** produtos e dados associados à sua própria `Brand`. Bloqueia acesso ao portfólio de outras marcas.

```python
class IsBrandOwner(BasePermission):
    """
    Permite acesso somente ao BRAND_OWNER e apenas para recursos
    associados à sua própria Brand.
    """
    message = "Você não tem permissão para gerenciar produtos de outra marca."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "BRAND_OWNER"
        )

    def has_object_permission(self, request, view, obj):
        brand_id = request.auth.get("brand_id")  # Lido do JWT
        if hasattr(obj, "brand_id"):
            return obj.brand_id == brand_id
        if hasattr(obj, "brand"):
            return obj.brand.id == brand_id
        return False
```

**Padrão de QuerySet (isolamento de portfólio):**

```python
class BrandProductViewSet(ModelViewSet):
    permission_classes = [IsBrandOwner]

    def get_queryset(self):
        brand_id = self.request.auth.get("brand_id")
        return Product.objects.filter(brand_id=brand_id)
```

> [!IMPORTANT]
> Quando `BRAND_OWNER` também tem D2C ativo (`store_id` presente no JWT), as views de `StoreProduct`, `Order` e estoque devem aceitar `IsBrandOwner | IsStoreOwner` — usando composição de permissões do DRF (`|` operator).

---

### 2.3 `IsCustomerOwner`

Garante que o cliente (`CUSTOMER`) acesse **apenas seus próprios** pedidos, endereços e dados pessoais.

```python
class IsCustomerOwner(BasePermission):
    """
    Permite acesso somente ao cliente dono do recurso (pedido, endereço, etc).
    """
    message = "Você não tem permissão para acessar dados de outro cliente."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "CUSTOMER"
        )

    def has_object_permission(self, request, view, obj):
        # O objeto deve ter um campo `customer` ou `user` apontando para o usuário.
        if hasattr(obj, "customer_id"):
            return obj.customer_id == request.user.id
        if hasattr(obj, "user_id"):
            return obj.user_id == request.user.id
        return False
```

**Padrão de QuerySet nos ViewSets:**

```python
class OrderViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return Order.objects.all()
        elif user.role == "SELLER":
            store_id = self.request.auth.get("store_id")
            return Order.objects.filter(store_id=store_id)
        else:  # CUSTOMER
            return Order.objects.filter(customer_id=user.id)
```

---

## 3. Tabela Resumo — Permissão por Endpoint

| Endpoint | Método | `IsPlatformAdmin` | `IsBrandOwner` | `IsStoreOwner` | `IsCustomerOwner` | `AllowAny` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `/auth/register/` | POST | — | — | — | — | ✅ |
| `/auth/token/` | POST | — | — | — | — | ✅ |
| `/brands/` | GET | — | — | — | — | ✅ |
| `/brands/` | POST | ✅ | — | — | — | — |
| `/brands/me/` | GET, PATCH | — | ✅ | — | — | — |
| `/brands/me/products/` | GET, POST | — | ✅ | — | — | — |
| `/brands/me/products/{id}/` | PATCH, DELETE | — | ✅ | — | — | — |
| `/brands/me/activate-d2c/` | POST | — | ✅ | — | — | — |
| `/stores/` | GET | — | — | — | — | ✅ |
| `/stores/me/` | GET, PATCH | — | ✅¹ | ✅ | — | — |
| `/products/` | GET | — | — | — | — | ✅ |
| `/products/` | POST | ✅ | ✅ | — | — | — |
| `/store-products/` | GET, POST | — | ✅¹ | ✅ | — | — |
| `/store-products/{id}/` | PATCH, DELETE | — | ✅¹ | ✅ | — | — |
| `/orders/` | POST | — | — | — | ✅ | — |
| `/orders/` | GET | ✅ | ✅¹ | ✅ | ✅ | — |
| `/orders/{id}/` | GET | ✅ | ✅¹ | ✅ | ✅ | — |
| `/orders/{id}/status/` | PATCH | — | ✅¹ | ✅ | — | — |
| `/admin/stores/approve/{id}/` | PATCH | ✅ | — | — | — | — |
| `/admin/brands/approve/{id}/` | PATCH | ✅ | — | — | — | — |

> ¹ Aplicável apenas quando o `BRAND_OWNER` possui D2C ativo (`store_id` presente no JWT).

---

## 4. Configuração Global no `settings.py`

```python
# config/settings.py

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        # Padrão seguro: todas as rotas exigem autenticação, salvo override explícito.
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "TOKEN_OBTAIN_SERIALIZER": "apps.auth.serializers.CustomTokenObtainPairSerializer",
}
```
