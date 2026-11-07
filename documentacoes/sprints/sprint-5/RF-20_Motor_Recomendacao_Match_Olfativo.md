# RF-20 — Motor de Recomendação, Match Olfativo e Evolução do Perfil Olfativo

> **Sprint:** 5  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 6 SP  
> **Depende de:** RF-03 (Catálogo e Pirâmide Olfativa), RF-06 (Onboarding Olfativo), RF-07 (Perfil Mobile)

---

## Descrição

Implementa o coração da proposta de valor do **NŌTA** (*"Your Scent, Understood"*): o **Motor de Recomendação e Afinidade Olfativa**. Este requisito cruza os dados já cadastrados pelo consumidor (`CustomUser.olfactory_families` e `CustomUser.preferred_notes`) com a pirâmide olfativa (`Product.olfactory_family`, `top_notes`, `heart_notes`, `base_notes`) e o histórico de interações (`StoreFollower` e `OrderItem`) para calcular o **Percentual de Match Olfativo (`match_percentage`)** de cada perfume disponível no marketplace.

No aplicativo mobile, exibe o card de afinidade (**`✨ X% Match com seu Perfil Olfativo`** + notas em comum destacadas) na tela de detalhes do produto (`/product/[id]`), substitui a lista genérica de recomendações pelo ranking real do algoritmo, remove o botão estático de favoritar produto sem persistência e evolui a tela de edição do Perfil Olfativo (`/account/edit-olfactory-profile`) para consumir dinamicamente todas as notas olfativas reais do catálogo do banco de dados.

---

## Regras de Negócio

### 1. Cálculo do Score de Afinidade Olfativa (`Match %`)

| ID | Regra |
|---|---|
| **RN-01** | **Elegibilidade de Produtos Recomendados:** Apenas perfumes com `is_approved = True` que possuam pelo menos uma oferta ativa em estoque (`StoreProduct` com `is_available = True`, `stock_quantity > 0` e `store__is_active = True`) entram no motor de recomendação. |
| **RN-02** | **Fórmula Determinística de Afinidade (`0%` a `100%`):** Para clientes autenticados que possuam `olfactory_families` e/ou `preferred_notes` preenchidos:<br>- **Compatibilidade de Família Olfativa (`até 45 pontos`):** Se `product.olfactory_family` estiver contida em `user.olfactory_families` (comparação case-insensitive), soma **45 pontos**.<br>- **Compatibilidade de Notas da Pirâmide (`até 45 pontos`):** Compara `user.preferred_notes` com a união de `top_notes + heart_notes + base_notes` do perfume (normalizando acentos, caixa e correspondência parcial, ex.: `"Bergamota"` bate com `"Bergamota da Calábria"`). Cada nota compatível soma **15 pontos**, limitado ao teto de **45 pontos** (3+ notas em comum = pontuação máxima de notas).<br>- **Bônus de Fidelização / Lojas Seguidas (`até 10 pontos`):** Se o perfume possuir oferta ativa em uma loja seguida pelo cliente (`StoreFollower`), soma **10 pontos**.<br>- Se o usuário preencheu **apenas famílias** (sem notas) ou **apenas notas** (sem famílias), o peso é reescalonado proporcionalmente para que um match perfeito possa atingir até `95%–100%`. |
| **RN-03** | **Retorno Explicável (`matched_notes` e `match_reasons`):** O serializer do produto deve retornar:<br>- `match_percentage`: inteiro de `0` a `100` (ou `null` quando o usuário não estiver autenticado ou tiver perfil olfativo totalmente vazio).<br>- `matched_notes`: lista das notas da pirâmide daquele perfume que coincidem com as notas favoritas do usuário (ex.: `["Bergamota da Calábria", "Baunilha Bourbon"]`).<br>- `matched_family`: booleano indicando se a família olfativa do perfume faz parte das preferidas do usuário. |
| **RN-04** | **Fallback Inteligente (Cold Start):** Caso o cliente ainda não tenha preenchido seu perfil olfativo (`olfactory_families = []` e `preferred_notes = []`) ou não esteja autenticado, o endpoint `/api/v1/products/recommended/` ordena os produtos por popularidade real (`-sold_count`), nota média de avaliações (`Review`) e disponibilidade de ofertas, retornando `is_personalized = False` para que o app exiba um convite de preenchimento do perfil. |

### 2. Tela de Produto e Edição do Perfil Olfativo

