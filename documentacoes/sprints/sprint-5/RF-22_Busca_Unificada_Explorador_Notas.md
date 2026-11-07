# RF-22 — Busca Unificada e Explorador por Notas Olfativas

> **Sprint:** 5  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 6 SP  
> **Depende de:** RF-03 (Catálogo e Pirâmide Olfativa), RF-05 (Vitrine Pública), RF-20 (Catálogo de Notas e Match)

---

## Descrição

Reconstrói por completo a aba de **Busca (`mobile/src/app/(shop)/explore.tsx`)** e o motor de busca de produtos do backend (`GET /api/v1/products/`), resolvendo o problema atual em que a lupa de pesquisa filtrava apenas nomes de lojas e mantinha produtos fictícios fixos (*"Tom Ford Oud Wood"* e *"Natura Essência do Brasil"*).

Com esta RF, a barra de pesquisa (lupa) passa a buscar em tempo real (com *debounce* de 300ms) por **Nome do Perfume**, **Marca**, **Família Olfativa**, **Notas da Pirâmide (`top_notes`, `heart_notes`, `base_notes`)** e **Lojas**, além de entregar o **Explorador Visual por Notas Olfativas, Formato (Decants vs. Frascos), Marcas Reais e Ordenação de Preço/Popularidade** especificado na arquitetura do NŌTA.

---

## Regras de Negócio

### 1. Motor de Busca Unificado no Backend (`GET /api/v1/products/`)

| ID | Regra |
|---|---|
| **RN-01** | **Escopo Público da Busca do Consumidor:** Quando chamado pelo app do consumidor (ou com `?available_only=true`), o endpoint retorna apenas produtos aprovados (`is_approved = True`) que possuam pelo menos uma oferta ativa (`StoreProduct` com `is_available = True`, `stock_quantity > 0` e `store__is_active = True`). *(Nota: para o autocomplete interno de cadastro de estoque do lojista/marca na Web, o comportamento de buscar no catálogo global permanece preservado).* |
| **RN-02** | **Busca Textual Abrangente (`?search=`):** Digitar um termo na lupa deve retornar produtos cujo termo apareça (case-insensitive) em qualquer um dos seguintes campos:<br>1. Nome do perfume (`Product.name`)<br>2. Nome da marca (`Product.brand.name`)<br>3. Família olfativa (`Product.olfactory_family`)<br>4. Qualquer nota de saída, coração ou fundo (`top_notes`, `heart_notes`, `base_notes`).<br>*Exemplo:* Digitar `"Baunilha"` ou `"Bergamota"` ou `"Maison"` na lupa retorna imediatamente todos os perfumes correspondentes. |
| **RN-03** | **Filtro Combinado por Notas Olfativas (`?notes=`):** O endpoint aceita uma lista de notas separadas por vírgula (ex.: `?notes=Bergamota,Baunilha`). Retorna todos os perfumes que contenham **ao menos uma** das notas selecionadas em qualquer camada da sua pirâmide (`top_notes`, `heart_notes` ou `base_notes`), priorizando no topo os perfumes que combinam **mais notas simultaneamente**. |
| **RN-04** | **Filtro por Formato / Volumetria (`?type=decant|bottle`):**<br>- `type=decant`: retorna apenas perfumes que possuem oferta disponível com `volume_ml <= 15` (5ml, 10ml ou 15ml).<br>- `type=bottle`: retorna apenas perfumes que possuem oferta disponível com `volume_ml > 15` (frascos de 30ml, 50ml, 75ml, 100ml, etc.). |
| **RN-05** | **Filtros Adicionais e Ordenação (`?ordering=`):** Suporta combinação com `?olfactory_family=`, `?brand=`, `?gender=`, `?min_price=`, `?max_price=` e ordenação por:<br>- `popular` (padrão): maior `sold_count` e maior `match_percentage`<br>- `price_asc`: menor preço de entrada (`min_price`)<br>- `price_desc`: maior preço de entrada (`min_price`). |

### 2. Experiência de UX na Aba Busca (`(shop)/explore.tsx`)

