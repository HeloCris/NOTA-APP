# Especificação da API REST — NŌTA

Todos os endpoints são prefixados por `/api/v1/`. As requisições e respostas utilizam `Content-Type: application/json`. Rotas protegidas exigem o header:

```
Authorization: Bearer <access_token>
```

---

## 1. Auth — Autenticação e Identidade

### `POST /api/v1/auth/register/`
Cadastro de novo usuário (Cliente B2C).

- **Permissão:** Pública (`AllowAny`)
- **Request:**
```json
{
  "email": "joao@email.com",
  "password": "senha_segura_123",
  "first_name": "João",
  "last_name": "Silva",
  "phone": "11999990000"
}
```
- **Response `201 Created`:**
```json
{
  "id": 1,
  "email": "joao@email.com",
  "first_name": "João",
  "role": "CUSTOMER"
}
```
- **Response `400 Bad Request`** — campo inválido ou e-mail já cadastrado:
```json
{
  "email": ["Este e-mail já está em uso."]
}
```

---

### `POST /api/v1/auth/token/`
Login — obtém par de tokens JWT.

- **Permissão:** Pública (`AllowAny`)
- **Request:**
```json
{
  "email": "joao@email.com",
  "password": "senha_segura_123"
}
```
- **Response `200 OK`:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```
- **Response `401 Unauthorized`:**
```json
{
  "detail": "Credenciais inválidas."
}
```

---

### `POST /api/v1/auth/token/refresh/`
Renova o `access_token` usando o `refresh_token`.

- **Permissão:** Pública (`AllowAny`)
- **Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```
- **Response `200 OK`:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5...<novo_token>"
}
```
- **Response `401 Unauthorized`** — token expirado ou inválido:
```json
{
  "detail": "Token inválido ou expirado.",
  "code": "token_not_valid"
}
```

---

### `GET /api/v1/auth/me/`
Retorna os dados do usuário autenticado.

- **Permissão:** `IsAuthenticated`
- **Response `200 OK` (Cliente):**
```json
{
  "id": 1,
  "email": "joao@email.com",
  "first_name": "João",
  "last_name": "Silva",
  "phone": "11999990000",
  "role": "CUSTOMER"
}
```
- **Response `200 OK` (Lojista — inclui `store_id`):**
```json
{
  "id": 2,
  "email": "loja@nota.com",
  "role": "SELLER",
  "store_id": 5
}
```

---

## 2. Stores — Lojas

### `GET /api/v1/stores/`
Listagem pública de lojas ativas no marketplace.

- **Permissão:** Pública (`AllowAny`)
- **Query Params:** `?search=<nome_da_loja>`
- **Response `200 OK`:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 5,
      "name": "Essência & Arte",
      "logo_url": "https://cdn.nota.com/lojas/essencia-arte.png",
      "status": "ACTIVE"
    }
  ]
}
```

---

### `GET /api/v1/stores/{id}/`
Detalhes públicos de uma loja específica.

- **Permissão:** Pública (`AllowAny`)
- **Response `200 OK`:**
```json
{
  "id": 5,
  "name": "Essência & Arte",
  "logo_url": "https://cdn.nota.com/lojas/essencia-arte.png",
  "status": "ACTIVE"
}
```
- **Response `404 Not Found`**

---

### `GET /api/v1/stores/me/`
Retorna o perfil completo da loja do lojista autenticado.

- **Permissão:** `IsStoreOwner`
- **Response `200 OK`:**
```json
{
  "id": 5,
  "name": "Essência & Arte",
  "cnpj": "12.345.678/0001-99",
  "status": "ACTIVE",
  "logo_url": "https://cdn.nota.com/lojas/essencia-arte.png",
  "owner_id": 2
}
```

---

### `PATCH /api/v1/stores/me/`
Atualiza dados da loja do lojista autenticado (edição parcial).

- **Permissão:** `IsStoreOwner`
- **Request:**
```json
{
  "name": "Essência & Arte Premium",
  "logo_url": "https://cdn.nota.com/lojas/nova-logo.png"
}
```
- **Response `200 OK`:** Objeto `Store` atualizado.
- **Response `403 Forbidden`** — usuário não é `SELLER`.

---

## 3. Products — Catálogo Global

### `GET /api/v1/products/`
Listagem do catálogo global com suporte a filtros olfativos avançados.

- **Permissão:** Pública (`AllowAny`)
- **Query Params:**

| Parâmetro | Tipo | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| `search` | string | `?search=Sauvage` | Busca textual por nome |
| `brand` | int (ID) | `?brand=3` | Filtra por marca |
| `olfactory_family` | string | `?olfactory_family=Amadeirado` | Filtra por família |
| `top_notes` | string | `?top_notes=Bergamota` | Filtra por nota de saída |
| `heart_notes` | string | `?heart_notes=Jasmim` | Filtra por nota de corpo |
| `base_notes` | string | `?base_notes=Baunilha` | Filtra por nota de fundo |
| `page` | int | `?page=2` | Paginação |

- **Response `200 OK`:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 10,
      "name": "Sauvage",
      "brand": { "id": 3, "name": "Dior" },
      "olfactory_family": "Amadeirado",
      "top_notes": ["Bergamota", "Pimenta"],
      "heart_notes": ["Lavanda", "Vetiver"],
      "base_notes": ["Ambroxan", "Cedro"],
      "image_url": "https://cdn.nota.com/products/sauvage.png"
    }
  ]
}
```

---

### `GET /api/v1/products/{id}/`
Detalhes completos de um produto do catálogo global.

- **Permissão:** Pública (`AllowAny`)
- **Response `200 OK`:** Objeto `Product` completo (mesmo formato acima).
- **Response `404 Not Found`**

---

## 4. StoreProducts — Estoque da Loja

### `GET /api/v1/store-products/`
Lista os produtos do estoque da loja do lojista autenticado.

- **Permissão:** `IsStoreOwner`
- **Query Params:** `?is_active=true`, `?search=<nome>`
- **Response `200 OK`:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 88,
      "product": { "id": 10, "name": "Sauvage", "brand": "Dior" },
      "price": "349.90",
      "stock": 15,
      "is_active": true
    }
  ]
}
```