| ID | Regra |
|---|---|
| **RN-05** | **Destaque Visual na Pirâmide Olfativa (`product/[id].tsx`):** Na tela de detalhes do perfume, se `match_percentage > 0`, exibe o selo/card **"✨ X% Match com você"** logo abaixo do preço/classificação. Além disso, na seção **"Pirâmide Olfativa"**, os chips das notas que pertencem a `matched_notes` recebem destaque visual (borda dourada/terracota e ícone `✦`) para mostrar ao cliente *por que* aquele perfume combina com ele. |
| **RN-06** | **Remoção de Botão Estático de Favorito:** O botão de coração (`isFavorite` apenas em memória local) no canto superior direito de `product/[id].tsx` deve ser removido, mantendo apenas o botão de **Compartilhar** e o vínculo oficial de **Seguir Loja** (`RF-19`), eliminando funcionalidades fictícias sem persistência em banco. |
| **RN-07** | **Catálogo Dinâmico de Notas (`GET /api/v1/catalog/notes/`):** O backend deve expor as notas únicas reais extraídas dos produtos aprovados no banco (`top_notes`, `heart_notes`, `base_notes`), combinadas com o vocabulário base da perfumaria NŌTA, garantindo que a tela de edição do Perfil Olfativo (`edit-olfactory-profile.tsx`) nunca fique restrita a uma lista fixa desatualizada. |
| **RN-08** | **Flexibilidade ao Salvar Perfil Olfativo:** Na tela `edit-olfactory-profile.tsx`, o cliente pode salvar seu perfil tendo selecionado **ao menos 1 família olfativa OU ao menos 1 nota favorita** (máximo de 10 notas), corrigindo o bloqueio anterior que impedia salvar quando apenas famílias eram alteradas. A tela deve possuir cabeçalho com botão de voltar (`←`). |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-20.1** | **[Backend — Service]** Criar `apps/catalog/services/recommendation_service.py` contendo as funções puras de normalização de texto/notas e cálculo de `calculate_olfactory_match(user, product, followed_store_ids)`. |
| **RF-20.2** | **[Backend — Serializer]** Atualizar `ProductSerializer` (`apps/catalog/serializers.py`) para injetar `match_percentage`, `matched_notes` e `matched_family` sempre que houver um `request.user` autenticado no contexto. |
| **RF-20.3** | **[Backend — Endpoint Recomendados]** Criar `GET /api/v1/products/recommended/` (`AllowAny`, com personalização automática se autenticado): retorna os perfumes disponíveis ordenados por maior `match_percentage`, maior `sold_count` e menor preço de entrada (`min_price`). Aceita `?exclude_id=<id>` (para a seção *"Recomendados para você"* na tela de produto) e `?limit=<n>`. |
| **RF-20.4** | **[Backend — Endpoint Notas do Catálogo]** Criar `GET /api/v1/catalog/notes/` (`AllowAny`): retorna `{ "top_notes": [...], "heart_notes": [...], "base_notes": [...], "families": [...] }` agregando de forma ordenada e sem duplicatas todas as notas presentes nos perfumes aprovados do banco. |
| **RF-20.5** | **[Mobile — Tela de Produto]** Atualizar `mobile/src/app/product/[id].tsx`:<br>- Exibir o card de afinidade **"✨ X% Match com seu Perfil"** quando `match_percentage > 0`.<br>- Destacar visualmente as `matched_notes` dentro da Pirâmide Olfativa.<br>- Consumir `GET /api/v1/products/recommended/?exclude_id={id}` na vitrine horizontal inferior *"Combina com seu perfil olfativo"*.<br>- Remover o botão estático de coração no topo da imagem. |
| **RF-20.6** | **[Mobile — Edição do Perfil Olfativo]** Atualizar `mobile/src/app/(shop)/account/edit-olfactory-profile.tsx`:<br>- Adicionar header com botão Voltar.<br>- Carregar as notas de `GET /api/v1/catalog/notes/` (com fallback seguro).<br>- Permitir salvar quando `selectedFamilies.length > 0 || selectedNotes.length > 0`. |

---

## Fluxo de Interface e Comportamento

### 1. Tela de Detalhes do Perfume (`/product/[id]`) com Match Olfativo
```text
┌─────────────────────────────────────────────┐
│ [←]                                   [🔗]  │
│              ( Foto do Frasco )             │
├─────────────────────────────────────────────┤
│ MAISON NOIRE (OFICIAL) ✓                    │
│ Delina Exclusif                             │
│ Eau de Parfum • Oriental                    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ✨ 90% Match com seu Perfil Olfativo    │ │
│ │ Combina com sua família Oriental e com  │ │
│ │ suas notas de Baunilha e Bergamota.     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ A partir de R$ 13,00                        │
├─────────────────────────────────────────────┤
│ Pirâmide Olfativa                           │
│ 🟠 Notas de Saída                           │
│ [ Lichia ] [ Pera ] [ ✦ Bergamota ]         │
│ 🟢 Notas de Coração                         │
│ [ Rosa Turca ] [ Incenso ]                  │
│ 🟤 Notas de Fundo                           │
│ [ ✦ Baunilha ] [ Âmbar ] [ Vetiver ]        │
├─────────────────────────────────────────────┤
│ Combina com seu Perfil Olfativo             │
│ ┌──────────────┐  ┌──────────────┐          │
│ │ ✨ 85% Match │  │ ✨ 75% Match │          │
│ │ Black Opium  │  │ Sauvage      │          │
│ └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────┘
```

