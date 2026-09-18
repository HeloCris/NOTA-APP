# RF-12 — Processamento de Pedidos pelo Lojista

> **Sprint:** 3  
> **Prioridade:** 🟡 Média  
> **Estimativa:** 5 SP  
> **Depende de:** RF-11

---

## Descrição

Painel do lojista (Web/Mobile gestor) para visualização e gerenciamento dos pedidos recebidos de sua loja.

O lojista visualiza detalhes do cliente/endereço, itens comprados e pode alterar o status do pedido para `PROCESSING` (preparando/separando mercadoria).

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-12.1** | Rota `/store/orders` (Web Lojista) — listagem de pedidos da loja autenticada com filtros por status (`ALL`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). |
| **RF-12.2** | Card/detalhe do pedido — exibe `order_id`, data/hora, nome do cliente, itens da compra, valor total e endereço de entrega. |
| **RF-12.3** | **[Backend — Novo Endpoint]** `GET /api/v1/store/orders/` — lista pedidos filtrados por `store_id` do lojista autenticado. Permissão: `IsSeller`. |
| **RF-12.4** | **[Backend — Novo Endpoint]** `PATCH /api/v1/store/orders/{id}/status/` — transiciona o status do pedido. Transição permitida nesta RF: `PAID` → `PROCESSING`. Permissão: `IsSeller` (pertencente à loja do pedido). |
| **RF-12.5** | Botão **"Iniciar Separação / Processar"** visível para pedidos com status `PAID`. Ao clicar, atualiza o pedido para `PROCESSING`. |

> [!NOTE]
> As permissões via `IsSeller` devem garantir que o lojista só visualize e altere pedidos destinados à sua loja (`store_id` vinculado).

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Lojista acessa `/store/orders` e visualiza apenas pedidos da sua loja. |
| **CA-02** | Filtro por status retorna o subconjunto correto de pedidos. |
| **CA-03** | Ação **"Processar"** em pedido com status `PAID` atualiza o status para `PROCESSING` via `PATCH`. |
| **CA-04** | Tentativa de um lojista de gerenciar pedido de outra loja retorna `403 Forbidden`. |

---

## Testes (TDD)

### Backend

Arquivo: `apps/orders/tests/test_store_orders.py`

- `GET /api/v1/store/orders/` como `SELLER` → retorna apenas os pedidos da sua loja.
- `PATCH /api/v1/store/orders/{id}/status/` com status `PROCESSING` → retorna `200` e atualiza o status.
- Tentativa de acesso a pedido de outra loja → retorna `403`.

### Frontend Web

Arquivo: `StoreOrdersPage.test.tsx`

- Renderiza a tabela/cards de pedidos.
- A mudança do filtro de status atualiza a lista exibida.
- O botão **"Processar"** altera visualmente o estado do pedido.

---

## Wireframe — Painel Lojista (Pedidos)

```text
┌─────────────────────────────────────────────────────────────┐
│ NŌTA Lojista | Dior Store                         [Sair]    │
├─────────────────────────────────────────────────────────────┤
│ Pedidos [ Todos (5) | Pagos (2) | Em Separação (1) ]       │
├─────────────────────────────────────────────────────────────┤
│ 📋 Pedido #105 - João da Silva - R$ 374,90                 │
│    Itens: 1x Sauvage EDP                                   │
│    Endereço: Av. Paulista, 1000 - SP                       │
│    Status: [ PAID ]       [ ⚙️ Iniciar Separação ]         │
└─────────────────────────────────────────────────────────────┘

```
---

## Arquivos

**Backend:**
- `apps/orders/views.py` — **[MODIFY]** Adicionar `StoreOrderListView`, `UpdateOrderStatusView`.
- `apps/orders/urls.py` — **[MODIFY]** Registrar `/store/orders/`.

**Frontend Web:**
- `src/pages/store/orders.tsx` — **[NOVO]** Página de gestão de pedidos do lojista.
- `src/features/store/OrderCard.tsx` — **[NOVO]** Card detalhado do pedido.
- `src/services/storeOrderService.ts` — **[NOVO]** Chamadas de API do lojista para pedidos.

---

## Dependências

**Backend:** `django-filter` (opcional, ou filtragem via query params nativos)  
**Frontend Web:** nenhuma nova

---

## Referências

- [RF-11](./RF-11_Gateway_Pagamento.md) — Origem do pedido com status `PAID`
- [`politicas-permissoes-drf.md`](../../01-regras-de-negocio/politicas-permissoes-drf.md) — Permissão `IsSeller`