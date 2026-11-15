# RF-23: Inteligência de Mercado e Tendências Olfativas no Painel Web (Aba Métricas — Parte 1)

**Sprint:** 05 (Fechamento do Produto)  
**Prioridade:** Alta  
**Estimativa:** 6 Story Points  
**Dependências:** `RF-05` (Quiz Olfativo), `RF-09`/`RF-10` (Catálogo e Ofertas), `RF-18` (Dashboard de Pedidos)  

---

## 1. Descrição e Propósito de Negócio

No painel Web do **Vendedor (`SellerHomePage`)** e da **Marca (`BrandHomePage`)**, a aba lateral **"Métricas"** (`activeMenu === 'metrics'`) encontra-se atualmente como um *placeholder* com a mensagem *"Página em desenvolvimento"*.

Um dos maiores diferenciais estratégicos da **NŌTA** em relação a marketplaces genéricos é o fato de a plataforma coletar o **DNA Olfativo real dos consumidores** (`CustomUser.olfactory_families` e `CustomUser.preferred_notes`) e estruturar o catálogo por famílias, notas de pirâmide e volumetrias (*Decants* vs. *Frascos*).

Esta RF entrega a **Parte 1 da aba Métricas**: o painel de **Inteligência de Mercado e Tendências Olfativas do Ecossistema NŌTA**. Ele permite que qualquer lojista ou marca visualize o comportamento macro da plataforma:
1. Quais **Famílias Olfativas** e **Notas da Pirâmide** são as mais desejadas pelos clientes cadastrados na NŌTA;
2. Qual é a proporção de vendas e demanda do mercado entre **Decants ($\le 15\text{ml}$)** e **Frascos Completos ($> 15\text{ml}$)**;
3. Qual é a **competitividade de preços do catálogo da própria loja** por perfume e volumetria em comparação às demais ofertas ativas no marketplace (tanto de **Lojas Oficiais de Marcas** quanto de **Lojistas multimarcas**);
4. Quais são os **Top 5 Perfumes e Marcas em alta** na plataforma.

---

## 2. Regras de Negócio (RN)

### RN-01: Privacidade e Agregação Anônima de Dados de Mercado
- Os indicadores de mercado (`market-metrics`) devem ser **100% agregados e anonimizados**.
- Nenhum vendedor pode visualizar dados individuais de clientes (nomes, e-mails) nem o faturamento individual de uma loja concorrente específica; todos os números de mercado representam a soma/média global da plataforma NŌTA.

### RN-02: Cálculo do Mapa de Calor de Famílias Olfativas dos Clientes
- O backend deve percorrer os usuários ativos do tipo `customer` que possuem `olfactory_families` preenchido e contabilizar a frequência de cada uma das 7 famílias oficiais (`Floral`, `Amadeirado`, `Oriental`, `Cítrico`, `Fougère`, `Aquático`, `Gourmand`).
- O percentual de cada família é calculado sobre o total de votos/preferências registradas:
  $$\text{Share da Família (\%)} = \text{round}\left(\frac{\text{Clientes que escolheram a família}}{\text{Total de clientes com perfil olfativo}} \times 100\right)$$

### RN-03: Ranking das Top 10 Notas Olfativas Mais Desejadas
- O backend deve agregar os arrays JSON `CustomUser.preferred_notes` de todos os clientes ativos, normalizando capitalização (`strip().title()`), e retornar as **10 notas mais frequentes** em ordem decrescente de clientes adeptos.
- Caso o banco tenha menos de 5 clientes com `preferred_notes` preenchidas (ambiente recém-instalado), o endpoint deve complementar o ranking com as notas mais presentes nos produtos de maior `sold_count` do catálogo, garantindo que o gráfico nunca fique vazio em apresentações.

### RN-04: Termômetro de Formato do Mercado (Decants vs. Frascos)
- Toda oferta (`StoreProduct`) e todo item de pedido (`OrderItem` de pedidos com status `paid`, `processing`, `shipped` ou `delivered`) é classificado como:
  - **Decant / Amostra:** `volume_ml <= 15`
  - **Frasco Completo:** `volume_ml > 15`
- O endpoint deve retornar tanto a divisão de **Unidades Vendidas (Demanda)** quanto a divisão de **Ofertas Ativas no Marketplace (Oferta)** entre Decants e Frascos.

