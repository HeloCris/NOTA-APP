# RF-14 — Rastreio de Encomenda (Consumidor Mobile)

> **Sprint:** 3  
> **Prioridade:** 🟡 Média  
> **Estimativa:** 3 SP  
> **Depende de:** RF-13

---

## Descrição

Experiência do consumidor no aplicativo mobile para acompanhar o status e o histórico/timeline da sua encomenda após a compra.

A funcionalidade é acessível por meio do histórico de pedidos e do detalhe de cada pedido.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-14.1** | Rota `src/app/(shop)/orders/index.tsx` — listagem de pedidos do consumidor autenticado. |
| **RF-14.2** | Rota `src/app/(shop)/orders/[id].tsx` — detalhe do pedido com linha do tempo (timeline) de status (`PENDING` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`). |
| **RF-14.3** | Exibição da transportadora (`carrier`) e código de rastreio (`tracking_code`) com botão de copiar (`Clipboard.setStringAsync`). |
| **RF-14.4** | **[Backend — Novo Endpoint]** `GET /api/v1/orders/{id}/` — detalhe do pedido do usuário autenticado, incluindo itens, endereço, rastreio e timeline gerada. Permissão: `IsAuthenticated` (dono do pedido). |

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Consumidor visualiza a lista de seus pedidos na aba de pedidos. |
| **CA-02** | Detalhe do pedido exibe a timeline com as etapas concluídas destacadas. |
| **CA-03** | Código de rastreio do pedido despachado (`SHIPPED`) é exibido e pode ser copiado para a área de transferência. |
| **CA-04** | Usuário tentando acessar um pedido de outro usuário recebe `404` ou `403`. |

---

## Testes (TDD)

### Backend

Arquivo: `apps/orders/tests/test_customer_orders.py`

- `GET /api/v1/orders/{id}/` como dono do pedido → retorna `200` com timeline e dados de rastreio.
- `GET /api/v1/orders/{id}/` como outro usuário → retorna `404`.

### Mobile

Arquivo: `__tests__/OrderDetailScreen.test.tsx`

- Renderiza a timeline com o status atual do pedido.
- Botão de copiar rastreio aciona a função de clipboard do Expo/React Native.

---

## Wireframe — Detalhe do Pedido Mobile

```text
┌─────────────────────────────────────────┐
│ <  Pedido #105                          │
├─────────────────────────────────────────┤
│ Status Atual: 🚚 Enviado                │
│ Rastreio: BR123456789X (Correios) [📋] │
├─────────────────────────────────────────┤
│ ⏱️ Histórico do Pedido                  │
│    ✓ Pedido Criado                      │
│    ✓ Pagamento Aprovado                 │
│    ✓ Em Separação na Loja               │
│    🚚 Enviado pela transportadora       │
│    ○ Entregue                           │
└─────────────────────────────────────────┘

```

---

## Arquivos

**Backend:**
- `apps/orders/serializers.py` — **[MODIFY]** `CustomerOrderDetailSerializer` com timeline method/field.
- `apps/orders/views.py` — **[MODIFY]** `CustomerOrderViewSet` (list/retrieve).
- `apps/orders/urls.py` — **[MODIFY]** Rotas para `/api/v1/orders/`.

**Mobile:**
- `src/app/(shop)/orders/index.tsx` — **[NOVO]** Lista de pedidos do cliente.
- `src/app/(shop)/orders/[id].tsx` — **[NOVO]** Detalhe e rastreio do pedido.
- `src/components/orders/OrderTimeline.tsx` — **[NOVO]** Componente visual de timeline.
- `src/services/customerOrders.ts` — **[NOVO]** Serviço mobile de pedidos.

---

## Dependências

**Backend:** nenhuma nova  
**Mobile:** `expo-clipboard`

---

## Referências

- [RF-13](./RF-13_Expedicao_Rastreio_Lojista.md) — Precedente de dados de rastreio
- [`estrutura-app-mobile-expo.md`](../../03-arquitetura/estrutura-app-mobile-expo.md) — Rotas `(shop)/`