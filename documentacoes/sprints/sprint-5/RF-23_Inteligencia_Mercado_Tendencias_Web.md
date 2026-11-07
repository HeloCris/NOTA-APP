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
3. Qual é o **preço médio praticado no mercado** por família olfativa e por formato (permitindo ao vendedor saber se seu preço está competitivo);
4. Quais são os **Top 5 Perfumes e Marcas em alta** na plataforma.

---

## 2. Regras de Negócio (RN)

### RN-01: Privacidade e Agregação Anônima de Dados de Mercado
- Os indicadores de mercado (`market-metrics`) devem ser **100% agregados e anonimizados**.
- Nenhum vendedor pode visualizar dados individuais de clientes (nomes, e-mails) nem o faturamento individual de uma loja concorrente específica; todos os números de mercado representam a soma/média global da plataforma NŌTA.

### RN-02: Cálculo do Mapa de Calor de Famílias Olfativas dos Clientes
- O backend deve percorrer os usuários ativos do tipo `customer` que possuem `olfactory_families` preenchido e contabilizar a frequência de cada uma das 7 famílias oficiais (`Floral`, `Amadeirado`, `Oriental`, `Cítrico`, `Aromático`, `Couriado`, `Gourmand`).
- O percentual de cada família é calculado sobre o total de votos/preferências registradas:
  $$\text{Share da Família (\%)} = \text{round}\left(\frac{\text{Clientes que escolheram a família}}{\text{Total de clientes com perfil olfativo}} \times 100\right)$$

### RN-03: Ranking das Top 10 Notas Olfativas Mais Desejadas
- O backend deve agregar os arrays JSON `CustomUser.preferred_notes` de todos os clientes ativos, normalizando capitalização (`strip().title()`), e retornar as **10 notas mais frequentes** em ordem decrescente de clientes adeptos.
- Caso o banco tenha menos de 5 clientes com `preferred_notes` preenchidas (ambiente recém-instalado), o endpoint deve complementar o ranking com as notas mais presentes nos produtos de maior `sold_count` do catálogo, garantindo que o gráfico nunca fique vazio em apresentações.

### RN-04: Termômetro de Formato do Mercado (Decants vs. Frascos)
- Toda oferta (`StoreProduct`) e todo item de pedido (`OrderItem` de pedidos com status `paid`, `shipped` ou `delivered`) é classificado como:
  - **Decant / Amostra:** `volume_ml <= 15`
  - **Frasco Completo:** `volume_ml > 15`
- O endpoint deve retornar tanto a divisão de **Unidades Vendidas (Demanda)** quanto a divisão de **Ofertas Ativas no Marketplace (Oferta)** entre Decants e Frascos.

### RN-05: Benchmark de Preço Médio por Família e Formato
- Para cada família olfativa que possua ofertas ativas (`StoreProduct.status = 'active'`), o backend deve calcular:
  - `avg_decant_price`: média de `price` das ofertas ativas com `volume_ml <= 15`;
  - `avg_bottle_price`: média de `price` das ofertas ativas com `volume_ml > 15`;
  - `my_store_avg_price`: média de `price` das ofertas ativas da **própria loja logada** naquela família (ou `null` se a loja não trabalhar com aquela família), permitindo comparação direta *"Meu Preço vs. Mercado"*.

### RN-06: Top 5 Perfumes Mais Populares da Plataforma
- O ranking de perfumes em alta deve ordenar os produtos ativos (`Product.status = 'published'`) por `sold_count` decrescente (com desempate por quantidade de lojas que ofertam o produto) e informar: nome, marca, família olfativa, `sold_count`, menor preço ativo no marketplace e uma flag booleana `in_my_catalog` indicando se o vendedor logado já vende aquele perfume.

---

## 3. Requisitos Funcionais Detalhados

