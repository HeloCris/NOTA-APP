# RF-03 — Catálogo Base, Marcas & Pirâmide Olfativa Global

> **Sprint:** 1 | **Prioridade:** 🔴 Alta | **Estimativa:** 5 SP | **Depende de:** RF-01

---

## Descrição

Base centralizada de marcas e perfumes com pirâmide olfativa completa (Notas de Saída, Corpo e Fundo). O lojista busca e consulta esse catálogo oficial para vincular produtos ao seu estoque sem divergência de ficha técnica.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-03.1** | Models `Brand` e `Product` no Django: campos `name`, `brand (FK)`, `olfactory_family`, `top_notes`, `heart_notes`, `base_notes` (JSONField), `image_url` — SQLite |
| **RF-03.2** | Management command `seed_catalog` para carga inicial idempotente (marcas + perfumes do `dados-iniciais-seeds.md`) |
| **RF-03.3** | `GET /api/v1/brands/` — listagem pública de marcas |
| **RF-03.4** | `GET /api/v1/products/` — listagem com filtros `?search=`, `?brand=`, `?olfactory_family=`, `?top_notes=`, `?heart_notes=`, `?base_notes=` |
| **RF-03.5** | `GET /api/v1/products/{id}/` — ficha técnica completa com pirâmide olfativa |
| **RF-03.6** | `POST /api/v1/products/` — submissão de nova ficha (autenticado; revisão pelo Admin) |
| **RF-03.7** | Componente web de autocomplete com debounce e modal de visualização da pirâmide olfativa |

> [!IMPORTANT]
> Notas olfativas em `JSONField` para viabilizar filtros futuros. Usar `select_related('brand')` em todas as queries de listagem.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | `seed_catalog` popula banco sem duplicidade; reexecução é idempotente |
| **CA-02** | `GET /products/?search=Dior` retorna apenas produtos correspondentes com `top_notes`, `heart_notes`, `base_notes` presentes |
| **CA-03** | Filtros combinados funcionam (`?olfactory_family=Floral&base_notes=Baunilha`) |
| **CA-04** | Autocomplete web exibe nome, marca e miniatura; modal exibe as 3 camadas da pirâmide |

---

## Testes (TDD)

**Backend** (`apps/catalog/tests/test_catalog.py`): seed popula corretamente, listagem `200` com notas presentes, filtro por nome retorna apenas resultados correspondentes, filtro por família retorna subset correto, `POST` sem auth → `401`.

**Frontend** (`ProductAutoComplete.test.tsx`): renderização do input, digitação dispara busca (mock), resultados exibidos, clique em item abre modal com as 3 camadas olfativas.

---

## Wireframe — Componente de Catálogo

**Barra de pesquisa:** input com ícone de lupa e debounce (300ms).

**Lista de resultados:** miniatura do frasco | Nome | Marca | Família olfativa.

**Modal de ficha técnica:**
- 🌿 **Saída:** badges (ex: Bergamota, Pimenta Rosa)
- 🌸 **Corpo:** badges (ex: Rosa Damascena, Jasmim)
- 🪵 **Fundo:** badges (ex: Cedro, Âmbar, Fava Tonka)
- Botão **"Adicionar ao Meu Estoque"**

---

## Arquivos

**Backend:** `apps/catalog/models.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_catalog.py` — **[NOVO]**. `apps/catalog/management/commands/seed_catalog.py` — **[NOVO]**.

**Frontend:** `src/features/catalog/ProductAutoComplete.tsx`, `src/features/catalog/OlfactoryPyramidModal.tsx`, `src/services/catalogService.ts` — **[NOVO]**.

---

## Dependências

**Backend:** nenhuma nova
**Frontend:** nenhuma nova (usa Axios e React Hook Form do RF-01/02)

---

## Referências

- [`dados-iniciais-seeds.md`](../../../02-banco-de-dados/dados-iniciais-seeds.md) — Fixtures de marcas e 10 perfumes com pirâmide completa
- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/products/` e `/brands/`
- [`modelo-relacional.md`](../../../02-banco-de-dados/modelo-relacional.md) — Models `Brand` e `Product`
