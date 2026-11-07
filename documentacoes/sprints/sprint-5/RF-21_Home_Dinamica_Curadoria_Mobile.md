# RF-21 — Home Mobile Dinâmica e Curadoria Personalizada

> **Sprint:** 5  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 6 SP  
> **Depende de:** RF-05 (Vitrine Pública), RF-08 (Visualização de Loja Mobile), RF-20 (Motor de Recomendação)

---

## Descrição

Substitui integralmente os dados e ilustrações estáticos (*hardcoded*) da tela inicial do aplicativo mobile (`mobile/src/app/(shop)/index.tsx`) por uma **Home Dinâmica e Personalizada** alimentada em tempo real pelo banco de dados SQLite.

A tela passa a cumprimentar o usuário com seu avatar dinâmico, exibe **Banners de Curadoria Interativos** que navegam diretamente para filtros de Decants e Ofertas, apresenta as **7 Famílias Olfativas oficiais** como atalhos de exploração rápida, carrega a lista real de **Lojas em Destaque** do marketplace (com logo, selo de Loja Oficial, nota de avaliação real e navegação para `/store/[id]`) e popula a seção **"Para Você"** com os perfumes recomendados pelo motor olfativo da `RF-20` (ou convite rápido para completar o perfil olfativo caso esteja vazio).

---

## Regras de Negócio

### 1. Dados Dinâmicos da Home (`GET /api/v1/showcase/home/`)

| ID | Regra |
|---|---|
| **RN-01** | **Proibição de Dados Mockados na Home:** Nenhum produto fictício (como os antigos `"Lavande Royale"` e `"Ambre Impérial"`) ou loja fixa sem vínculo com o banco deve ser exibido na tela inicial. Todos os cards de produtos e lojas devem vir da API e navegar para suas respectivas telas reais (`/product/[id]` e `/store/[id]`). |
| **RN-02** | **Curadoria "Para Você" Baseada no Perfil Olfativo:**<br>- Se o cliente autenticado possuir `olfactory_families` ou `preferred_notes` cadastrados, a seção **"Para Você"** exibe os perfumes ordenados pelo maior `match_percentage` (calculado pelo serviço da `RF-20`), exibindo no topo do card a tag **`✨ X% Match`**.<br>- Se o cliente ainda não tiver preenchido seu perfil olfativo, exibe um **Card de Convite Compacto** (*"Descubra seu Match Olfativo — configure suas notas favoritas em 30s"*) com botão direto para `/account/edit-olfactory-profile`, seguido pelos perfumes em destaque/mais vendidos do catálogo. |
| **RN-03** | **Lojas em Destaque Reais:** A lista horizontal **"Lojas em Destaque"** deve retornar as lojas ativas (`is_active = True`) do banco de dados, priorizando aquelas com estoque disponível (`store_products` ativos), ordenadas por maior nota média de avaliações (`Review`), maior número de seguidores (`followers_count`) e selo `is_official`. Cada card exibe logo (ou inicial), nome, selo oficial (`✓`), nota média real (ou `"Novo"`) e cidade/UF. |
| **RN-04** | **Agrupamento de Preço de Entrada (`"A partir de R$ X"`):** Assim como na vitrine da loja (`RF-08`), cada perfume listado na Home aparece **uma única vez**, exibindo o menor preço praticado entre as lojas/volumetrias ativas (`min_price`), a marca, a família olfativa e um selo indicativo caso possua opção de **Decant** ($\le 15\text{ml}$). |

### 2. Interatividade e Navegação Contextual