### RF-23.1: Endpoint de Inteligência de Mercado (`GET /api/v1/stores/me/market-metrics/`)
Criar a view `StoreMarketMetricsView` em `backend/catalog/views.py` (ou `backend/stores/views.py`) acessível para usuários autenticados com loja vinculada (`seller` ou `brand_owner`):
- **Response (`200 OK`):**
  ```json
  {
    "summary": {
      "total_customers_with_profile": 142,
      "total_active_Catalog_products": 30,
      "total_active_marketplace_offers": 85,
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
    "price_benchmark_by_family": [
      {
        "family": "Amadeirado",
        "market_avg_decant_price": "62.50",
        "market_avg_bottle_price": "740.00",
        "my_store_avg_price": "690.00"
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
Na aba **"Métricas"** (`SellerHomePage.tsx` e `BrandHomePage.tsx`), estruturar um cabeçalho com alternância clara (Tabs internas ou seções integradas):
- **Aba 1: 🌍 Inteligência de Mercado & Tendências (RF-23)**
- **Aba 2: 📊 Desempenho da Minha Loja & Oportunidades (RF-24)**

### RF-23.3: Componente `MarketMetricsSection.tsx`
Criar `web/src/features/store/MarketMetricsSection.tsx` com a identidade visual *Warm Luxury* da NŌTA (`#FAF8F5`, `#1A1714`, `#B8965A`, `#FFFFFF`, bordas `#E8E0D5`) contendo:
1. **KPIs de Pulso do Mercado (4 Cards Superiores):**
   - **Família Mais Desejada na NŌTA:** Nome da família líder + `%` de preferência dos clientes.
   - **Nota Olfativa #1 do Momento:** Nome da nota líder + quantidade de fãs.
   - **Demanda por Decants ($\le 15\text{ml}$):** `%` das unidades vendidas no marketplace que são decants + ticket médio de decant.
   - **Catálogo Ativo no Ecossistema:** Total de fragrâncias publicadas e ofertas ativas.
2. **Gráfico de Barras Horizontais — Preferência por Família Olfativa:**
   - Exibe as 7 famílias ordenadas pela preferência dos consumidores (`share_pct`), com barra de progresso em dourado `#B8965A` e comparativo de quantos perfumes existem no catálogo para cada família.
3. **Nuvem / Ranking Top 10 Notas da Pirâmide Mais Buscadas:**
   - Lista ou grid visual das 10 notas favoritas dos clientes com badges de posição (`#1`, `#2`...) e percentual de afinidade.
4. **Termômetro Decants ($\le 15\text{ml}$) vs. Frascos ($> 15\text{ml}$):**
   - Barra comparativa dual mostrando a proporção de vendas em unidades e o ticket médio de cada formato no marketplace, ajudando o lojista a decidir se vale a pena fracionar perfumes em decants de `5ml`/`10ml`.
5. **Tabela de Benchmark de Preços por Família e Ranking Top 5 Perfumes da Plataforma:**
   - Na tabela de Top 5 Perfumes em Alta, exibir uma badge verde `"✓ No seu catálogo"` quando `in_my_catalog === true`, ou uma badge amarela `"Oportunidade de oferta"` quando `in_my_catalog === false`.

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

### Backend (`backend/catalog/tests.py` ou `backend/stores/tests.py`)
1. `test_market_metrics_requires_seller_or_brand_authentication`: garante que clientes comuns (`customer`) ou anônimos recebam `403`/`401`.
2. `test_market_metrics_aggregates_customer_olfactory_families_and_notes`: cria 3 clientes com perfis olfativos distintos (`["Amadeirado", "Oriental"]`, `["Amadeirado"]`, `["Floral"]`) e notas (`["Sândalo", "Oud"]`), chama `GET /api/v1/stores/me/market-metrics/` e valida que `Amadeirado` lidera o ranking com a contagem e porcentagem corretas.
3. `test_market_metrics_decants_vs_bottles_split`: cria ofertas de `10ml` e `100ml` e pedidos pagos para ambas, verificando que `format_thermometer.decants` e `format_thermometer.bottles` calculam os percentuais e tickets médios corretamente.
4. `test_market_metrics_trending_products_flags_in_my_catalog`: verifica se um produto vendido pela loja logada retorna `in_my_catalog = True` e outro vendido apenas por concorrente retorna `in_my_catalog = False`.

### Frontend Web (`web/src/features/store/__tests__/MarketMetricsSection.test.tsx`)
1. Renderiza `MarketMetricsSection` com mock da API e verifica a exibição dos 4 KPIs, barras de família olfativa, Top 10 notas, termômetro de decants e tabela de Top 5 perfumes com as badges `"No seu catálogo"` / `"Oportunidade"`.

---

## 7. Arquivos Envolvidos

- `backend/stores/views.py` e `backend/stores/urls.py` (novo endpoint `GET /api/v1/stores/me/market-metrics/`)
- `backend/stores/tests.py` (testes automatizados de agregação de mercado)
- `web/src/features/store/MarketMetricsSection.tsx` (novo componente da Visão de Mercado)
- `web/src/pages/SellerHomePage.tsx` e `web/src/pages/BrandHomePage.tsx` (integração na aba `metrics`)