| ID | Regra |
|---|---|
| **RN-06** | **Barra de Pesquisa (Lupa) Reativa:**<br>- Campo com ícone de lupa, *debounce* de `300ms`, botão `✕` para limpar rapidamente o texto e indicador sutil de carregamento.<br>- Ao digitar ou selecionar qualquer filtro, a tela exibe o contador de resultados (`"X perfumes encontrados"`) + botão **"Limpar todos os filtros"**. |
| **RN-07** | **Seletor Visual de Notas Olfativas ("Buscar por Notas"):**<br>- Painel expansível/modal diretamente na aba Busca permitindo selecionar notas agrupadas em **🌿 Notas de Saída**, **🌸 Notas de Coração** e **🪵 Notas de Fundo** (carregadas de `GET /api/v1/catalog/notes/`).<br>- Inclui botão de atalho **"✨ Usar minhas notas favoritas"** que aplica com 1 toque as `preferred_notes` salvas no perfil do cliente logado. |
| **RN-08** | **Chips de Filtro Rápido e Recepção de Parâmetros da Home:**<br>- A aba `explore.tsx` deve ler os parâmetros de rota vindos da Home (`?family=`, `?type=decant`, `?openNotes=1`, `?brand=`) e aplicar os filtros automaticamente ao abrir.<br>- Chips rápidos sempre visíveis abaixo da lupa: `[ Todos ]`, `[ 🧪 Decants (≤15ml) ]`, `[ 🍾 Frascos ]` e as 7 Famílias Olfativas. |
| **RN-09** | **Remoção Total dos Produtos e Marcas Estáticos:**<br>- As listas fixas de marcas e os 2 produtos em SVG (`Tom Ford Oud Wood` id 4 e `Natura Essência do Brasil` id 5) são removidos.<br>- As **Marcas em Destaque** vêm de `GET /api/v1/brands/`, e tocar em uma marca filtra os perfumes daquela marca.<br>- A seção de produtos renderiza os perfumes reais do banco com preço real (`"A partir de R$ X"`), badges de família/notas, tag de Decant disponível e navegação funcional para `/product/[id]`. |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-22.1** | **[Backend — Busca Avançada de Produtos]** Atualizar `ProductListCreateView` (`apps/catalog/views.py`) para suportar `?available_only=true`, busca textual unificada (`name`, `brand__name`, `olfactory_family`, `top_notes`, `heart_notes`, `base_notes`), `?notes=a,b`, `?type=decant|bottle`, `?min_price=`, `?max_price=` e `?ordering=popular|price_asc|price_desc`. |
| **RF-22.2** | **[Mobile — Serviços de Busca e Marcas]** Atualizar `mobile/src/services/stores.ts` adicionando `getBrands()` (`GET /api/v1/brands/`) e expandindo `getProducts(params)` com os novos filtros (`notes`, `type`, `available_only`, `ordering`, `min_price`, `max_price`). |
| **RF-22.3** | **[Mobile — Reconstrução de `(shop)/explore.tsx`]** Substituir a tela estática por uma interface fluida contendo:<br>1. Barra de busca com lupa funcional (`debounce` 300ms) + botão de abrir o **Filtro por Notas Olfativas** (com contador de notas ativas).<br>2. Chips horizontais de formato (`Todos`, `🧪 Decants`, `🍾 Frascos`) e Famílias Olfativas.<br>3. Gaveta/painel colapsável de **Pirâmide de Notas** (Saída, Coração, Fundo) + botão *"✨ Usar minhas notas favoritas"*.<br>4. Seção de **Marcas** (clicável para filtrar) e **Lojas Encontradas** (clicável para abrir `/store/[id]`).<br>5. Grid de 2 colunas com os **Perfumes Encontrados** + seletor de ordenação (`Mais relevantes`, `Menor preço`, `Maior preço`) + estado vazio com botão *"Limpar filtros"*. |

---

## Fluxo de Interface e Comportamento