| ID | Regra |
|---|---|
| **RN-05** | **7 Categorias Rápidas (Famílias Olfativas):** O carrossel de Categorias Rápidas deve listar todas as **7 famílias oficiais do modelo `Product`**: `Amadeirado`, `Floral`, `Cítrico`, `Oriental`, `Gourmand`, `Fougère` e `Aquático`. Ao tocar em qualquer família, o app redireciona imediatamente para a aba de Busca (`/(shop)/explore?family=<NomeDaFamilia>`) já filtrada naquela família. |
| **RN-06** | **Banners Promocionais Clicáveis:**<br>- **Banner 1 ("Festival de Decants — Experimente perfumes de nicho a partir de 5ml"):** Ao tocar, navega para `/(shop)/explore?type=decant`.<br>- **Banner 2 ("Descoberta Olfativa — Encontre perfumes pelas suas notas favoritas"):** Ao tocar, navega para `/(shop)/explore?openNotes=1` (ou para o editor de perfil olfativo se o usuário ainda não tiver notas salvas). |
| **RN-07** | **Atalho "Ver todas →" nas Lojas e Produtos:**<br>- Clicar em **"Ver todas →"** ao lado de *Lojas em Destaque* navega para `/(shop)/explore?tab=stores`.<br>- Clicar em **"Explorar catálogo →"** ao lado de *Para Você* navega para `/(shop)/explore`. |
| **RN-08** | **Header do Usuário Consistente:** O cabeçalho da Home deve exibir o avatar circular com a inicial do `user.first_name` (mesmo padrão visual de `Minha Conta`, removendo a imagem estática `avatar_ana.jpg`), a saudação `"Olá, {first_name}"` e o sino de notificações com badge real (`useUnreadNotifications`). Suporta *Pull-to-Refresh* para atualizar a vitrine. |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-21.1** | **[Backend — Endpoint Home Feed]** Criar `GET /api/v1/showcase/home/` em `apps/showcase/views.py`: retorna em uma única resposta JSON:<br>- `has_olfactory_profile`: booleano indicando se o usuário autenticado tem famílias/notas salvas.<br>- `user_summary`: `{ "olfactory_families": [...], "preferred_notes": [...] }`.<br>- `recommended_products`: lista de até 10 perfumes com estoque ativo ordenados por afinidade olfativa (`match_percentage`) ou popularidade.<br>- `featured_stores`: lista de até 8 lojas ativas com `rating`, `reviews_count`, `followers_count`, `is_official`, `logo_url`, `city`, `state`.<br>- `decant_highlights`: lista de até 6 perfumes que possuem ofertas de decants ($\le 15\text{ml}$) disponíveis. |
| **RF-21.2** | **[Mobile — Serviço da Home]** Adicionar `getHomeFeed()` em `mobile/src/services/stores.ts` consumindo `GET /api/v1/showcase/home/`. |
| **RF-21.3** | **[Mobile — Refatoração de `(shop)/index.tsx`]** Substituir todo o conteúdo estático de `mobile/src/app/(shop)/index.tsx`:<br>- Avatar dinâmico com inicial do usuário.<br>- Banners com `onPress` navegando para `/(shop)/explore` com parâmetros.<br>- Carrossel com as 7 Famílias Olfativas navegando para `/(shop)/explore?family=...`.<br>- Carrossel de Lojas em Destaque reais navegando para `/store/[id]`.<br>- Grid de 2 colunas na seção **"Para Você"** (com badge `✨ X% Match` e banner de incentivo caso `has_olfactory_profile == false`) + seção horizontal **"Decants para Experimentar"**. |
| **RF-21.4** | **[Mobile — Estados de Loading e Refresh]** Adicionar `RefreshControl` (pull-to-refresh) e estado de carregamento suave na Home. |

---

## Fluxo de Interface e Navegação

