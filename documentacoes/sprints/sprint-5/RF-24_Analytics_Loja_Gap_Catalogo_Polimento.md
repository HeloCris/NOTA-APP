# RF-24: Analytics da Loja, Diagnóstico de Gap de Catálogo e Polimento Final (Web & Mobile)

**Sprint:** 05 (Fechamento do Produto)  
**Prioridade:** Alta  
**Estimativa:** 6 Story Points  
**Dependências:** `RF-18` (Pedidos e Dashboard), `RF-19` (Cupons e Seguidores), `RF-23` (Métricas de Mercado)  

---

## 1. Descrição e Propósito de Negócio

Complementando a `RF-23` (que mostra os dados macro do mercado), esta **RF-24** entrega a **Parte 2 da aba Métricas no Web (`StoreAnalyticsSection.tsx`)**, focada na **inteligência interna e acionável da própria loja**, além de concluir o **polimento final de pontas soltas** identificadas na auditoria visual do Web e do App Mobile para a apresentação final do projeto:

1. **Analytics Profundo da Loja + Diagnóstico de *Gap de Catálogo* (Web):**
   - Além de ver o seu funil de conversão (`views_count` $\rightarrow$ itens vendidos $\rightarrow$ receita), o mix de vendas da sua loja (Decants vs. Frascos), a performance de Cupons (`RF-19`) e a retenção de Seguidores (`RF-19`), o lojista recebe uma matriz exclusiva de **"Oportunidades de Estoque (Gap Olfativo)"**: o sistema cruza as Famílias e Notas mais desejadas pelos usuários da NŌTA com o estoque atual da loja e avisa quais notas/famílias em alta a loja ainda **não possui** em seu catálogo.
2. **Busca Rápida Funcional na Topbar do Painel Web:**
   - O campo `"Pesquisar no painel..."` no topo de `SellerHomePage` e `BrandHomePage` hoje é apenas decorativo. Ele passará a filtrar ou navegar rapidamente para produtos/pedidos.
3. **Polimento da Aba Minha Conta no Mobile (`account/index.tsx`):**
   - O botão `"Editar"` no card de **Dados Pessoais** hoje aponta para uma rota inexistente (`/account/edit-profile`). Será implementado um **Modal de Edição de Dados Pessoais** integrado ao endpoint já existente `PATCH /api/v1/auth/me/`.
   - O item `"Configurações"` no menu da conta possui `onPress: () => {}` sem função; será removido para que 100% dos botões do aplicativo executem ações reais.
4. **Enriquecimento do `seed_catalog` para Demonstração Completa:**
   - Garantir que o comando `python manage.py seed_catalog` crie também lojas de demonstração, ofertas variadas de **Decants (`5ml`, `10ml`)** e **Frascos (`50ml`, `100ml`)**, clientes com perfis olfativos e avaliações, deixando todas as telas das `RF-20` a `RF-24` ricas em dados logo após rodar o seed.

---

## 2. Regras de Negócio (RN)

### RN-01: Filtro Temporal das Métricas da Loja (`period=7d|30d|all`)
- O endpoint `GET /api/v1/stores/me/analytics/` deve aceitar o query param `period` (`7d`, `30d` ou `all`, padrão `30d`).
- O cálculo de receita, pedidos, itens vendidos, uso de cupons e novos seguidores deve respeitar a janela temporal selecionada, considerando apenas pedidos válidos (`paid`, `shipped`, `delivered`).

### RN-02: Algoritmo de Diagnóstico de *Gap de Catálogo* (Oportunidades Olfativas)
- O backend deve comparar as **Top Famílias** e **Top Notas** mais desejadas pelos clientes da NŌTA com as famílias e notas presentes nas ofertas ativas (`StoreProduct.status = 'active'` e `stock_quantity > 0`) da loja autenticada:
  - **Família Descoberta (Gap de Família):** Família olfativa com demanda de clientes $> 10\%$ onde a loja possui `0` ofertas ativas em estoque.
  - **Nota em Alta Descoberta (Gap de Nota):** Nota presente no Top 10 de preferências dos clientes onde a loja possui `0` ofertas ativas contendo aquela nota na pirâmide (`top_notes`, `heart_notes` ou `base_notes`).
- Para cada Gap identificado, o endpoint deve sugerir até **2 perfumes do catálogo mestre (`Product`)** que pertencem àquela família/nota e que a loja ainda não cadastrou como `StoreProduct`, permitindo ação imediata (*"Cadastrar oferta deste perfume"*).

