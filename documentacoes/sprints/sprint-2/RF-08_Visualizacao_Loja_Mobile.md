# RF-08 — Visualização de Loja Mobile

> **Sprint:** 2 | **Prioridade:** 🟡 Média | **Estimativa:** 5 SP | **Depende de:** RF-05

---

## Descrição

Experiência nativa e imersiva do consumidor ao visitar o perfil de uma loja no aplicativo mobile. A tela combina identidade visual da loja (hero com capa e logo), bio olfativa, busca interna e filtros por família olfativa, culminando em um grid dinâmico de Product Cards dos perfumes disponíveis naquele estoque.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-08.1** | Rota dinâmica `(shop)/store/[id].tsx` — tela da loja acessada pelo ID da loja. |
| **RF-08.2** | **Hero Superior:** imagem de capa (`cover_url`) em parallax suave ao rolar. Logo circular sobreposto (`logo_url`) com borda branca. Nome da loja + badge "Verificada ✓". Bio olfativa em tipografia elegante logo abaixo. |
| **RF-08.3** | **Barra de busca interna:** `TextInput` com debounce de 300ms. Filtra produtos da loja pelo nome do perfume ou marca. |
| **RF-08.4** | **Chips de família olfativa:** `ScrollView` horizontal com chips selecionáveis (Cítrico, Amadeirado, Floral, Oriental, Aquático, Fougère, Gourmand). Seleção exclusiva (apenas um ativo por vez). "Todos" como chip padrão ativo. |
| **RF-08.5** | **Grid de Product Cards:** `FlatList` com 2 colunas. Cada card exibe: foto do produto, nome, marca, família olfativa (badge), preço formatado em BRL. Toque no card navega para `(shop)/product/[id]`. |
| **RF-08.6** | Estado de lista vazia: ilustração + texto *"Nenhum perfume encontrado para este filtro."* com botão "Limpar filtros". |
| **RF-08.7** | Estado de carregamento: skeleton loader para o hero e para o grid de cards enquanto a API responde. |
| **RF-08.8** | **[Backend — Novo Endpoint]** `GET /api/v1/stores/{id}/products/` — lista pública dos `StoreProduct` ativos de uma loja específica. Suporta `?search=` e `?olfactory_family=`. Retorna apenas itens com `is_active=True` e `stock > 0`. |
| **RF-08.9** | `GET /api/v1/stores/{id}/` — já existe, mas o serializer deve ser expandido para incluir `cover_url` e `bio` no response público (verificar se esses campos já são retornados; ajustar se necessário). |
| **RF-08.10** | Otimizar a query de `RF-08.8` com `select_related('product__brand')` para evitar problema N+1. |

> [!IMPORTANT]
> O endpoint `GET /api/v1/stores/{id}/products/` deve aplicar o mesmo filtro de visibilidade da RF-05: apenas `is_active=True` e `stock > 0`. Produtos indisponíveis **nunca** aparecem na vitrine mobile.

> [!NOTE]
> O efeito de parallax no hero deve ser implementado via `Animated.ScrollView` ou `react-native-reanimated` para garantir 60fps. Evitar soluções que causem jank (travamento) no scroll.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | Tela carrega hero com capa, logo, nome e bio da loja corretamente. |
| **CA-02** | Grid exibe todos os produtos ativos com estoque > 0 da loja. |
| **CA-03** | Busca por nome filtra corretamente com debounce; resultados parciais funcionam (ex: "Sau" retorna "Sauvage"). |
| **CA-04** | Chip de família selecionado filtra o grid para exibir apenas produtos daquela família. Chip "Todos" limpa o filtro. |
| **CA-05** | Produto com `is_active=False` ou `stock=0` **não** aparece no grid. |
| **CA-06** | Grid vazio → ilustração de estado vazio com botão "Limpar filtros" funcional. |
| **CA-07** | Toque em um Product Card navega para `(shop)/product/[id]` com o ID correto. |
| **CA-08** | `GET /api/v1/stores/{id}/products/` com loja inexistente → `404 Not Found`. |

---

## Testes (TDD)

