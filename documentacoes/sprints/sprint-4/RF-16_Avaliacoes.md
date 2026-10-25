# RF-16 — Avaliações de Produtos e Lojas

> **Sprint:** 4  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 8 SP  
> **Depende de:** RF-15 (status `DELIVERED` e devoluções)

---

## Descrição

Permite ao cliente avaliar cada perfume comprado após a entrega (nota, comentário e fotos), e às lojas (lojista e Loja Oficial) visualizar e responder publicamente às avaliações. A nota da loja é calculada a partir das avaliações dos seus itens. As avaliações são exibidas no app (página da loja e página do perfume) e no painel web (tela de avaliações acessada pelo dashboard).

> [!NOTE]
> Os campos `rating` e `reviews_count` já existem como placeholders no `StoreSerializer` (`apps/stores/serializers.py`) e passam a ser calculados a partir do model `Review`.

---

## Regras de Negócio

| ID | Regra |
|---|---|
| **RN-01** | Avalia-se **cada item comprado** (`OrderItem` → `StoreProduct`): **nota 1–5 obrigatória** e **comentário opcional** (máx. 1000 caracteres). |
| **RN-02** | Apenas **1 avaliação por `OrderItem`**. |
| **RN-03** | Só pode avaliar itens de pedidos `DELIVERED`, em até **30 dias após `delivered_at`**. |
| **RN-04** | **Itens com devolução** (`ReturnRequest` não recusada) **não podem ser avaliados**. |
| **RN-05** | Se o item já avaliado tiver uma devolução **aprovada**, a avaliação é **ocultada automaticamente** (`is_hidden = True`) e deixa de contar nas médias. |
| **RN-06** | Até **3 fotos** por avaliação (câmera ou galeria). |
| **RN-07** | **Edição única:** o cliente pode editar nota, comentário e fotos **1 vez**, dentro do prazo de 30 dias. A avaliação exibe a tag **"Editada"**. |
| **RN-08** | **Exclusão:** o cliente pode excluir a qualquer momento. Após excluir, **não pode avaliar novamente** o mesmo item (exclusão lógica — `is_deleted = True`). |
| **RN-09** | **Resposta da loja:** 1 resposta pública por avaliação, editável pela loja, exibida abaixo da avaliação. |
| **RN-10** | **Nota da loja** = média das avaliações visíveis de todos os seus itens, 1 casa decimal, com total (ex.: "4,7 · 128 avaliações"). Sem avaliações → "Sem avaliações". |
| **RN-11** | **Nota do perfume na loja** = média das avaliações visíveis daquele `Product` **somente naquela loja**, **agregando todas as volumetrias** (frascos e decants). |
| **RN-12** | **Identificação do autor:** primeiro nome + inicial do sobrenome (ex.: "Maria S."). |
| **RN-13** | Não há selo de "Compra verificada" (todas as avaliações vêm de compras). |
| **RN-14** | **Fora do escopo:** moderação e denúncia de avaliações. |

### Filtros e Ordenação (mobile e web)

- **Filtros:** Perfume (somente na visão da loja) · Nota (1 a 5 estrelas) · Só com fotos · **Sem resposta** (somente web/loja).
- **Ordenação:** Mais recentes (padrão) · Mais antigas · Maior nota · Menor nota.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-16.1** | **[Backend — Model]** Novo app `reviews`: `Review` (`order_item` 1:1, `user`, `store`, `product`, `store_product`, `rating`, `comment`, `edited_at`, `is_hidden`, `is_deleted`, timestamps), `ReviewPhoto` e `ReviewReply`. |
| **RF-16.2** | **[Backend — Cliente]** `POST /api/v1/reviews/` (multipart: `order_item`, `rating`, `comment?`, `photos[] ≤ 3`). Valida RN-02 a RN-06. |
| **RF-16.3** | **[Backend — Cliente]** `PATCH /api/v1/reviews/{id}/` (edição única — RN-07) e `DELETE /api/v1/reviews/{id}/` (RN-08). |
| **RF-16.4** | **[Backend — Público]** `GET /api/v1/stores/{id}/reviews/` (filtros `product`, `rating`, `with_photos`; `ordering`) + resumo (`average`, `count`, `distribution` por estrela). |
| **RF-16.5** | **[Backend — Público]** `GET /api/v1/stores/{id}/products/{product_id}/reviews/` — avaliações do perfume naquela loja + resumo. |
| **RF-16.6** | **[Backend — Loja]** `GET /api/v1/store/reviews/` (filtros acima + `unanswered`) e `PUT /api/v1/store/reviews/{id}/reply/`. |
| **RF-16.7** | **[Backend]** `StoreSerializer.rating`/`reviews_count` calculados a partir de `Review`; detalhe de oferta (`StoreProduct`) passa a expor `rating`/`reviews_count` do perfume na loja. |
| **RF-16.8** | **[Backend]** Ao aprovar devolução (RF-15), ocultar avaliações dos itens devolvidos (RN-05). |
| **RF-16.9** | **[Backend]** Detalhe do pedido do cliente (`GET /api/v1/orders/{id}/`) expõe, por item, `can_review`, `review_id` e `can_edit_review`. |
| **RF-16.10** | **[Mobile]** Botão "Avaliar" por item no pedido entregue; tela de avaliação (estrelas, comentário, fotos via `expo-image-picker`); ver/editar/excluir. |
| **RF-16.11** | **[Mobile]** Tela de avaliações da loja (a partir da nota na página da loja) e tela de avaliações do perfume na loja (a partir da nota na página do produto), com resumo, filtros, ordenação e visualizador de fotos em tela cheia. |
| **RF-16.12** | **[Web]** Card de avaliação do dashboard clicável → `/store/reviews`: resumo, filtros, ordenação, fotos em tela cheia e responder/editar resposta. Vale para lojista e Loja Oficial. |

