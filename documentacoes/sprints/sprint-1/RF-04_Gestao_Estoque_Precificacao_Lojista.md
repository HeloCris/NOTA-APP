# RF-04 — Gestão de Estoque & Precificação do Lojista

> **Sprint:** 1 | **Prioridade:** 🔴 Alta | **Estimativa:** 5 SP | **Depende de:** RF-01, RF-02, RF-03

---

## Descrição

O lojista gerencia seu catálogo próprio vinculando produtos do catálogo global, definindo volume em ML (decant 5ml, 10ml, frasco 50ml, 100ml), preço, preço promocional e quantidade em estoque.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-04.1** | Model `StoreProduct`: FKs para `Store` e `Product`, campos `volume_ml`, `price` (Decimal), `promotional_price` (Decimal, opcional), `stock_quantity`, `is_available` — SQLite |
| **RF-04.2** | `GET /api/v1/store-products/` — listagem filtrada pela loja logada (`?status=`, `?search=`) |
| **RF-04.3** | `POST /api/v1/store-products/` — adiciona perfume ao estoque da loja |
| **RF-04.4** | `PATCH /api/v1/store-products/{id}/` — atualização parcial de preço, estoque ou disponibilidade |
| **RF-04.5** | `DELETE /api/v1/store-products/{id}/` — remove item do estoque |
| **RF-04.6** | Tela "Meus Perfumes": tabela com badge de volume, alerta de estoque baixo (< 3 un.) e toggle ativo/inativo |
| **RF-04.7** | Modal de inclusão integrado ao catálogo (RF-03): seleciona perfume, informa ML, preço e estoque |

> [!IMPORTANT]
> QuerySet sempre filtrado por `store=request.user.store`. `price > 0`, `promotional_price < price` e `stock_quantity >= 0` validados no serializer.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | Lojista B acessa `StoreProduct` da Loja A → `403` ou `404` |
| **CA-02** | `promotional_price > price` → `400` com campo descritivo |
| **CA-03** | `price ≤ 0` ou `stock_quantity < 0` → `400` |
| **CA-04** | Toggle ativo/inativo reflete na UI sem reload |
| **CA-05** | Linhas com estoque < 3 recebem destaque visual de alerta |

---

## Testes (TDD)

**Backend** (`apps/inventory/tests/test_store_products.py`): criação válida `201`, isolamento multi-tenant `403/404`, preço promocional inválido `400`, estoque negativo `400`, `DELETE` por dono `204`, `DELETE` por outro lojista `403`.

**Frontend** (`InventoryTable.test.tsx`, `AddProductModal.test.tsx`): tabela renderiza itens com badge de volume e preço formatado (BRL), modal seleciona perfume, preenche campos e chama serviço com payload correto.

---

## Wireframe — Tela "Meus Perfumes"

**Barra de ações:** busca por nome/marca, filtros (família, faixa de preço, status), botão **"+ Adicionar Perfume"**.

**Tabela de inventário:**

| Frasco | Nome | Marca | Volume | Preço | Promo | Qtd | Status | Ações |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🖼️ | Sauvage | Dior | `100ml` | R$ 349,90 | R$ 299,90 | 15 | ✅ | ✏️ 🗑️ |
| 🖼️ | Good Girl | CH | `Decant 10ml` | R$ 89,90 | — | 2 ⚠️ | ✅ | ✏️ 🗑️ |

> Linhas com `stock_quantity < 3` recebem borda/fundo em tom âmbar de aviso.

---

## Arquivos

**Backend:** `apps/inventory/models.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_store_products.py` — **[NOVO]**. Registrar `StoreProduct` no `admin.py`.

**Frontend:** `src/features/inventory/InventoryTable.tsx`, `src/features/inventory/AddProductModal.tsx`, `src/services/inventoryService.ts` — **[NOVO]**.

---

## Dependências

**Backend:** nenhuma nova
**Frontend:** nenhuma nova

---

## Referências

- [`modelo-relacional.md`](../../../02-banco-de-dados/modelo-relacional.md) — Model `StoreProduct` e relacionamentos
- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/store-products/`
- [`politicas-permissoes-drf.md`](../../../01-regras-de-negocio/politicas-permissoes-drf.md) — `IsStoreOwner` e isolamento de QuerySet
- [RF-03](./RF-03_Catalogo_Base_Piramide_Olfativa.md) — Integração com catálogo global