### RN-05: Radar de Competitividade do Meu Catálogo (Por Perfume e Volumetria entre Lojas Oficiais e Lojistas)
- Para cada oferta ativa da loja logada (`StoreProduct`), o backend deve cruzar os preços efetivos (`promotional_price` se ativo, caso contrário `price`) com todas as ofertas ativas do mesmo perfume em todas as lojas ativas da plataforma (incluindo **Lojas Oficiais D2C** `is_official=True` e **Lojistas** `is_official=False`):
  - Se houver outras lojas ofertando a **exata mesma volumetria (`volume_ml`)**, o comparativo de preço mínimo (`market_min_price`) e preço médio (`market_avg_price`) é calculado sobre as ofertas daquela mesma volumetria;
  - Caso apenas a loja logada possua aquela volumetria específica, mas outras lojas (Oficiais ou Lojistas) vendam o **mesmo perfume** em outras volumetrias, o sistema unifica todas as ofertas ativas daquele perfume para calcular `market_min_price`, `market_avg_price` e `sellers_count` (total de lojas vendendo o perfume);
  - Cada item do catálogo da loja recebe uma classificação automática de posicionamento (`position`):
    - `"lowest"` (**Menor preço**): `my_price <= market_min_price` (quando há 2+ lojas vendendo o perfume);
    - `"competitive"` (**Competitivo**): `my_price <= market_avg_price * 1.05`;
    - `"above_market"` (**Acima da média**): `my_price > market_avg_price * 1.05`;
    - `"exclusive"` (**Oferta única**): `sellers_count == 1` (apenas a loja logada vende aquele perfume no ecossistema).

### RN-06: Top 5 Perfumes Mais Populares da Plataforma
- O ranking de perfumes em alta deve ordenar os produtos aprovados (`Product.is_approved = True`) por unidades vendidas consolidadas (`max(Product.sold_count, OrderItem)` de pedidos válidos) decrescente (com desempate por quantidade de lojas que ofertam o produto) e informar: nome, marca, família olfativa, `sold_count`, menor preço efetivo ativo no marketplace e uma flag booleana `in_my_catalog` indicando se o vendedor logado já vende aquele perfume.

---

## 3. Requisitos Funcionais Detalhados

### RF-23.1: Endpoint de Inteligência de Mercado (`GET /api/v1/stores/me/market-metrics/`)
Criar a view `StoreMarketMetricsView` em `backend/apps/stores/views.py` acessível para usuários autenticados com loja vinculada (`seller` ou `brand_owner`):
- **Response (`200 OK`):**
  ```json
  {
    "summary": {
      "total_customers_with_profile": 142,
      "total_active_catalog_products": 30,
      "total_active_marketplace_offers": 85,
      "my_store_products_count": 2,
      "top_family_name": "Amadeirado",
      "top_note_name": "Sândalo",
      "decant_sales_share_pct": 64
    },
    "family_demand": [
      { "family": "Amadeirado", "customers_count": 58, "share_pct": 41, "catalog_products_count": 8 },
      { "family": "Oriental", "customers_count": 49, "share_pct": 35, "catalog_products_count": 5 },
      { "family": "Floral", "customers_count": 44, "share_pct": 31, "catalog_products_count": 6 }
    ],
    "top_notes_demand": [
      { "note": "Sândalo", "customers_count": 46, "share_pct": 32 },
      { "note": "Baunilha", "customers_count": 41, "share_pct": 29 },
      { "note": "Bergamota", "customers_count": 38, "share_pct": 27 },
      { "note": "Oud", "customers_count": 33, "share_pct": 23 }
    ],
    "format_thermometer": {
      "decants": {
        "active_offers_count": 48,
        "units_sold": 310,
        "sales_share_pct": 64,
        "avg_ticket": "58.90"
      },
      "bottles": {
        "active_offers_count": 37,
        "units_sold": 175,
        "sales_share_pct": 36,
        "avg_ticket": "689.00"
      }
    },
    "catalog_price_comparison": [
      {
        "store_product_id": 101,
        "product_id": 1,
        "product_name": "Santal 33",
        "brand_name": "Le Labo",
        "olfactory_family": "Amadeirado",
        "volume_ml": 10,
        "is_decant": true,
        "my_price": "65.00",
        "market_min_price": "65.00",
        "market_avg_price": "72.00",
        "sellers_count": 3,
        "position": "lowest"
      }
    ],
    "trending_products": [
      {
        "id": 1,
        "name": "Santal 33",
        "brand_name": "Le Labo",
        "olfactory_family": "Amadeirado",
        "sold_count": 124,
        "min_market_price": "65.00",
        "sellers_count": 4,
        "in_my_catalog": true
      }
    ]
  }
  ```

### RF-23.2: Sub-navegação da Aba Métricas no Painel Web
Na aba **"Métricas"** (`SellerHomePage.tsx` e `BrandHomePage.tsx`), estruturar um cabeçalho com alternância em pílula seguindo o Design System do Seller/Brand Hub:
- **Aba 1: Inteligência de Mercado**
- **Aba 2: Desempenho da Minha Loja**

