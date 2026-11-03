# RF-15 — Gestão Pós-Compra do Pedido (Cancelamento, Endereço, Entrega e Devolução)

> **Sprint:** 4  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 8 SP  
> **Depende de:** RF-11, RF-12, RF-13, RF-14

---

## Descrição

Define todo o ciclo de vida do pedido após o pagamento: cancelamento (cliente e lojista), alteração de endereço, confirmação de entrega (sem integração com API de transportadora), contestação de entrega e devolução parcial. Inclui a tela de detalhe do pedido no painel web (visualização dos itens do pedido pela loja).

> [!NOTE]
> **Limitação conhecida:** não há integração com APIs de rastreio (Correios exige contrato; alternativas gratuitas são instáveis). O rastreio é feito via link externo para o site da transportadora, e a entrega é confirmada por pessoas (cliente/lojista) ou automaticamente pelo sistema.

---

## Máquina de Status

### Pedido (`Order.status`)

```text
PENDING ──► PAID ──► PROCESSING ──► SHIPPED ──► DELIVERED
   │          │          │             │  ▲
   │          │          ▼             ▼  │ (reenviado)
   │          │   CANCEL_REQUESTED   DELIVERY_DISPUTED ──► REFUNDED
   │          │     │ aprovado │ recusado (volta a PROCESSING)
   ▼          ▼     ▼
          CANCELLED
```

| Status | Significado |
|---|---|
| `PENDING` | Aguardando pagamento |
| `PAID` | Pagamento aprovado |
| `PROCESSING` | Lojista separando o pedido |
| `CANCEL_REQUESTED` | Cliente solicitou cancelamento durante a separação |
| `SHIPPED` | Despachado com código de rastreio |
| `DELIVERY_DISPUTED` | Cliente contestou a entrega ("Não recebi") |
| `DELIVERED` | Entregue (confirmado por cliente, lojista ou sistema) |
| `CANCELLED` | Cancelado (grafia padronizada com dois "L" em toda a documentação) |
| `REFUNDED` | Reembolsado integralmente após contestação |

### Devolução (`ReturnRequest.status`) — entidade separada, permite devolução parcial

```text
REQUESTED ──► APPROVED ──► RECEIVED ──► REFUNDED
     └──────► REJECTED
```

---

## Regras de Negócio

| ID | Regra |
|---|---|
| **RN-01** | Cliente cancela **diretamente** em `PENDING` ou `PAID`. Motivo obrigatório. Estorno simulado imediato e estoque devolvido. |
| **RN-02** | Em `PROCESSING`, o cliente apenas **solicita** cancelamento (`CANCEL_REQUESTED`). Lojista aprova (→ `CANCELLED`, estoque devolvido) ou recusa com motivo obrigatório (→ `PROCESSING`). |
| **RN-03** | A partir de `SHIPPED` não há cancelamento; o caminho é a devolução após a entrega. |
| **RN-04** | Lojista pode cancelar em `PAID`/`PROCESSING` com motivo obrigatório. Cliente é notificado e estornado. Estoque é devolvido, exceto quando o motivo for "Sem estoque". |
| **RN-05** | Cliente pode alterar o endereço até `PROCESSING`, **somente para endereço da mesma cidade/UF** (frete não é recalculado). O pedido recebe a flag `address_changed` e o lojista vê o aviso "Endereço alterado". |
| **RN-06** | Cliente confirma entrega ("Recebi meu pedido") em `SHIPPED` → `DELIVERED`. Registra `delivered_at` e `delivery_confirmed_by = CUSTOMER`. |
| **RN-07** | Lojista pode marcar como entregue em `SHIPPED` (`delivery_confirmed_by = SELLER`). O cliente tem **7 dias** para contestar ("Não recebi") → `DELIVERY_DISPUTED`. |
| **RN-08** | **Auto-confirmação:** pedidos em `SHIPPED` há **30 dias** (a partir de `shipped_at`) passam para `DELIVERED` (`delivery_confirmed_by = SYSTEM`). |
| **RN-09** | **Contestação:** lojista conversa com o cliente via chat (RF-18) e resolve marcando **"Reenviado"** (→ `SHIPPED`, permite informar novo rastreio) ou **"Reembolsar"** (→ `REFUNDED`, estoque não é devolvido). |
| **RN-10** | **Devolução parcial:** cliente solicita em até **7 dias após `delivered_at`**, selecionando **itens e quantidades**, com motivo obrigatório e fotos opcionais (até 3). Um item não pode ser devolvido em quantidade maior que a comprada (considerando devoluções anteriores). |
| **RN-11** | Lojista aprova ou recusa (recusa com motivo obrigatório) a devolução. Após aprovar, marca **"Produto recebido"** informando se está **em condições de revenda** (se sim, estoque volta). Em seguida o reembolso simulado é registrado (`REFUNDED`) com o valor dos itens devolvidos. |
| **RN-12** | **Prazo de resposta do lojista:** solicitações de cancelamento (`CANCEL_REQUESTED`) e devolução (`REQUESTED`) sem resposta em **48h** são **aprovadas automaticamente**. |
| **RN-13** | **Frete da devolução** fica fora do sistema: apenas o fluxo é registrado (cliente pode informar código de rastreio da devolução, opcional). |
| **RN-14** | Toda transição gera um registro em `OrderStatusHistory` (status anterior, novo status, ator, motivo, data) exibido na timeline. |
| **RN-15** | Rastreio: ao lado do `tracking_code`, botão **"Rastrear no site da transportadora"** abre a URL pública da `carrier` com o código. |