### Tela Inicial Dinâmica (`/(shop)/index.tsx`)
```text
┌─────────────────────────────────────────────┐
│ (L) Olá, Letícia 👋                    (🔔) │
│     Descubra sua próxima fragrância.        │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────┐ ┌──────── │
│ │ EXPERIMENTE DECANTS           │ │ NOTAS   │
│ │ Perfumes de nicho em          │ │ Ache o  │
│ │ 5ml, 10ml e 15ml →            │ │ seu →   │
│ └───────────────────────────────┘ └──────── │
├─────────────────────────────────────────────┤
│ Famílias Olfativas (Toque para filtrar)     │
│ (💧)    (🌸)    (🍊)    (🔥)    (⭐)   (🌿) │
│ Amad.  Floral  Cítrico Oriental Gourm. Foug.│
├─────────────────────────────────────────────┤
│ Lojas em Destaque              Ver todas →  │
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │ [M] Maison Noire ✓│ │ [D] Decants & Co. │ │
│ │ ★ 4.9 · 28 aval.  │ │ ★ 4.8 · Goiânia   │ │
│ └───────────────────┘ └───────────────────┘ │
├─────────────────────────────────────────────┤
│ Para Você (Baseado no seu Perfil)           │
│ ┌───────────────────┐ ┌───────────────────┐ │
│ │ ✨ 92% Match      │ │ ✨ 80% Match      │ │
│ │   [Foto/Frasco]   │ │   [Foto/Frasco]   │ │
│ │ Maison Noire      │ │ Dior              │ │
│ │ Delina Exclusif   │ │ Sauvage           │ │
│ │ A partir R$ 13,00 │ │ A partir R$ 45,00 │ │
│ └───────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | `GET /api/v1/showcase/home/` retorna `recommended_products`, `featured_stores` e `decant_highlights` contendo apenas lojas ativas e produtos com `stock_quantity > 0`. |
| **CA-02** | Nenhum produto ou loja estático/fictício aparece na Home; tocar em uma loja abre `/store/[id]` e tocar em um perfume abre `/product/[id]`. |
| **CA-03** | Tocar em uma das 7 famílias olfativas em *Categorias Rápidas* redireciona para `/(shop)/explore` com o filtro `family` preenchido. |
| **CA-04** | Tocar nos banners superiores redireciona para a aba de Busca com o filtro correspondente (`type=decant` ou seletor de notas). |
| **CA-05** | Se o cliente tiver perfil olfativo preenchido, os cards da seção *"Para Você"* exibem o badge `✨ X% Match`. Se não tiver, exibe o card convidando a completar o perfil olfativo (`/account/edit-olfactory-profile`). |
| **CA-06** | O header exibe a inicial real do usuário autenticado (sem a foto fixa `avatar_ana.jpg`). |

---

## Testes (TDD)

### Backend (`apps/showcase/tests/test_home_feed.py`)
- `GET /api/v1/showcase/home/` retorna `200 OK` com `recommended_products`, `featured_stores` e `decant_highlights`.
- Lojas inativas (`is_active=False`) e produtos sem estoque (`stock_quantity=0`) não aparecem no feed da Home.
- Usuário autenticado com perfil olfativo recebe `has_olfactory_profile=True` e produtos ordenados por maior `match_percentage`.

### Mobile (`__tests__/HomeScreen.test.tsx`)
- Renderiza saudação com o nome real do usuário, lojas reais vindas da API e produtos da seção *"Para Você"*.
- Toque em uma família olfativa chama `router.push` para `/(shop)/explore` com o parâmetro `family`.
- Toque em um card de loja navega para `/store/[id]` e toque em um card de produto navega para `/product/[id]`.

---

## Arquivos

**Backend:**
- `apps/showcase/views.py` — **[MODIFY]** adicionar `ShowcaseHomeFeedView`.
- `apps/showcase/serializers.py` — **[MODIFY]** serializers resumidos para o feed da Home (`HomeProductSerializer`, `HomeStoreSerializer`).
- `apps/showcase/urls.py` — **[MODIFY]** registrar rota `home/` (`GET /api/v1/showcase/home/`).
- `apps/showcase/tests/test_home_feed.py` — **[NOVO]** testes automatizados do feed da Home.

**Mobile:**
- `src/services/stores.ts` — **[MODIFY]** método `getHomeFeed()` e interfaces `HomeFeedResponse`.
- `src/app/(shop)/index.tsx` — **[MODIFY]** substituição completa dos mocks pela integração com `getHomeFeed()` e navegação contextual.
- `__tests__/HomeScreen.test.tsx` — **[NOVO]** testes da Home dinâmica.

---

## Referências

- [ mapa-de-telas-mobile.md ](../../04-interfaces-e-telas/mapa-de-telas-mobile.md) — Especificação da Tab 1 (Início / Vitrine)
- [RF-05](../sprint-2/RF-05_Vitrine_Publica_Exploracao_Lojas.md) — Regras de visibilidade pública de produtos e lojas
- [RF-20](./RF-20_Motor_Recomendacao_Match_Olfativo.md) — Cálculo de `match_percentage`