### RN-03: Funil de Interesse e Conversão da Vitrine
- O funil da loja deve consolidar:
  1. **Visualizações de Vitrine (`store.views_count`)**;
  2. **Seguidores Conquistados (`StoreFollower.objects.filter(store=store).count()`)**;
  3. **Pedidos Pagos/Concluídos**;
  4. **Taxa de Conversão Estimada:** $\text{round}\left(\frac{\text{Total de Pedidos Pagos}}{\max(\text{views\_count}, 1)} \times 100, 1\right)\%$.

### RN-04: Performance de Cupons e Fidelização (`RF-19`)
- A seção de analytics da loja deve exibir:
  - Quantidade de pedidos que utilizaram cupom vs. pedidos sem cupom;
  - Total de desconto concedido (`sum(discount_amount)`) vs. Receita gerada por pedidos com cupom;
  - Cupom campeão de usos da loja (`StoreCoupon` com mais aplicações).

### RN-05: Edição de Dados Pessoais no Mobile (`PATCH /api/v1/auth/me/`)
- O cliente autenticado pode editar seu `full_name` e `phone` (ou `city`/`state` se aplicável) diretamente em um Modal na tela `account/index.tsx`.
- O `email` deve ser exibido como somente leitura (para preservar a integridade de credenciais de login).
- Ao salvar, o estado local do `useAuth()` e o card de Dados Pessoais devem atualizar imediatamente sem exigir novo login.

---

## 3. Requisitos Funcionais Detalhados

### RF-24.1: Endpoint de Analytics da Loja (`GET /api/v1/stores/me/analytics/`)
Criar `StoreAnalyticsView` em `backend/stores/views.py`:
- **Query Params:** `?period=7d|30d|all` (default: `30d`)
- **Response (`200 OK`):**
  ```json
  {
    "period": "30d",
    "funnel": {
      "store_views": 420,
      "followers_count": 38,
      "new_followers_in_period": 12,
      "paid_orders_count": 29,
      "conversion_rate_pct": 6.9
    },
    "format_mix": {
      "decants_units_sold": 42,
      "decants_revenue": "2478.00",
      "bottles_units_sold": 11,
      "bottles_revenue": "7590.00"
    },
    "coupons_performance": {
      "active_coupons_count": 2,
      "orders_with_coupon": 9,
      "total_discount_granted": "410.50",
      "revenue_with_coupon": "3694.50",
      "top_coupon_code": "BEMVINDO10"
    },
    "top_store_offers": [
      {
        "store_product_id": 12,
        "product_name": "Santal 33",
        "brand_name": "Le Labo",
        "volume_ml": 10,
        "is_decant": true,
        "price": "65.00",
        "stock_quantity": 14,
        "units_sold": 19,
        "revenue": "1235.00"
      }
    ],
    "catalog_gaps": [
      {
        "type": "family",
        "name": "Gourmand",
        "customer_demand_pct": 22,
        "my_active_offers_count": 0,
        "suggested_products": [
          { "id": 14, "name": "La Vie Est Belle", "brand_name": "Lancôme" }
        ]
      },
      {
        "type": "note",
        "name": "Baunilha",
        "customer_demand_pct": 29,
        "my_active_offers_count": 0,
        "suggested_products": [
          { "id": 18, "name": "Black Opium", "brand_name": "Yves Saint Laurent" }
        ]
      }
    ]
  }
  ```

### RF-24.2: Componente `StoreAnalyticsSection.tsx` no Painel Web
Criar `web/src/features/store/StoreAnalyticsSection.tsx` (acessado na aba `"📊 Desempenho da Minha Loja"` dentro de **Métricas**):
1. **Seletor de Período (`Últimos 7 dias`, `Últimos 30 dias`, `Todo o período`)**.
2. **Cards de Funil & Fidelização:** Visualizações da Vitrine, Seguidores Totais (+ novos no período), Taxa de Conversão e Receita Gerada com Cupons.
3. **Diagnóstico de Oportunidades de Estoque (*Gap Olfativo*):**
   - Cards de alerta inteligente destacando as famílias e notas muito buscadas pelos clientes da NŌTA que a loja ainda não vende, com botão de atalho `"Ir para Produtos e Ofertar"` que redireciona o lojista para a aba `products`.