### Motivos pré-definidos

**Cliente (cancelamento/devolução):** Desisti da compra · Comprei errado · Endereço errado · Produto avariado · Produto diferente do anunciado · Outro (texto obrigatório).  
**Lojista (cancelamento):** Sem estoque · Produto avariado · Endereço inválido · Outro (texto obrigatório).

> [!NOTE]
> Tarefas automáticas (RN-08, RN-12) são executadas por um management command (`process_order_deadlines`) agendado, e também verificadas de forma preguiçosa ao consultar o pedido.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-15.1** | **[Backend — Model]** Novos status em `Order`; campos `shipped_at`, `delivered_at`, `delivery_confirmed_by`, `address_changed`, `cancel_reason`, `cancel_requested_at`. |
| **RF-15.2** | **[Backend — Model]** `OrderStatusHistory` (`order`, `from_status`, `to_status`, `actor`, `reason`, `created_at`). |
| **RF-15.3** | **[Backend — Model]** `ReturnRequest` (`order`, `status`, `reason`, `description`, `return_tracking_code`, `resellable`, `refund_amount`, timestamps), `ReturnItem` (`return_request`, `order_item`, `quantity`) e `ReturnPhoto`. |
| **RF-15.4** | **[Backend — Cliente]** `POST /api/v1/orders/{id}/cancel/` (cancela ou solicita conforme status). |
| **RF-15.5** | **[Backend — Cliente]** `PATCH /api/v1/orders/{id}/address/` (valida mesma cidade/UF e status ≤ `PROCESSING`). |
| **RF-15.6** | **[Backend — Cliente]** `POST /api/v1/orders/{id}/confirm-delivery/` e `POST /api/v1/orders/{id}/dispute-delivery/`. |
| **RF-15.7** | **[Backend — Cliente]** `POST /api/v1/orders/{id}/returns/` (multipart com itens e fotos). |
| **RF-15.8** | **[Backend — Loja]** `POST /api/v1/store/orders/{id}/cancel/`, `.../cancel-request/{approve\|reject}/`, `.../mark-delivered/`, `.../dispute/{reship\|refund}/`. |
| **RF-15.9** | **[Backend — Loja]** `POST /api/v1/store/returns/{id}/{approve\|reject\|receive}/` (`receive` recebe `resellable`). |
| **RF-15.10** | **[Backend]** `GET /api/v1/store/orders/{id}/` com itens (foto, nome, volume, quantidade, preço), endereço, rastreio, histórico e devoluções. |
| **RF-15.11** | **[Backend]** Management command `process_order_deadlines` (RN-08 e RN-12). |
| **RF-15.12** | **[Mobile]** Ações contextuais no detalhe do pedido + modais de motivo, troca de endereço, devolução (seleção de itens + fotos via câmera/galeria). |
| **RF-15.13** | **[Web]** Tela de detalhe do pedido da loja (`/store/orders/:id`) com itens e ações por status; nova aba de filtro **"Solicitações"** (cancelamentos, devoluções e contestações pendentes). |

---

## Fluxo de Interface

### Mobile — Detalhe do Pedido (ações por status)