---

## Fluxo de Interface

### Mobile — Pedido entregue

| Situação do item | Ação exibida |
|---|---|
| Entregue, ≤ 30 dias, sem avaliação, sem devolução | **Avaliar** |
| Avaliado, edição disponível e ≤ 30 dias | Ver · Editar · Excluir |
| Avaliado, edição já usada ou > 30 dias | Ver · Excluir |
| Com devolução / > 30 dias sem avaliação / avaliação excluída | (nenhuma) |

### Mobile — Tela de Avaliações

```text
┌─────────────────────────────────────────┐
│ <  Avaliações · Essência & Arte         │
├─────────────────────────────────────────┤
│  4,7 ★★★★★   128 avaliações             │
│  5 ████████████  98                     │
│  4 ███           20                     │
│  3 █              6                     │
│  2                2                     │
│  1                2                     │
├─────────────────────────────────────────┤
│ [Perfume ▼] [Nota ▼] [📷 Com fotos]     │
│ Ordenar: [Mais recentes ▼]              │
├─────────────────────────────────────────┤
│ Maria S. ★★★★★  12/10/2026  (Editada)   │
│ Sauvage · 100ml                         │
│ "Chegou super bem embalado..."          │
│ [foto] [foto]                           │
│  ↳ Resposta da loja: "Obrigado, Maria!" │
└─────────────────────────────────────────┘
```

### Web — `/store/reviews`

```text
┌──────────────────────────────────────────────────────────┐
│ Avaliações          4,7 ★ · 128 avaliações               │
├──────────────────────────────────────────────────────────┤
│ [Perfume ▼] [Nota ▼] [Com fotos] [Sem resposta]          │
│ Ordenar: [Mais recentes ▼]                               │
├──────────────────────────────────────────────────────────┤
│ Maria S. ★★★★★  12/10/2026 · Sauvage 100ml · Pedido #105 │
│ "Chegou super bem embalado..."  [foto][foto]             │
│                                         [ Responder ]    │
└──────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Avaliar item de pedido não entregue, ou entregue há > 30 dias, retorna `400`. |
| **CA-02** | Segunda avaliação para o mesmo `OrderItem` retorna `400` (inclusive após exclusão). |
| **CA-03** | Avaliar item com devolução não recusada retorna `400`. |
| **CA-04** | Envio de mais de 3 fotos retorna `400`. |
| **CA-05** | Segunda edição retorna `400`; primeira edição define `edited_at`. |
| **CA-06** | Avaliação excluída ou oculta não aparece nas listagens nem nas médias. |
| **CA-07** | Aprovação de devolução oculta a avaliação do item devolvido. |
| **CA-08** | Nota da loja e do perfume refletem a média das avaliações visíveis. |
| **CA-09** | Filtros (`product`, `rating`, `with_photos`, `unanswered`) e ordenações retornam resultados corretos. |
| **CA-10** | Lojista só responde avaliações da própria loja (`404` caso contrário). |
| **CA-11** | Autor exibido como "Nome S.". |

---

## Testes (TDD)

### Backend
- `apps/reviews/tests/test_review_create.py`
- `apps/reviews/tests/test_review_edit_delete.py`
- `apps/reviews/tests/test_review_listing.py` (filtros, ordenação, resumo)
- `apps/reviews/tests/test_review_reply.py`
- `apps/reviews/tests/test_review_return_hidden.py`

### Frontend Web
- `StoreReviews.test.tsx` — filtros, ordenação e envio de resposta.

### Mobile
- `__tests__/ReviewForm.test.tsx` — nota obrigatória; limite de 3 fotos.
- `__tests__/ReviewsScreen.test.tsx` — resumo e filtros.

---

## Arquivos

**Backend:** `apps/reviews/` (**[NOVO]** `models.py`, `serializers.py`, `views.py`, `urls.py`, `filters.py`), `apps/stores/serializers.py` (**[MODIFY]** rating real), `apps/orders/services.py` (**[MODIFY]** ocultar avaliação ao aprovar devolução), `apps/orders/serializers.py` (**[MODIFY]** flags de avaliação por item).  
**Web:** `src/features/store/StoreReviews.tsx` (**[NOVO]**), `src/services/reviewService.ts` (**[NOVO]**), dashboard (**[MODIFY]** card clicável).  
**Mobile:** `src/app/(shop)/reviews/new.tsx` (**[NOVO]**), `src/app/(shop)/store/[id]/reviews.tsx` (**[NOVO]**), `src/app/(shop)/store/[id]/product/[productId]/reviews.tsx` (**[NOVO]**), `src/components/reviews/` (**[NOVO]**), `src/services/reviews.ts` (**[NOVO]**).

---

## Dependências

**Backend:** `Pillow` (já utilizado para `ImageField`)  
**Mobile:** `expo-image-picker`

---

## Referências

- [RF-15](./RF-15_Gestao_Pos_Compra.md) — status `DELIVERED`, `delivered_at` e devoluções
- RF-17 (Dashboard) — card de avaliação