4. **Ranking das Ofertas Campeãs da Loja (por Volumetria):**
   - Tabela com os produtos mais vendidos da própria loja, diferenciando Decants (`🧪 10ml`) e Frascos (`🍾 100ml`), estoque restante e receita acumulada.

### RF-24.3: Busca Rápida na Topbar Web (`SellerHomePage.tsx` e `BrandHomePage.tsx`)
- Conectar o input `"Pesquisar no painel..."` da Topbar: ao digitar um termo e pressionar `Enter` (ou clicar em buscar), alternar automaticamente para a aba `products` repassando o termo de busca para filtrar os produtos da loja, ou permitir limpar o filtro rapidamente.

### RF-24.4: Modal de Edição de Dados Pessoais e Limpeza de Menu no Mobile (`account/index.tsx`)
- Em `mobile/src/app/(shop)/account/index.tsx`:
  - Substituir o `router.push('/account/edit-profile')` (rota inexistente) por um **Modal nativo elegante** onde o usuário edita **Nome Completo** (`full_name`) e **Telefone** (`phone`), enviando `PATCH /api/v1/auth/me/` e atualizando o contexto `useAuth()`.
  - Remover o item `"Configurações"` (`icon: 'settings-outline'`, `onPress: () => {}`) da lista `menuItems`, mantendo apenas itens 100% funcionais (`Meus Pedidos`, `Lojas que Sigo`, `Dúvidas e Suporte` e `Sair da conta`).

### RF-24.5: Enriquecimento do `seed_catalog.py`
- Atualizar `backend/catalog/management/commands/seed_catalog.py` (ou comando equivalente) para garantir a criação idempotente de:
  - Pelo menos 2 lojas ativas (`Atelier des Décants` e `Maison NŌTA Parfums`);
  - Pelo menos 15 ofertas (`StoreProduct`) combinando Decants (`5ml`, `10ml`) e Frascos (`50ml`, `100ml`);
  - Clientes de exemplo com `olfactory_families` e `preferred_notes` diversificados, gerando gráficos ricos imediatamente na aba Métricas Web e recomendações reais no App Mobile.

---

## 4. Fluxo de Telas (Wireframes ASCII)