| Status | Ações |
|---|---|
| `PENDING` / `PAID` | Cancelar pedido · Alterar endereço |
| `PROCESSING` | Solicitar cancelamento · Alterar endereço |
| `CANCEL_REQUESTED` | (aviso "Aguardando resposta da loja — até 48h") |
| `SHIPPED` | Rastrear · Copiar código · **Recebi meu pedido** |
| `DELIVERED` (pelo lojista, < 7 dias) | **Não recebi** |
| `DELIVERED` (< 7 dias) | Solicitar devolução · Avaliar (RF-16) |
| `DELIVERY_DISPUTED` | Abrir chat com a loja (RF-18) |

### Web — Detalhe do Pedido (Lojista / Loja Oficial)

```text
┌──────────────────────────────────────────────────────────┐
│ Pedido #105            Status: Em separação   [Ações ▼]  │
├──────────────────────────────────────────────────────────┤
│ Itens                                                    │
│ [img] Acqua di Gio  100ml   x1   R$ 450,00               │
│ [img] Sauvage (Decant) 10ml x2   R$ 120,00               │
├──────────────────────────────────────────────────────────┤
│ Entrega  ⚠️ Endereço alterado pelo cliente               │
│ Rua X, 123 — Centro, São Paulo/SP — 01000-000            │
│ Frete: PAC R$ 25,00  |  Rastreio: —                      │
├──────────────────────────────────────────────────────────┤
│ Subtotal R$ 570,00 · Frete R$ 25,00 · Total R$ 595,00    │
├──────────────────────────────────────────────────────────┤
│ Histórico                                                │
│ ✓ 20/10 14:02 Pedido criado                              │
│ ✓ 20/10 14:03 Pagamento aprovado                         │
│ ✓ 21/10 09:10 Em separação (lojista)                     │
└──────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Cliente cancela pedido `PAID` → `CANCELLED` e estoque dos itens é incrementado. |
| **CA-02** | Cliente cancela pedido `PROCESSING` → `CANCEL_REQUESTED`; aprovação do lojista → `CANCELLED`; recusa → `PROCESSING`. |
| **CA-03** | Tentativa de cancelar pedido `SHIPPED` retorna `400`. |
| **CA-04** | Alteração de endereço para outra cidade/UF retorna `400`; para mesma cidade, salva e marca `address_changed`. |
| **CA-05** | "Recebi meu pedido" em `SHIPPED` → `DELIVERED` com `delivered_at`. |
| **CA-06** | Contestação só é aceita se entregue pelo lojista há ≤ 7 dias. |
| **CA-07** | Devolução com quantidade maior que a comprada retorna `400`; devolução após 7 dias retorna `400`. |
| **CA-08** | Recebimento de devolução com `resellable=true` incrementa estoque; com `false` não altera. |
| **CA-09** | `process_order_deadlines` auto-confirma `SHIPPED` > 30 dias e aprova solicitações > 48h. |
| **CA-10** | Lojista não acessa/age sobre pedidos de outra loja (`404`). |

---

## Testes (TDD)

### Backend
- `apps/orders/tests/test_order_cancellation.py`
- `apps/orders/tests/test_order_address_change.py`
- `apps/orders/tests/test_order_delivery.py`
- `apps/orders/tests/test_order_returns.py`
- `apps/orders/tests/test_order_deadlines.py`

### Frontend Web
- `StoreOrderDetail.test.tsx` — renderiza itens/histórico; ações exibidas conforme status.

### Mobile
- `__tests__/OrderActions.test.tsx` — botões por status; modal de motivo exige seleção.

---

## Arquivos

**Backend:** `apps/orders/models.py`, `serializers.py`, `views.py`, `urls.py`, `services.py` (**[NOVO]** transições e estoque), `management/commands/process_order_deadlines.py` (**[NOVO]**).  
**Web:** `src/features/store/StoreOrderDetail.tsx` (**[NOVO]**), `src/services/storeOrderService.ts` (**[MODIFY]**).  
**Mobile:** `src/app/(shop)/orders/[id].tsx` (**[MODIFY]**), `src/components/orders/` (**[NOVO]** modais), `src/services/customerOrders.ts` (**[MODIFY]**).

---

## Referências

- [RF-11](../sprint-3/RF-11_Gateway_Pagamento.md) · [RF-12](../sprint-3/RF-12_Processamento_Pedido_Lojista.md) · [RF-13](../sprint-3/RF-13_Expedicao_Rastreio_Lojista.md) · [RF-14](../sprint-3/RF-14_Rastreio_Cliente_Mobile.md)
- RF-16 (Avaliações) — liberadas após `DELIVERED`
- RF-17 (Estoque) — devolução de estoque
- RF-18 (Mensageria/Notificações) — chat de contestação e avisos
