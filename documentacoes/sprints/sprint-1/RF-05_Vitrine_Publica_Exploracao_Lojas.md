# RF-05 — Vitrine Pública & Exploração de Lojas

> **Sprint:** 1 | **Prioridade:** 🔴 Alta | **Estimativa:** 4 SP | **Depende de:** RF-02, RF-03, RF-04

---

## Descrição

Qualquer visitante (autenticado ou não) acessa a vitrine pública do marketplace, filtra perfumes por família, marca e preço, e visita a página pública de uma loja específica com seu bio e grade de produtos.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-05.1** | `GET /api/v1/showcase/products/` — listagem pública com filtros `?brand=`, `?family=`, `?min_price=`, `?max_price=`, `?search=`; retorna apenas `is_available=True`, `stock_quantity > 0` e loja `is_active=True` |
| **RF-05.2** | `GET /api/v1/showcase/stores/{slug}/` — perfil público da loja (banner, logo, bio) + produtos disponíveis |
| **RF-05.3** | Otimizar queries com `select_related('store', 'product__brand')` e `prefetch_related` para evitar N+1 |
| **RF-05.4** | Componente `ProductCard` reutilizável: foto, nome, marca, notas em badge, preço/promo, link da loja |
| **RF-05.5** | Página `/lojas/:slug` — hero com capa e logo, bio olfativa, filtros internos e grid de perfumes (3–4 colunas) |
| **RF-05.6** | Chips de família olfativa na barra de filtros (Cítrico, Amadeirado, Floral, Oriental…) |

> [!IMPORTANT]
> Produtos com `stock_quantity = 0`, `is_available = False` ou de lojas `is_active = False` **nunca** devem aparecer na vitrine pública — filtro obrigatório no QuerySet, não no serializer.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | Produto com estoque zerado → ausente da vitrine pública |
| **CA-02** | Produto de loja inativa → ausente da vitrine pública |
| **CA-03** | Filtros combinados (`?family=Floral&max_price=200`) retornam subset correto |
| **CA-04** | Card exibe menor preço disponível, badges de notas e link correto para a loja |
| **CA-05** | Rota `/lojas/:slug` carrega e exibe apenas produtos daquela loja específica |

---

## Testes (TDD)

**Backend** (`apps/showcase/tests/test_showcase.py`): produto ativo em loja ativa → aparece `200`; produto com estoque zero → ausente; produto de loja inativa → ausente; filtro por família retorna subset; endpoint de loja por slug `200` e slug inexistente `404`.

**Frontend** (`ProductCard.test.tsx`, `StoreShowcase.test.tsx`): card renderiza nome, preço formatado (BRL) e badges de notas; filtro de família aplicado oculta cards não correspondentes; link da loja aponta para slug correto.

---

## Wireframe — Página da Loja (`/lojas/:slug`)

**Hero:**
- Imagem de capa editorial + logo circular sobreposto
- Nome Fantasia + badge "Loja Verificada ✓"
- Bio olfativa em tipografia elegante

**Barra de filtros:** busca interna + chips de família olfativa selecionáveis

**Grid de perfumes (3–4 colunas):**
- Card: foto com hover suave | nome | marca | badges de notas | volume | preço em destaque | botão "Ver Detalhes"

---

## Arquivos

**Backend:** `apps/showcase/views.py`, `serializers.py`, `urls.py`, `tests/test_showcase.py` — **[NOVO]**. Adicionar `slug` em `apps/stores/models.py` — **[MODIFY]**.

**Frontend:** `src/features/showcase/ProductCard.tsx`, `src/features/showcase/StoreShowcasePage.tsx`, `src/features/showcase/OlfactoryFilterChips.tsx`, `src/services/showcaseService.ts` — **[NOVO]**.

---

## Dependências

**Backend:** `python-slugify` (geração de slug da loja)
**Frontend:** nenhuma nova

---

## Referências

- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/showcase/`
- [`fluxos-de-negocio.md`](../../../01-regras-de-negocio/fluxos-de-negocio.md) — Regras de visibilidade do catálogo
- [RF-04](./RF-04_Gestao_Estoque_Precificacao_Lojista.md) — Estoque e disponibilidade dos produtos
