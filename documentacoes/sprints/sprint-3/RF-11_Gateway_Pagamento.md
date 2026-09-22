# RF-11 — Gateway de Pagamento e Transação (PIX / Cartão)

> **Sprint:** 3  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 8 SP  
> **Depende de:** RF-10

---

## Descrição

Processamento financeiro do pedido. Suporta pagamento via PIX (com geração de QR Code/copia-e-cola simulado) e Cartão de Crédito.

Comunica-se com o backend para criação da transação, baixa de estoque atômica e emissão do pedido com status `PENDING` → `PAID`.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-11.1** | Rota `src/app/(shop)/checkout/payment.tsx` — escolha da forma de pagamento (PIX ou Cartão de Crédito). |
| **RF-11.2** | Aba **Cartão de Crédito**: inputs para `card_number`, `card_holder`, `expiration_date` e `cvv`. |
| **RF-11.3** | Aba **PIX**: gera payload copia-e-cola e imagem de QR Code placeholder, com botão simulador **"Simular Pagamento PIX Aprovado"**. |
| **RF-11.4** | **[Backend — Novo Model]** Model `Order` (`user`, `store`, `status` [`PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`], `total_amount`, `shipping_cost`, `shipping_address`, `tracking_code`, `carrier`, `created_at`, `updated_at`) e `OrderItem` (`order`, `store_product`, `quantity`, `unit_price`). Criar migration. |
| **RF-11.5** | **[Backend — Novo Endpoint]** `POST /api/v1/orders/` — valida estoque atual dos itens (`stock_quantity >= quantity`), cria `Order` e `OrderItem` transacionalmente (`atomic`), subtrai estoque e retorna `order_id` e dados de pagamento. |
| **RF-11.6** | **[Backend — Novo Endpoint]** `POST /api/v1/payments/process/` — processa o pagamento da order (`order_id`, `payment_method`) e atualiza `Order.status = 'PAID'`. |
| **RF-11.7** | Tratamento de erro de concorrência/estoque esgotado no checkout: se o estoque zerar entre o carrinho e o `POST` de order, retornar `400` com lista de itens esgotados. |

> [!WARNING]
> Nunca armazenar dados sensíveis de cartão de crédito (CVV ou número completo) no banco de dados da plataforma ou em logs do Django.

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Submissão de PIX gera payload de pagamento e altera o status para `PAID` ao simular a aprovação. |
| **CA-02** | Submissão de Cartão com dados válidos faz `POST /orders/` e `POST /payments/process/`, retornando `200/201` e mantendo a order com status `PAID`. |
| **CA-03** | Tentativa de compra com item sem estoque suficiente retorna `400 Bad Request`, com mensagem indicando o produto esgotado. |
| **CA-04** | Pagamento recusado (mock de cartão inválido) mantém o status como pendente/falha e exibe feedback visual na tela. |

---

## Testes (TDD)

### Backend

Arquivo: `apps/orders/tests/test_checkout_payment.py`

- `POST /api/v1/orders/` com estoque válido → cria a order e baixa o estoque.
- `POST /api/v1/orders/` com estoque insuficiente → retorna `400` e mantém o estoque intacto.
- `POST /api/v1/payments/process/` → atualiza o status da order para `PAID`.

### Mobile

Arquivo: `__tests__/PaymentScreen.test.tsx`

- Alterna entre as abas **PIX** e **Cartão** corretamente.
- O preenchimento dos dados do cartão e a confirmação disparam os services de pedido e pagamento.
- Exibe a tela de confirmação de pedido bem-sucedido com o número do pedido.

---

## Wireframe — Tela de Pagamento

```text
┌─────────────────────────────────────────┐
│ <  Pagamento                            │
├─────────────────────────────────────────┤
│ Total a pagar: R$ 374,90                │
├─────────────────────────────────────────┤
│ [ 💳 Cartão de Crédito ]  [ ⚡ PIX ]    │
├─────────────────────────────────────────┤
│ Número do Cartão: [ 4532 •••• •••• 1234]│
│ Validade: [ 12/28 ]   CVV: [ 321 ]      │
│ Nome: [ JOÃO DA SILVA                  ]│
├─────────────────────────────────────────┤
│ [ Confirmar Pagamento ✓ ]               │
└─────────────────────────────────────────┘
```

---

## Arquivos

**Backend:**
- `apps/orders/models.py` — **[NOVO]** `Order`, `OrderItem`.
- `apps/orders/serializers.py` — **[NOVO]** Serializers de order e pagamento.
- `apps/orders/views.py` — **[NOVO]** Views de criação de pedido e processamento de pagamento.
- `apps/orders/urls.py` — **[NOVO]** Rotas de orders.
- `apps/orders/migrations/0001_initial.py` — **[NOVO]**
- `config/urls.py` — **[MODIFY]** Incluir `apps.orders.urls`.

**Mobile:**
- `src/app/(shop)/checkout/payment.tsx` — **[NOVO]** Tela de pagamento.
- `src/components/checkout/CreditCardForm.tsx` — **[NOVO]** Form de cartão.
- `src/components/checkout/PixView.tsx` — **[NOVO]** View de PIX.
- `src/services/orders.ts` — **[NOVO]** Integração com API de pedidos/pagamentos.

---

## Dependências

**Backend:** nenhuma nova  
**Mobile:** nenhuma nova

---

## Referências

- [RF-10](./RF-10_Checkout_Endereco.md) — Precedente de dados do pedido
- [RF-04](../../sprint-1/RF-04_Gestao_Estoque_Precificacao_Lojista.md) — Controle de estoque (`stock_quantity`)