### Aba Busca e Explorador por Notas (`/(shop)/explore.tsx`)
```text
┌─────────────────────────────────────────────┐
│ [ 🔍 Buscar perfume, nota, marca...   [✕] ] │
├─────────────────────────────────────────────┤
│ [ Todos ] [ 🧪 Decants ] [ 🍾 Frascos ]     │
│ [ 🌿 Filtrar por Notas (2) ▼ ] [ Amadeir. ] │
├─────────────────────────────────────────────┤
│ ▼ EXPLORAR POR NOTAS OLFATIVAS              │
│   [ ✨ Usar minhas notas favoritas ]        │
│   🌿 Saída:   [✓ Bergamota] [ Limão ]       │
│   🌸 Coração: [ Rosa ] [✓ Jasmim ]          │
│   🪵 Fundo:   [ Baunilha ] [ Oud ] [ Cedro ]│
├─────────────────────────────────────────────┤
│ Marcas                        Lojas (2)     │
│ [✓ Todas] [Dior] [Chanel]     [Maison Noire]│
├─────────────────────────────────────────────┤
│ 6 perfumes encontrados     Ordenar: Menor R$│
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │ ✨ 90% Match      │ │ 🧪 Decant disp.   │ │
│ │   [Foto/Frasco]   │ │   [Foto/Frasco]   │ │
│ │ MAISON NOIRE      │ │ MAISON NOIRE      │ │
│ │ Delina Exclusif   │ │ Greenley          │ │
│ │ [Oriental]        │ │ [Cítrico]         │ │
│ │ A partir R$ 13,00 │ │ A partir R$ 13,00 │ │
│ │ [ Ver Detalhes ]  │ │ [ Ver Detalhes ]  │ │
│ └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Digitar o nome de um perfume (ex.: `"Delina"`), marca (ex.: `"Dior"`) ou nota olfativa (ex.: `"Baunilha"`) na lupa atualiza o grid de produtos com os resultados reais do banco. |
| **CA-02** | Selecionar o filtro `🧪 Decants` retorna exclusivamente perfumes que possuem oferta ativa com `volume_ml <= 15`. |
| **CA-03** | Selecionar notas no painel *"Filtrar por Notas Olfativas"* (ex.: `Bergamota` e `Baunilha`) filtra o catálogo para exibir os perfumes que possuem essas notas na pirâmide. |
| **CA-04** | Clicar em *"✨ Usar minhas notas favoritas"* preenche automaticamente as notas salvas no perfil do usuário logado e filtra os perfumes. |
| **CA-05** | Clicar em uma marca na lista de Marcas filtra os produtos daquela marca; clicar novamente remove o filtro. |
| **CA-06** | Quando nenhuma combinação de busca/filtro retorna produtos, exibe estado vazio claro com botão *"Limpar filtros"* que restaura a listagem inicial. |
| **CA-07** | Os produtos estáticos (`Oud Wood` id 4 e `Essência do Brasil` id 5) não existem mais na tela; todos os botões *"Ver Detalhes"* abrem perfumes reais do banco. |

---

## Testes (TDD)

### Backend (`apps/catalog/tests/test_search_explorer.py`)
- `GET /api/v1/products/?search=Baunilha&available_only=true` retorna perfumes que possuem `"Baunilha"` em `base_notes`.
- `GET /api/v1/products/?notes=Bergamota,Rosa&available_only=true` retorna perfumes que contêm ao menos uma dessas notas.
- `GET /api/v1/products/?type=decant&available_only=true` retorna apenas perfumes com `StoreProduct.volume_ml <= 15` em estoque.
- `GET /api/v1/products/?ordering=price_asc&available_only=true` ordena os produtos pelo menor `min_price`.

### Mobile (`__tests__/ExploreScreen.test.tsx`)
- Digitar na barra de busca dispara chamada à API `getProducts` com `search` e renderiza os produtos retornados.
- Selecionar chip `Decants` ou uma Nota Olfativa atualiza a listagem.
- Clicar em *"Limpar filtros"* reseta `searchQuery`, família, formato e notas selecionadas.

---

## Arquivos

**Backend:**
- `apps/catalog/views.py` — **[MODIFY]** aprimorar `ProductListCreateView.get_queryset` e filtragem por notas, formato (`decant`/`bottle`), faixa de preço e ordenação.
- `apps/catalog/tests/test_search_explorer.py` — **[NOVO]** testes de busca por notas, decants e ordenação.

**Mobile:**
- `src/services/stores.ts` — **[MODIFY]** adicionar `getBrands()` e novos parâmetros em `getProducts()`.
- `src/app/(shop)/explore.tsx` — **[MODIFY]** reconstrução completa da tela de Busca e Explorador Olfativo.
- `__tests__/ExploreScreen.test.tsx` — **[NOVO]** testes automatizados da aba de Busca.

---

## Referências

- [ mapa-de-telas-mobile.md ](../../04-interfaces-e-telas/mapa-de-telas-mobile.md) — Especificação da Tab 2 (Busca / Explorar e Busca Olfativa)
- [RF-03](../sprint-1/RF-03_Catalogo_Base_Piramide_Olfativa.md) — Catálogo Base e Pirâmide Olfativa
- [RF-20](./RF-20_Motor_Recomendacao_Match_Olfativo.md) — Endpoint `/api/v1/catalog/notes/`