---

### `POST /api/v1/store-products/`
Adiciona um produto do catálogo global ao estoque da loja.

- **Permissão:** `IsStoreOwner`
- **Request:**
```json
{
  "product_id": 10,
  "price": "349.90",
  "stock": 15,
  "is_active": true
}
```
- **Response `201 Created`:** Objeto `StoreProduct` criado.
- **Response `400 Bad Request`** — produto já vinculado a esta loja:
```json
{
  "detail": "Este produto já está no seu estoque."
}
```

---

### `PATCH /api/v1/store-products/{id}/`
Atualiza preço, estoque ou status de visibilidade de um StoreProduct.

- **Permissão:** `IsStoreOwner` (valida que o StoreProduct pertence à loja do usuário)
- **Request:**
```json
{
  "price": "329.90",
  "stock": 8,
  "is_active": false
}
```
- **Response `200 OK`:** Objeto `StoreProduct` atualizado.
- **Response `403 Forbidden`** — tentativa de editar StoreProduct de outra loja.
- **Response `404 Not Found`**

---

### `DELETE /api/v1/store-products/{id}/`
Remove um produto do estoque da loja.

- **Permissão:** `IsStoreOwner`
- **Response `204 No Content`**
- **Response `403 Forbidden`**

---

## 5. Orders — Pedidos

### `POST /api/v1/orders/`
Cliente cria um novo pedido. O sistema valida estoque e cria um `Order` por loja presente no carrinho.

- **Permissão:** `IsAuthenticated` (role `CUSTOMER`)
- **Request:**
```json
{
  "items": [
    { "store_product_id": 88, "quantity": 1 },
    { "store_product_id": 91, "quantity": 2 }
  ],
  "shipping_address": {
    "street": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01310-100"
  }
}
```
- **Response `201 Created`:**
```json
{
  "orders_created": [
    {
      "id": 201,
      "store": { "id": 5, "name": "Essência & Arte" },
      "status": "PENDING",
      "total_amount": "349.90",
      "items": [
        {
          "product_name": "Sauvage",
          "quantity": 1,
          "unit_price": "349.90"
        }
      ]
    }
  ]
}
```
- **Response `400 Bad Request`** — estoque insuficiente:
```json
{
  "detail": "Estoque insuficiente para o produto 'Sauvage'. Disponível: 0."
}
```

---

### `GET /api/v1/orders/`
Listagem de pedidos. O resultado é filtrado automaticamente pelo perfil do usuário.

- **Permissão:** `IsAuthenticated`
- **Comportamento por role:**
  - `CUSTOMER`: Retorna apenas os pedidos do próprio cliente.
  - `SELLER`: Retorna apenas os pedidos direcionados à sua loja.
  - `ADMIN`: Retorna todos os pedidos.
- **Query Params:** `?status=PENDING`, `?status=SHIPPED`, `?ordering=-created_at`
- **Response `200 OK`:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 201,
      "status": "PENDING",
      "total_amount": "349.90",
      "created_at": "2026-08-30T16:00:00Z",
      "store": { "id": 5, "name": "Essência & Arte" }
    }
  ]
}
```

---

### `GET /api/v1/orders/{id}/`
Detalhe de um pedido específico.

- **Permissão:** `IsAuthenticated` + `IsCustomerOwner` **ou** `IsStoreOwner` do pedido
- **Response `200 OK`:**
```json
{
  "id": 201,
  "status": "PENDING",
  "total_amount": "349.90",
  "created_at": "2026-08-30T16:00:00Z",
  "store": { "id": 5, "name": "Essência & Arte" },
  "customer": { "id": 1, "email": "joao@email.com" },
  "items": [
    {
      "id": 301,
      "product_name": "Sauvage",
      "quantity": 1,
      "unit_price": "349.90"
    }
  ]
}
```
- **Response `403 Forbidden`** — pedido não pertence ao usuário ou à sua loja.
- **Response `404 Not Found`**

---

### `PATCH /api/v1/orders/{id}/status/`
Lojista atualiza o status do pedido. Apenas avanços válidos na máquina de estados são aceitos.

- **Permissão:** `IsStoreOwner` (dono da loja do pedido)
- **Máquina de Estados:**

```
PENDING → PREPARING → SHIPPED → DELIVERED
```
> Qualquer retrocesso ou salto inválido de estado retorna `400 Bad Request`.

- **Request:**
```json
{
  "status": "PREPARING"
}
```
- **Request (quando status = `SHIPPED`, tracking obrigatório):**
```json
{
  "status": "SHIPPED",
  "tracking_code": "BR123456789BR"
}
```
- **Response `200 OK`:**
```json
{
  "id": 201,
  "status": "PREPARING",
  "updated_at": "2026-08-30T17:00:00Z"
}
```
- **Response `400 Bad Request`** — transição inválida:
```json
{
  "detail": "Transição de status inválida: DELIVERED → PENDING não é permitida."
}
```
- **Response `403 Forbidden`** — lojista tentando alterar pedido de outra loja.
