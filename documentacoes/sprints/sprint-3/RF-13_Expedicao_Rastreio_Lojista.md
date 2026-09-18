# RF-13 — Expedição, Etiqueta e Despacho de Encomenda

> **Sprint:** 3  
> **Prioridade:** 🟡 Média  
> **Estimativa:** 5 SP  
> **Depende de:** RF-12

---

## Descrição

Etapa final da operação do lojista na venda. O lojista informa o código de rastreio (`tracking_code`) fornecido pela transportadora/correios e a transportadora (`carrier`), transicionando o pedido para o status `SHIPPED` (enviado).

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-13.1** | No card de pedido em separação (`PROCESSING`), exibir modal ou formulário inline de despacho com os campos `carrier` (ex.: Correios, Jadlog) e `tracking_code`. |
| **RF-13.2** | **[Backend — Novo Endpoint]** `PATCH /api/v1/store/orders/{id}/ship/` — recebe `carrier` e `tracking_code`, valida o preenchimento, atualiza `Order.status = 'SHIPPED'` e salva os dados de rastreio. Permissão: `IsSeller`. |
| **RF-13.3** | Validação de rastreio: `tracking_code` não pode ser vazio e deve possuir pelo menos 6 caracteres alfanuméricos. |

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Submissão de `carrier` e `tracking_code` válidos atualiza o status do pedido para `SHIPPED`. |
| **CA-02** | Submissão com `tracking_code` vazio retorna `400 Bad Request`. |
| **CA-03** | Pedido com status `SHIPPED` exibe o código de rastreio vinculado no painel do lojista. |

---

## Testes (TDD)

### Backend

Arquivo: `apps/orders/tests/test_store_shipping.py`

- `PATCH /api/v1/store/orders/{id}/ship/` com `carrier` e `tracking_code` válidos → status `SHIPPED` e dados salvos.
- `PATCH /api/v1/store/orders/{id}/ship/` com `tracking_code` vazio → retorna `400`.

### Frontend Web

Arquivo: `ShippingModal.test.tsx`

- Modal abre ao clicar em **"Despachar Pedido"**.
- Validação impede o envio com código de rastreio em branco.
- Envio bem-sucedido atualiza o estado do pedido na tela.

---

## Wireframe — Modal de Despacho (Painel Lojista)

```text
┌─────────────────────────────────────────┐
│ Despachar Pedido #105                   │
├─────────────────────────────────────────┤
│ Transportadora: [ Correios          ▼ ] │
│ Código Rastreio: [ BR123456789X       ] │
├─────────────────────────────────────────┤
│ [ Cancelar ]        [ Confirmar Envio ] │
└─────────────────────────────────────────┘

```
---

## Arquivos

**Backend:**
- `apps/orders/serializers.py` — **[MODIFY]** `ShippingUpdateSerializer`.
- `apps/orders/views.py` — **[MODIFY]** `ShipOrderView`.
- `apps/orders/urls.py` — **[MODIFY]** Rota `store/orders/<int:pk>/ship/`.

**Frontend Web:**
- `src/features/store/ShippingModal.tsx` — **[NOVO]** Modal de despacho.
- `src/services/storeOrderService.ts` — **[MODIFY]** Adicionar `shipOrder(id, data)`.

---

## Dependências

**Backend:** nenhuma nova  
**Frontend Web:** nenhuma nova

---

## Referências

- [RF-12](./RF-12_Processamento_Pedido_Lojista.md) — Precedente de estado do pedido (`PROCESSING`)