**Backend** (`apps/stores/tests/test_store_showcase.py`):
- `GET /stores/{id}/products/` com loja ativa → `200`, apenas produtos com `is_active=True` e `stock > 0`.
- `GET /stores/{id}/products/?olfactory_family=Floral` → retorna apenas produtos da família Floral da loja.
- `GET /stores/{id}/products/?search=Sauvage` → retorna apenas "Sauvage".
- Produto com `stock=0` → ausente do response.
- `GET /stores/9999/products/` → `404`.

**Mobile** (`__tests__/StorePage.test.tsx`):
- Hero renderiza `cover_url`, `logo_url`, nome e bio.
- Chips de família renderizados corretamente; seleção de chip filtra a lista.
- Busca com debounce: digitação rápida dispara apenas 1 chamada à API.
- Estado vazio renderiza ilustração e botão "Limpar filtros".
- Skeleton loader exibido enquanto `isLoading=true`.

---

## Wireframe — Tela da Loja Mobile

**Seção Hero (topo — ~35% da tela):**
- Imagem de capa em parallax
- Logo circular sobreposto (borda branca 3px)
- Nome em tipografia bold + badge `✓ Verificada`
- Bio em 2–3 linhas, tipografia regular, opacidade 85%

**Barra de Busca:**
- Input com ícone de lupa: `Buscar em [Nome da Loja]...`

**Chips de Família Olfativa (scroll horizontal):**
```
[ Todos ] [ 🌲 Amadeirado ] [ 🌸 Floral ] [ 🍊 Cítrico ] [ ✨ Oriental ] ...
```

**Grid de Produtos (2 colunas):**
```
┌─────────────┐  ┌─────────────┐
│   [foto]    │  │   [foto]    │
│  Sauvage    │  │  N°5        │
│  Dior       │  │  Chanel     │
│  Amadeirado │  │  Floral     │
│  R$ 349,90  │  │  R$ 589,90  │
└─────────────┘  └─────────────┘
```

---

## Arquivos

**Backend:**
- `apps/stores/views.py` — **[MODIFY]** Adicionar `StoreProductListView` para o endpoint `GET /stores/{id}/products/`.
- `apps/stores/serializers.py` — **[MODIFY]** Verificar e expandir `StorePublicSerializer` para incluir `cover_url` e `bio`. Criar `StoreProductPublicSerializer`.
- `apps/stores/urls.py` — **[MODIFY]** Registrar rota `stores/<int:pk>/products/`.
- `apps/stores/tests/test_store_showcase.py` — **[NOVO]**

**Mobile:**
- `src/app/(shop)/store/[id].tsx` — **[NOVO]** Tela principal da loja.
- `src/components/product/ProductCard.tsx` — **[NOVO]** Card reutilizável (foto, nome, marca, família, preço).
- `src/components/store/StoreHero.tsx` — **[NOVO]** Componente do hero com parallax.
- `src/components/common/FamilyFilterChips.tsx` — **[NOVO]** Chips horizontais de família olfativa.
- `src/components/common/SkeletonLoader.tsx` — **[NOVO]** Skeleton genérico para hero e cards.
- `src/services/stores.ts` — **[NOVO]** `getStore(id)`, `getStoreProducts(id, params)`.

---

## Dependências

**Backend:** nenhuma nova
**Mobile:** `react-native-reanimated` (parallax e animações), `@shopify/flash-list` (FlatList performático para grids)

---

## Referências

- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/stores/` e `/store-products/`
- [`modelo-relacional.md`](../../../02-banco-de-dados/modelo-relacional.md) — Relacionamento `Store` ↔ `StoreProduct` ↔ `Product`
- [`estrutura-app-mobile-expo.md`](../../../03-arquitetura/estrutura-app-mobile-expo.md) — Estrutura de rotas `(shop)/` e componentes
- [RF-05](./RF-05_Vitrine_Publica_Exploracao_Lojas.md) — Regras de visibilidade do catálogo público e componente `ProductCard`
- [RF-04](../../sprint-1/RF-04_Gestao_Estoque_Precificacao_Lojista.md) — Model `StoreProduct` e campos `is_active`, `stock`