### 2. Tela "Meu Perfil Olfativo" (`/account/edit-olfactory-profile`)
```text
┌─────────────────────────────────────────────┐
│ [←]  Meu Perfil Olfativo                    │
├─────────────────────────────────────────────┤
│ 1. Quais famílias olfativas te conquistam?  │
│ [✓ Amadeirado] [  Cítrico ] [✓ Oriental ]   │
│ [  Floral    ] [  Fougère ] [  Gourmand ]   │
│                                             │
│ 2. Suas notas favoritas (3/10 selecionadas) │
│ Notas de Saída (extraídas do catálogo)      │
│ [✓ Bergamota ] [ Limão ] [ Pimenta Rosa ]   │
│ Notas de Coração                            │
│ [✓ Jasmim ] [ Rosa ] [ Lavanda ] [ Íris ]   │
│ Notas de Fundo                              │
│ [✓ Baunilha ] [ Âmbar ] [ Sândalo ] [ Oud ] │
├─────────────────────────────────────────────┤
│        [ Salvar Preferências Olfativas ]    │
└─────────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Cliente autenticado com `olfactory_families=["Oriental"]` e `preferred_notes=["Baunilha", "Bergamota"]` recebe `match_percentage >= 75` e `matched_notes` preenchido ao consultar um perfume Oriental que contenha Baunilha e Bergamota. |
| **CA-02** | `GET /api/v1/products/recommended/` retorna apenas perfumes aprovados que possuem estoque ativo (`stock_quantity > 0`), ordenados do maior `match_percentage` para o menor. |
| **CA-03** | Usuário sem perfil olfativo preenchido recebe `is_personalized: false` e lista ordenada por `sold_count` sem erro `500`. |
| **CA-04** | Na tela `/product/[id]`, as notas em comum com o perfil do usuário aparecem destacadas na Pirâmide Olfativa e o botão estático de favoritar não existe mais. |
| **CA-05** | `GET /api/v1/catalog/notes/` retorna dinamicamente as notas de saída, coração e fundo existentes nos perfumes aprovados do banco. |
| **CA-06** | Na tela `edit-olfactory-profile.tsx`, o cliente consegue voltar pelo header e salvar alterações selecionando apenas famílias, apenas notas ou ambos. |

---

## Testes (TDD)

### Backend (`apps/catalog/tests/test_recommendations.py`)
- Calcula corretamente `match_percentage`, `matched_notes` e `matched_family` para cliente com perfil olfativo.
- Correspondência parcial e case-insensitive de notas (ex.: `"bergamota"` no perfil dá match com `"Bergamota da Calábria"` no produto).
- Produtos sem estoque (`stock_quantity = 0`) ou de lojas inativas não aparecem em `/api/v1/products/recommended/`.
- Cliente sem perfil olfativo recebe fallback ordenado por `sold_count`.
- Endpoint `/api/v1/catalog/notes/` retorna listas agregadas sem duplicidade.

### Mobile (`__tests__/ProductMatchAndProfile.test.tsx`)
- Renderiza o badge `✨ X% Match` e destaca as notas correspondentes na pirâmide olfativa do produto.
- Tela `edit-olfactory-profile` carrega notas da API e habilita o botão Salvar ao escolher ao menos 1 família ou 1 nota.

---

## Arquivos

**Backend:**
- `apps/catalog/services/recommendation_service.py` — **[NOVO]** motor de cálculo de afinidade olfativa e extração de notas.
- `apps/catalog/serializers.py` — **[MODIFY]** inclusão de `match_percentage`, `matched_notes` e `matched_family` em `ProductSerializer`.
- `apps/catalog/views.py` — **[MODIFY]** adição de `RecommendedProductListView` e `CatalogNotesView`.
- `apps/catalog/urls.py` — **[MODIFY]** registro de `products/recommended/` e `catalog/notes/`.
- `apps/catalog/tests/test_recommendations.py` — **[NOVO]** suíte de testes TDD do algoritmo.

**Mobile:**
- `src/services/stores.ts` — **[MODIFY]** métodos `getRecommendedProducts()` e `getCatalogNotes()` + tipagem de `match_percentage` e `matched_notes`.
- `src/app/product/[id].tsx` — **[MODIFY]** card de Match Olfativo, destaque nas notas da pirâmide, remoção do botão de coração estático e vitrine de recomendados real.
- `src/app/(shop)/account/edit-olfactory-profile.tsx` — **[MODIFY]** header de navegação, consumo de notas do catálogo e flexibilização do botão salvar.

---

## Referências

- [RF-03](../sprint-1/RF-03_Catalogo_Base_Piramide_Olfativa.md) — Pirâmide Olfativa no Catálogo Global
- [RF-06](../sprint-2/RF-06_Cadastro_Cliente_Mobile.md) — Coleta inicial de `olfactory_families` e `preferred_notes`
- [RF-07](../sprint-2/RF-07_Login_e_Perfil_Mobile.md) — Edição do Perfil Olfativo na Minha Conta