### RF-23.3: Componente `MarketMetricsSection.tsx`
Criar `web/src/features/store/MarketMetricsSection.tsx` com a identidade visual *Botanical / Slate Navy* do Seller Hub NŌTA (`#354B5E`, `#5C6B4E`, `#A24726`, `#FFFFFF`, bordas `#EFEBDD` / `#E6E1D2`, tipografia `Plus Jakarta Sans` + `Inter`, ícones SVG lineares) contendo:
1. **KPIs de Pulso do Mercado (4 Cards Superiores):**
   - **Família #1 na NŌTA:** Nome da família líder nos perfis olfativos.
   - **Nota mais desejada:** Ingrediente mais buscado pelos clientes.
   - **Força dos Decants ($\le 15\text{ml}$):** `%` das unidades vendidas no marketplace que são decants + valor médio de decant.
   - **Catálogo Global NŌTA:** Total de fragrâncias aprovadas na plataforma e quantidade de perfumes ativos na loja autenticada.
2. **Gráfico de Barras Horizontais — Mapa de Demanda por Família Olfativa:**
   - Exibe as famílias ordenadas pela preferência dos consumidores (`share_pct`), com barra de progresso proporcional (itens com `0%` exibem barra vazia sem preenchimento residual) e contagem de fragrâncias no catálogo.
3. **Ranking 10 Notas Mais Desejadas:**
   - Lista numerada das 10 notas favoritas dos clientes com badges de posição (`1` a `10`) e percentual de afinidade.
4. **Termômetro de Formatos na Plataforma: Decants ($\le 15\text{ml}$) vs. Frascos ($> 15\text{ml}$):**
   - Barra segmentada e cards comparativos mostrando a proporção de vendas em unidades, total de ofertas e valor médio de cada formato no marketplace.
5. **Tabela de Competitividade do Meu Catálogo e Ranking Perfumes Mais Vendidos:**
   - **Competitividade do Meu Catálogo:** Compara cada perfume e volumetria (`ml`) do estoque ativo da loja com todas as ofertas do mesmo perfume em **Lojas Oficiais e Lojistas**, exibindo menor preço e média do mercado, preço da loja e badge de posição (`Menor preço`, `Competitivo`, `Acima da média` ou `Oferta única`).
   - **Perfumes Mais Vendidos:** Exibe uma badge `"No catálogo"` quando `in_my_catalog === true`, ou `"Oportunidade"` quando `in_my_catalog === false`.

---

## 4. Fluxo de Telas (Wireframes ASCII)

