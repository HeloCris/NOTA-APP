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
PAID → PROCESSING → SHIPPED → DELIVERED
```
> Qualquer retrocesso ou salto inválido de estado retorna `400 Bad Request`. Transições de cancelamento, contestação e devolução usam endpoints dedicados (ver seção **Pós-Compra — RF-15** abaixo). A grafia padrão é `PROCESSING` (e não `PREPARING`) e `CANCELLED`.

- **Request:**
```json
{
  "status": "PROCESSING"
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
  "status": "PROCESSING",
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

---

## Pós-Compra — RF-15

Regras completas em [RF-15](../sprints/sprint-4/RF-15_Gestao_Pos_Compra.md). Toda ação registra um `OrderStatusHistory`. Transições inválidas retornam `400`; pedido de outro usuário/loja retorna `404`.

### Cliente (`IsAuthenticated` + dono do pedido)

| Método | Endpoint | Status aceitos | Body | Resultado |
|---|---|---|---|---|
| `POST` | `/api/v1/orders/{id}/cancel/` | `PENDING`, `PAID`, `PROCESSING` | `reason`, `description?` | `CANCELLED` (direto) ou `CANCEL_REQUESTED` (em `PROCESSING`) |
| `PATCH` | `/api/v1/orders/{id}/address/` | até `PROCESSING` | `address_id` ou endereço completo | Atualiza `shipping_address`, `address_changed=true`. Outra cidade/UF → `400` |
| `POST` | `/api/v1/orders/{id}/confirm-delivery/` | `SHIPPED` | — | `DELIVERED` (`delivery_confirmed_by=CUSTOMER`) |
| `POST` | `/api/v1/orders/{id}/dispute-delivery/` | `DELIVERED` por `SELLER` há ≤ 7 dias | `description` | `DELIVERY_DISPUTED` |
| `POST` | `/api/v1/orders/{id}/returns/` | `DELIVERED` há ≤ 7 dias | multipart: `items[{order_item, quantity}]`, `reason`, `description?`, `photos[] (≤3)` | Cria `ReturnRequest` (`REQUESTED`) |
| `PATCH` | `/api/v1/orders/returns/{id}/` | `APPROVED` | `return_tracking_code` | Informa rastreio da devolução (opcional) |

### Loja (`IsSeller` / Loja Oficial — dono da loja do pedido)

| Método | Endpoint | Status aceitos | Body | Resultado |
|---|---|---|---|---|
| `GET` | `/api/v1/store/orders/{id}/` | qualquer | — | Detalhe com itens, endereço, rastreio, histórico e devoluções |
| `POST` | `/api/v1/store/orders/{id}/cancel/` | `PAID`, `PROCESSING` | `reason`, `description?` | `CANCELLED` |
| `POST` | `/api/v1/store/orders/{id}/cancel-request/approve/` | `CANCEL_REQUESTED` | — | `CANCELLED` (estoque devolvido) |
| `POST` | `/api/v1/store/orders/{id}/cancel-request/reject/` | `CANCEL_REQUESTED` | `reason` | `PROCESSING` |
| `POST` | `/api/v1/store/orders/{id}/mark-delivered/` | `SHIPPED` | — | `DELIVERED` (`delivery_confirmed_by=SELLER`) |
| `POST` | `/api/v1/store/orders/{id}/dispute/reship/` | `DELIVERY_DISPUTED` | `tracking_code?`, `carrier?` | `SHIPPED` |
| `POST` | `/api/v1/store/orders/{id}/dispute/refund/` | `DELIVERY_DISPUTED` | — | `REFUNDED` |
| `POST` | `/api/v1/store/returns/{id}/approve/` | `REQUESTED` | — | `APPROVED` |
| `POST` | `/api/v1/store/returns/{id}/reject/` | `REQUESTED` | `reason` | `REJECTED` |
| `POST` | `/api/v1/store/returns/{id}/receive/` | `APPROVED` | `resellable` (bool) | `RECEIVED` → `REFUNDED` (estoque devolvido se `resellable`) |

### Rotinas automáticas (`python manage.py process_order_deadlines`)

- `SHIPPED` há > 30 dias → `DELIVERED` (`SYSTEM`).
- `CANCEL_REQUESTED` há > 48h → `CANCELLED` (`SYSTEM`).
- `ReturnRequest.REQUESTED` há > 48h → `APPROVED` (`SYSTEM`).

---

## Avaliações — RF-16

Regras completas em [RF-16](../sprints/sprint-4/RF-16_Avaliacoes.md). Avaliações com `is_hidden` ou `is_deleted` nunca são retornadas nem contam nas médias.

### Cliente (`IsAuthenticated` + dono do item)

| Método | Endpoint | Body | Regras |
|---|---|---|---|
| `POST` | `/api/v1/reviews/` | multipart: `order_item`, `rating` (1–5), `comment?`, `photos[] (≤3)` | Pedido `DELIVERED` há ≤ 30 dias; 1 por item; item sem devolução não recusada |
| `PATCH` | `/api/v1/reviews/{id}/` | `rating?`, `comment?`, `photos[]?` | Edição única (`edited_at` nulo) e ≤ 30 dias; senão `400` |
| `DELETE` | `/api/v1/reviews/{id}/` | — | Exclusão lógica; não permite nova avaliação do item |

### Público

| Método | Endpoint | Query params |
|---|---|---|
| `GET` | `/api/v1/stores/{id}/reviews/` | `product`, `rating`, `with_photos`, `ordering` (`-created_at`, `created_at`, `-rating`, `rating`) |
| `GET` | `/api/v1/stores/{id}/products/{product_id}/reviews/` | `rating`, `with_photos`, `ordering` |

- **Response `200 OK`:**
```json
{
  "summary": { "average": 4.7, "count": 128, "distribution": { "5": 98, "4": 20, "3": 6, "2": 2, "1": 2 } },
  "results": [
    {
      "id": 10,
      "author_name": "Maria S.",
      "rating": 5,
      "comment": "Chegou super bem embalado...",
      "product": { "id": 3, "name": "Sauvage" },
      "volume_ml": 100,
      "photos": ["https://.../r1.jpg"],
      "edited": true,
      "created_at": "2026-10-12T14:00:00Z",
      "reply": { "text": "Obrigado, Maria!", "updated_at": "2026-10-13T10:00:00Z" }
    }
  ]
}
```

### Loja (`IsSeller` / Loja Oficial)

| Método | Endpoint | Body / Query | Regras |
|---|---|---|---|
| `GET` | `/api/v1/store/reviews/` | `product`, `rating`, `with_photos`, `unanswered`, `ordering` | Somente avaliações da própria loja |
| `PUT` | `/api/v1/store/reviews/{id}/reply/` | `text` | Cria ou edita a resposta; outra loja → `404` |

---

## Dashboard e Visualizações da Loja — RF-17

Regras completas em [RF-17](../sprints/sprint-4/RF-17_Dashboard_Sincronizacao_Estoque.md).

### Público / Mobile

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/stores/{id}/view/` | Incrementa atomicamente o contador `views_count` da loja ao abrir a tela no mobile. |

### Lojista / Loja Oficial (`IsSeller` ou `IsBrandOwner` com D2C)

| Método | Endpoint | Query params | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/store/dashboard/` | `period=7d|30d` | Retorna KPIs financeiros e operacionais reais calculados para a loja no período. |

- **Response `200 OK`:**
```json
{
  "period": "7d",
  "kpis": {
    "revenue_gross": 4500.00,
    "revenue_net": 3950.00,
    "platform_fee": 450.00,
    "refunds": 100.00,
    "average_ticket": 225.00,
    "pending_orders": 3,
    "stock_alerts": 2,
    "store_views": 142,
    "total_stock_value": 28450.00,
    "cancellation_rate": 3.2,
    "return_rate": 1.1
  },
  "sales_chart": [
    { "date": "18/10", "day_label": "Seg", "value": 450.00 },
    { "date": "19/10", "day_label": "Ter", "value": 890.00 },
    { "date": "20/10", "day_label": "Qua", "value": 120.00 },
    { "date": "21/10", "day_label": "Qui", "value": 650.00 },
    { "date": "22/10", "day_label": "Sex", "value": 900.00 },
    { "date": "23/10", "day_label": "Sáb", "value": 1100.00 },
    { "date": "24/10", "day_label": "Dom", "value": 390.00 }
  ],
  "recent_orders": [
    {
      "id": 105,
      "date": "24/10/2026 14:30",
      "client": "João Silva",
      "fragrance": "Sauvage (EDP)",
      "volume": "100ml",
      "value": "R$ 450,00",
      "status": "PROCESSING",
      "status_label": "Em Separação"
    }
  ],
  "restock_alerts": [
    {
      "store_product_id": 42,
      "name": "Acqua di Gio",
      "volume": "50ml",
      "current_stock": 1
    }
  ]
}
```

---

## Mensageria e Notificações — RF-18

Regras completas em [RF-18](../sprints/sprint-4/RF-18_Mensageria_Notificacoes.md).

### Chat (Cliente e Loja)

| Método | Endpoint | Body / Query | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/chats/` | — | Lista conversas do usuário autenticado (ou da sua loja). |
| `POST` | `/api/v1/chats/` | `store_id`, `order_id?` | Inicia ou recupera conversa existente. |
| `GET` | `/api/v1/chats/{id}/messages/` | `since_id?` (para polling) | Histórico de mensagens da conversa. |
| `POST` | `/api/v1/chats/{id}/messages/` | multipart: `text?`, `attachment_image?` | Envio de nova mensagem com texto e foto opcional. |
| `POST` | `/api/v1/chats/{id}/read/` | — | Marca mensagens recebidas como lidas. |

### Central de Notificações

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/notifications/` | Retorna notificações do usuário/loja com contador `unread_count`. |
| `PATCH` | `/api/v1/notifications/{id}/read/` | Marca notificação específica como lida. |
| `POST` | `/api/v1/notifications/read-all/` | Marca todas as notificações pendentes como lidas. |

---

## Ferramentas Comerciais e Fidelização — RF-19

Regras completas em [RF-19](../sprints/sprint-4/RF-19_Comercial_Fidelizacao.md).

### Cupons da Loja (Lojista / Marca)

| Método | Endpoint | Body | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/store/coupons/` | — | Lista cupons criados pela loja autenticada. |
| `POST` | `/api/v1/store/coupons/` | `code`, `discount_type`, `discount_value`, `min_purchase_amount?`, `usage_limit?`, `valid_until?` | Criação de cupom próprio da loja. |
| `PATCH` | `/api/v1/store/coupons/{id}/` | `is_active?`, `usage_limit?`, `valid_until?` | Atualiza status ou validade do cupom. |

### Configuração de Parcelamento (Lojista / Marca)

| Método | Endpoint | Body | Descrição |
|---|---|---|---|
| `PATCH` | `/api/v1/store/settings/installments/` | `max_installments`, `free_interest_installments`, `min_installment_amount` | Define os parâmetros de parcelamento no cartão para a loja. |

### Cliente / Mobile (Checkout e Seguir Lojas)

| Método | Endpoint | Body | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/checkout/validate-coupon/` | `store_id`, `code`, `subtotal` | Valida código e calcula desconto aplicado à respectiva loja no carrinho. |
| `POST` | `/api/v1/stores/{id}/follow/` | — | Alterna (toggle) seguir/deixar de seguir a loja. |
| `GET` | `/api/v1/customers/following-stores/` | — | Lista lojas seguidas pelo consumidor logado. |
