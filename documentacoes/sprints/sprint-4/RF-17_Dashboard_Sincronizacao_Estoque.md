# RF-17 — Dashboard do Lojista/Marca e Sincronização de Estoque

> **Sprint:** 4  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 8 SP  
> **Depende de:** RF-15 (Pedidos e Devoluções), RF-16 (Avaliações)

---

## Descrição

Implementa a sincronização e consistência em tempo real do estoque entre compras, cancelamentos, devoluções e telas gerenciais (*Meus Perfumes* no lojista e *Vendas e Estoque* no Brand Hub da Loja Oficial). No mobile, valida itens fora de estoque ou com quantidade insuficiente no carrinho/checkout. No painel web, reformula completamente o Dashboard da Loja (compartilhado entre lojista `SELLER` e `BRAND_OWNER` com D2C ativo), removendo a aba fixa/mockada de "Top Perfumes", adicionando KPIs financeiros reais com seletor de período (7 ou 30 dias), gráfico real de faturamento por dia, alerta de estoque baixo fixo (< 3 unidades), valor patrimonial em estoque, taxa unificada de cancelamento/devolução, e contador real de visualizações da loja.

---

## Regras de Negócio

| ID | Regra |
|---|---|
| **RN-01** | **Baixa de Estoque:** Ao criar o pedido com pagamento aprovado (`Order` criado/pago), decrementa atomicamente `StoreProduct.stock_quantity`. Se `stock_quantity < requested_qty`, a compra é rejeitada com `400 Bad Request` indicando a quantidade disponível. |
| **RN-02** | **Estorno de Estoque:** Pedidos cancelados (RF-15) retornam o estoque automaticamente (exceto se cancelamento pelo lojista por motivo "Sem estoque"). Devoluções recebidas com `resellable = True` (RF-15) também devolvem o estoque. |
| **RN-03** | **Sincronização em Tempo Real na Web:** As tabelas de *Meus Perfumes* (Lojista) e *Vendas e Estoque* (Loja Oficial no Brand Hub) refletem a `stock_quantity` atualizada imediatamente após qualquer transação. |
| **RN-04** | **Itens Fora de Estoque no Carrinho (Mobile):**<br>- Se `stock_quantity == 0`: o item é sinalizado como **"Indisponível / Fora de Estoque"**, seu subtotal fica zerado e o botão de checkout fica bloqueado com alerta exigindo a remoção do item para prosseguir.<br>- Se `0 < stock_quantity < quantidade_no_carrinho`: o app reduz automaticamente a quantidade no carrinho para o limite disponível e exibe aviso toast: *"A quantidade de [Produto] foi ajustada para X devido ao estoque disponível."* |
| **RN-05** | **Alerta de Estoque Baixo:** Fixo para produtos com `stock_quantity < 3` e `is_available = True`. |
| **RN-06** | **Remoção de Top Perfumes:** A aba/card estático "Top Perfumes" é completamente removida do Dashboard. |
| **RN-07** | **Seletor de Período:** O lojista pode alternar o dashboard entre **7 dias** e **30 dias**. Todos os KPIs, comparativos percentuais e o gráfico diário reagem dinamicamente à escolha. |
| **RN-08** | **Fórmulas e Métricas Financeiras:**<br>- **Faturamento Bruto:** Soma do valor total dos pedidos válidos (`PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`) no período selecionado.<br>- **Comissão da Plataforma:** 10% sobre o subtotal dos produtos vendidos (`PLATFORM_COMMISSION_RATE = 0.10`). O frete não sofre retenção de comissão.<br>- **Reembolsos:** Soma dos valores estornados em cancelamentos e devoluções concluídas no período.<br>- **Faturamento Líquido:** `Faturamento Bruto - Reembolsos - Comissão da Plataforma`.<br>- **Ticket Médio:** `Faturamento Bruto / Quantidade de Pedidos Válidos` (ou R$ 0,00 se zero pedidos).<br>- **Taxa de Cancelamento e Devolução (Card Único):** Exibe as porcentagens sobre o total de pedidos no período (ex.: `"3.2% cancelados · 1.1% devolvidos"`).<br>- **Valor Total em Estoque:** `Σ (price * stock_quantity)` de todos os produtos ativos da loja (independe do filtro de período). |
| **RN-09** | **Contador de Visualizações:** Toda vez que a tela da loja pública for acessada no app mobile (`/store/[id]`), dispara um incremento assíncrono em `Store.views_count` (com debounce/throttling simples de sessão para não inflar em re-renders). O KPI no dashboard reflete esse número no período. |
| **RN-10** | **Pedidos Recentes e Reposição:** "Ver Todos" em Pedidos Recentes navega para a aba de Pedidos. Clicar em um pedido abre o detalhe da RF-15. No Alerta de Reposição, o botão "Repor" direciona o usuário para a tela de edição do estoque do respectivo perfume. |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-17.1** | **[Backend — Model]** Adicionar campo `views_count = models.PositiveIntegerField(default=0)` no model `Store`. |
| **RF-17.2** | **[Backend — Endpoint]** `POST /api/v1/stores/{id}/view/` (público, leve) para incrementar visualização da loja com segurança. |
| **RF-17.3** | **[Backend — Endpoint]** `GET /api/v1/stores/me/dashboard/?period=7d|30d` (também disponível em `/api/v1/stores/dashboard/`, restrito a `IsSeller` / `IsBrandOwner` com D2C): retorna faturamento bruto, líquido, ticket médio, pedidos pendentes, taxas de cancelamento/devolução, valor em estoque, alertas de estoque, visualizações, gráfico diário (labels + valores) e lista de pedidos recentes. |
| **RF-17.4** | **[Backend — Sincronização]** Garantir uso de transação atômica (`select_for_update`) e recálculo fiel de `stock_quantity` na criação de pedidos, cancelamentos e devoluções. |
| **RF-17.5** | **[Mobile — Carrinho]** Integrar verificação de disponibilidade ao abrir o carrinho; desabilitar avanço se houver indisponível e auto-ajustar quantidades excedentes com feedback visual. |
| **RF-17.6** | **[Mobile — Loja]** Registrar visualização ao abrir a tela de vitrine da loja. |
| **RF-17.7** | **[Web — Dashboard]** Refatorar `DashboardTab.tsx`: remover Top Perfumes, conectar ao novo endpoint com suporte a 7d/30d, renderizar SVG/chart com dados diários reais, exibir card unificado de cancelamento/devolução e card de valor em estoque. |
| **RF-17.8** | **[Web — Meus Perfumes / Brand Hub]** Garantir revalidação/atualização automática da coluna de estoque após compras e ações operacionais. |

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Pedido criado decrementa imediatamente o estoque do `StoreProduct`. Tentativa de comprar sem estoque retorna `400` com quantidade disponível. |
| **CA-02** | Produto com estoque 0 no carrinho exibe tag "Indisponível" e bloqueia o botão de finalizar compra. |
| **CA-03** | Produto com estoque menor que a quantidade solicitada ajusta a quantidade no carrinho e exibe notificação ao cliente. |
| **CA-04** | Cancelamento aprovado devolve o estoque do item. |
| **CA-05** | O endpoint do dashboard calcula comissão de 10% apenas sobre os produtos, subtrai reembolsos e expõe valores bruto e líquido condizentes com os pedidos do período. |
| **CA-06** | A alternância entre "7 dias" e "30 dias" atualiza todos os cards e a curva do gráfico diário sem erros. |
| **CA-07** | O bloco estático "Top Perfumes" não é mais visível no painel web. |
| **CA-08** | O card de taxa de cancelamento e devolução exibe os percentuais consolidados em um único componente. |
| **CA-09** | Acessar a tela da loja no mobile contabiliza visualização e reflete no KPI do dashboard. |