### 4.1. Painel Web — Aba Métricas (Visão 2: Desempenho da Minha Loja & Gaps)
```text
+--------------------------------------------------------------------------------------------------+
| [Sidebar NŌTA] |  Métricas e Inteligência                                  Período: [ 30 dias v ]|
|                |                                                                                 |
|  - Início      |  [ 🌍 Inteligência de Mercado ]   [ 📊 Desempenho da Minha Loja (Ativo) ]       |
|  - Produtos    |---------------------------------------------------------------------------------|
|  - Cupons      |  +----------------------+ +----------------------+ +--------------------------+ |
|  * Métricas    |  | FUNIL DA VITRINE     | | COMUNIDADE & CUPONS  | | MIX DE RECEITA DA LOJA   | |
|  - Config.     |  | 420 visitas -> 29 ped| | 38 seguidores (+12)  | | 🧪 Decants: R$ 2.478     | |
|                |  | Conversão: 6,9%      | | Cupom top: BEMVINDO10| | 🍾 Frascos: R$ 7.590     | |
|                |  +----------------------+ +----------------------+ +--------------------------+ |
|                |                                                                                 |
|                |  +----------------------------------------------------------------------------+ |
|                |  | 💡 DIAGNÓSTICO DE GAP DE CATÁLOGO (OPORTUNIDADES DE ESTOQUE)               | |
|                |  | Cruzamos o perfil olfativo dos clientes NŌTA com o seu estoque atual:      | |
|                |  |                                                                            | |
|                |  | [!] Nota em Alta sem Estoque: BAUNILHA (29% dos clientes amam)             | |
|                |  |     Você possui 0 ofertas ativas com Baunilha.                             | |
|                |  |     Sugestão do catálogo: Black Opium (YSL)    [ + Ofertar na minha loja ] | |
|                |  |                                                                            | |
|                |  | [!] Família Descoberta: GOURMAND (22% de demanda no app)                   | |
|                |  |     Sugestão do catálogo: La Vie Est Belle     [ + Ofertar na minha loja ] | |
|                |  +----------------------------------------------------------------------------+ |
|                |                                                                                 |
|                |  +----------------------------------------------------------------------------+ |
|                |  | RANKING DE OFERTAS CAMPEÃS DA SUA LOJA                                     | |
|                |  | Perfume / Marca        | Formato       | Estoque | Vendidos | Receita      | |
|                |  | Santal 33 (Le Labo)    | 🧪 Decant 10ml| 14 un   | 19 un    | R$ 1.235,00  | |
|                |  | Bleu de Chanel         | 🍾 Frasco 100m|  4 un   |  6 un    | R$ 5.340,00  | |
|                |  +----------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

### 4.2. Mobile — Modal de Edição de Dados Pessoais (`account/index.tsx`)
```text
+------------------------------------------+
|  Editar Dados Pessoais               [X] |
|------------------------------------------|
|  Nome Completo                           |
|  [ Ana Beatriz                         ] |
|                                          |
|  Telefone / WhatsApp                     |
|  [ (11) 99876-5432                     ] |
|                                          |
|  E-mail (não editável)                   |
|  [ cliente@nota.com                    ] |
|                                          |
|  [ Cancelar ]      [ Salvar Alterações ] |
+------------------------------------------+
```

---

## 5. Critérios de Aceitação (CA)

- **CA-01:** O endpoint `GET /api/v1/stores/me/analytics/?period=30d` deve retornar o funil da loja, mix Decants vs. Frascos da loja, performance de cupons (`RF-19`), ranking de ofertas da loja e a lista `catalog_gaps`.
- **CA-02:** O diagnóstico de `catalog_gaps` deve identificar corretamente pelo menos uma família ou nota popular entre os clientes que a loja autenticada ainda não possui em estoque ativo, sugerindo produtos existentes no catálogo mestre.
- **CA-03:** Na Topbar do Painel Web (`SellerHomePage` e `BrandHomePage`), digitar um termo na barra de busca e submeter deve levar o usuário à aba de Produtos filtrando pelo termo digitado.
- **CA-04:** Na tela `Minha Conta` (`mobile/src/app/(shop)/account/index.tsx`), clicar em `"Editar"` no card de Dados Pessoais deve abrir o modal de edição, persistir as alterações via `PATCH /api/v1/auth/me/` e refletir o novo nome imediatamente na tela.
- **CA-05:** O item sem ação `"Configurações"` não deve mais aparecer no menu da tela `Minha Conta` do Mobile.
- **CA-06:** Executar `python manage.py seed_catalog` em um banco limpo deve popular produtos, lojas, ofertas de decants e frascos e perfis olfativos sem erros.

---

## 6. Especificação de Testes (TDD)

### Backend (`backend/stores/tests.py`)
1. `test_store_analytics_returns_funnel_and_coupon_metrics`: cria loja com `views_count=100`, 2 seguidores, 1 cupom e 2 pedidos pagos (1 com cupom), verificando que `GET /api/v1/stores/me/analytics/` retorna as contagens e somas exatas.
2. `test_store_analytics_identifies_catalog_gaps`: cria clientes fãs da família `Gourmand` e da nota `Baunilha`, cria um produto `Gourmand` no catálogo mestre e uma loja que vende apenas perfumes `Cítricos`; verifica que `catalog_gaps` aponta `Gourmand` e `Baunilha` com a sugestão do produto correspondente.
3. `test_patch_auth_me_updates_customer_name_and_phone`: valida que `PATCH /api/v1/auth/me/` atualiza `full_name` e `phone` do cliente autenticado.

### Frontend Web (`web/src/features/store/__tests__/StoreAnalyticsSection.test.tsx`)
1. Renderiza `StoreAnalyticsSection` e verifica a troca do seletor de período (`7d`, `30d`, `all`), a renderização dos alertas de *Gap de Catálogo* e o clique no botão `"Ofertar na minha loja"`.

---

## 7. Arquivos Envolvidos

- `backend/stores/views.py` e `backend/stores/urls.py` (endpoint `GET /api/v1/stores/me/analytics/`)
- `backend/catalog/management/commands/seed_catalog.py` (enriquecimento de dados de demonstração)
- `backend/stores/tests.py` (testes do analytics e diagnóstico de gap)
- `web/src/features/store/StoreAnalyticsSection.tsx` (novo componente da Visão da Loja)
- `web/src/pages/SellerHomePage.tsx` e `web/src/pages/BrandHomePage.tsx` (alternância de abas em Métricas + busca rápida na Topbar)
- `mobile/src/app/(shop)/account/index.tsx` (Modal de edição de Dados Pessoais + remoção do item morto `"Configurações"`)