```text
+--------------------------------------------------------------------------------------------------+
| [Sidebar NŌTA] |  Métricas e Inteligência                                                        |
|                |  Analise tendências olfativas do mercado e a performance da sua loja            |
|  - Início      |                                                                                 |
|  - Produtos    |  [ 🌍 Inteligência de Mercado (Ativo) ]   [ 📊 Desempenho da Minha Loja ]       |
|  - Cupons      |---------------------------------------------------------------------------------|
|  * Métricas    |  +----------------------+ +----------------------+ +--------------------------+ |
|  - Config.     |  | FAMÍLIA #1 NO APP    | | NOTA MAIS DESEJADA   | | FORÇA DOS DECANTS (<=15) | |
|                |  | 🌲 Amadeirado (41%)  | | ✨ Sândalo (32%)     | | 🧪 64% das unidades vend.| |
|                |  | dos clientes NŌTA    | | nos perfis olfativos | | Ticket médio: R$ 58,90   | |
|                |  +----------------------+ +----------------------+ +--------------------------+ |
|                |                                                                                 |
|                |  +--------------------------------------+ +-----------------------------------+ |
|                |  | MAPA DE DEMANDA POR FAMÍLIA OLFATIVA | | TOP 10 NOTAS FAVORITAS NO APP     | |
|                |  |                                      | |                                   | |
|                |  | Amadeirado  [████████████░░] 41%     | | #1 Sândalo (32%)   #6 Âmbar (18%) | |
|                |  | Oriental    [██████████░░░░] 35%     | | #2 Baunilha (29%)  #7 Rosa (16%)  | |
|                |  | Floral      [█████████░░░░░] 31%     | | #3 Bergamota (27%) #8 Cedro (15%) | |
|                |  | Cítrico     [███████░░░░░░░] 24%     | | #4 Oud (23%)       #9 Musk (14%)  | |
|                |  | Gourmand    [██████░░░░░░░░] 20%     | | #5 Lavanda (21%)  #10 Íris (12%)  | |
|                |  +--------------------------------------+ +-----------------------------------+ |
|                |                                                                                 |
|                |  +----------------------------------------------------------------------------+ |
|                |  | TERMÔMETRO DE FORMATOS NO MARKETPLACE: DECANTS (<=15ml) vs FRASCOS (>15ml) | |
|                |  | [ 🧪 Decants: 64% das vendas (R$ 58,90 méd.) | 🍾 Frascos: 36% (R$ 689) ] | |
|                |  +----------------------------------------------------------------------------+ |
|                |                                                                                 |
|                |  +----------------------------------------------------------------------------+ |
|                |  | TOP 5 PERFUMES EM ALTA NA PLATAFORMA NŌTA                                  | |
|                |  | # | Perfume / Marca          | Família    | Vendas | Menor Preço | Status  | |
|                |  | 1 | Santal 33 (Le Labo)      | Amadeirado | 124 un | R$ 65,00    | [No seu]| |
|                |  | 2 | Baccarat Rouge 540       | Oriental   |  98 un | R$ 89,00    | [Oport.]| |
|                |  +----------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

---

## 5. Critérios de Aceitação (CA)

- **CA-01:** Ao clicar no item **"Métricas"** do menu lateral em `SellerHomePage` ou `BrandHomePage`, o placeholder *"Página em desenvolvimento"* não deve mais existir; em seu lugar deve ser exibido o módulo de Métricas.
- **CA-02:** O endpoint `GET /api/v1/stores/me/market-metrics/` deve retornar status `200 OK` para vendedores e donos de marca autenticados, e `401`/`403` para usuários anônimos ou clientes sem loja.
- **CA-03:** O gráfico de Famílias Olfativas deve refletir os dados reais salvos em `CustomUser.olfactory_families` no banco de dados.
- **CA-04:** O ranking de Top 10 Notas Olfativas deve consolidar as notas de `CustomUser.preferred_notes` (com fallback inteligente para notas do catálogo caso haja poucos usuários no banco de teste).
- **CA-05:** O Termômetro Decants vs. Frascos deve separar corretamente ofertas e vendas com `volume_ml <= 15` (Decants) de `volume_ml > 15` (Frascos).
- **CA-06:** A tabela de Top 5 Perfumes em Alta deve indicar claramente se cada perfume listado já faz parte ou não do catálogo da loja autenticada (`in_my_catalog`).

---

## 6. Especificação de Testes (TDD)

### Backend (`backend/apps/stores/tests/test_market_metrics.py`)
1. `test_market_metrics_requires_seller_or_brand_authentication`: garante que clientes comuns (`customer`) ou anônimos recebam `403`/`404` e `401`.
2. `test_market_metrics_aggregates_customer_olfactory_families_and_notes`: cria 3 clientes com perfis olfativos distintos (`["Amadeirado", "Oriental"]`, `["Amadeirado"]`, `["Floral"]`) e notas (`["Sândalo", "Oud"]`), chama `GET /api/v1/stores/me/market-metrics/` e valida que `Amadeirado` lidera o ranking com a contagem e porcentagem corretas, além do fallback de notas da pirâmide.
3. `test_market_metrics_decants_vs_bottles_split`: cria ofertas de `10ml` e `100ml` e pedidos pagos para ambas, verificando que `format_thermometer.decants` e `format_thermometer.bottles` calculam os percentuais e valores médios corretamente.
4. `test_market_metrics_trending_products_and_benchmarks`: verifica o radar de competitividade (`catalog_price_comparison`) e que um produto vendido pela loja logada retorna `in_my_catalog = True` e outro vendido apenas por concorrente retorna `in_my_catalog = False`.
5. `test_market_metrics_accessible_by_brand_owner`: garante que donos de marca (`BRAND_OWNER`) autenticados com loja oficial D2C vinculada acessam o endpoint com `200 OK`.

### Frontend Web (`web/src/features/store/MarketMetricsSection.test.tsx`)
1. Renderiza `MarketMetricsSection` com mock da API e verifica a exibição dos 4 KPIs, barras de família olfativa, 10 notas mais desejadas, termômetro de formatos, competitividade do catálogo e tabela de perfumes mais vendidos com as badges `"No catálogo"` / `"Oportunidade"`.

---

## 7. Arquivos Envolvidos

- `backend/apps/stores/views.py`, `backend/apps/stores/urls.py` e `backend/apps/stores/services/market_metrics_service.py` (novo endpoint `GET /api/v1/stores/me/market-metrics/`)
- `backend/apps/stores/tests/test_market_metrics.py` (testes automatizados de agregação de mercado)
- `web/src/features/store/MarketMetricsSection.tsx` e `web/src/types/marketMetrics.ts` (novo componente da Visão de Mercado)
- `web/src/pages/SellerHomePage.tsx` e `web/src/pages/BrandHomePage.tsx` (integração na aba `metrics`)