---

## Testes (TDD)

### Backend
- `apps/stores/tests/test_dashboard.py` — testa cálculos de faturamento bruto/líquido (comissão 10%), ticket médio, taxas de cancelamento/devolução e filtros de período (7d e 30d).
- `apps/stores/tests/test_store_views.py` — testa incremento de views da loja.
- `apps/inventory/tests/test_stock_sync.py` — testa consistência atômica de estoque em compra, cancelamento e devolução.

### Frontend Web
- `DashboardTab.test.tsx` — verifica ausência de Top Perfumes, renderização dos novos KPIs e troca de período 7d/30d.

### Mobile
- `CartStockValidation.test.tsx` — valida bloqueio de checkout para itens esgotados e ajuste automático para estoques insuficientes.

---

## Arquivos

**Backend:**
- `apps/stores/models.py` — **[MODIFY]** campo `views_count`.
- `apps/stores/migrations/0011_store_views_count.py` — **[NEW]** migração do contador de visualizações.
- `apps/stores/urls.py` — **[MODIFY]** rotas de visualização e dashboard.
- `apps/stores/views.py` — **[MODIFY]** endpoints `view/` e `dashboard/`.
- `apps/stores/services/dashboard_service.py` — **[NEW]** cálculos financeiros, gráfico, estoque e pedidos recentes.
- `apps/orders/views.py` e `services.py` — **[MODIFY]** garantia de atômica e devolução correta de estoque.

**Web:**
- `src/components/seller/DashboardTab.tsx` — **[MODIFY]** novo layout sem Top Perfumes e com novos cards/períodos.
- `src/types/store.ts` — **[MODIFY]** tipagens de KPIs financeiros.
- `src/services/storeService.ts` — **[MODIFY]** suporte ao parâmetro de período.
- `src/features/showcase/StoreShowcasePage.tsx` — **[MODIFY]** registro da visualização da vitrine.

**Mobile:**
- `src/app/store/[id].tsx` — **[MODIFY]** disparo de visualização da loja.
- `src/services/stores.ts` — **[MODIFY]** serviço para registrar visualização.

### Implementação entregue

- Dashboard e sincronização de estoque implementados nesta feature.
- O contador de visualizações é incrementado de forma atômica no backend e limitado a uma vez por sessão na vitrine web/mobile.
- A baixa de estoque na criação do pedido já usa transação atômica; cancelamentos e devoluções usam bloqueio de linha ao restaurar estoque.
- Build web, `manage.py check` e os testes de lojas/estoque foram validados.

---

## Referências

- [RF-15](./RF-15_Gestao_Pos_Compra.md) — Regras de cancelamento e devolução
- [RF-16](./RF-16_Avaliacoes.md) — Card de avaliação e nota média
