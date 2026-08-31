# RF-02 — Setup do Painel Web & Onboarding da Loja

> **Sprint:** 1 | **Prioridade:** 🔴 Alta | **Estimativa:** 5 SP | **Depende de:** RF-01

---

## Descrição

Usuário autenticado com perfil `SELLER` acessa o painel web e configura sua loja (CNPJ, Razão Social, Nome Fantasia, Bio Olfativa, Logo). Após salvar, os dados aparecem no cabeçalho e na sidebar sem reload de página.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-02.1** | Setup base do frontend web (React + Vite): roteamento, layout com Sidebar fixa, Header e Axios configurado |
| **RF-02.2** | Model `Store` no Django: `OneToOneField(User)`, campos `cnpj`, `name`, `bio`, `logo_url`, `cover_url`, `is_active`, `vacation_mode`, migrations SQLite |
| **RF-02.3** | `POST /api/v1/stores/` — cria loja vinculada ao usuário logado (suporta `multipart/form-data` para envio de imagens) |
| **RF-02.4** | `GET /api/v1/stores/me/` — retorna dados da loja do usuário autenticado |
| **RF-02.5** | `PATCH /api/v1/stores/me/` — atualização parcial de dados, bio olfativa, logo e capa (suporta `multipart/form-data`) |
| **RF-02.6** | Formulário de onboarding com validação matemática de CNPJ e formato via `zod`, unicidade via API e toast de sucesso |
| **RF-02.7** | Permission class `IsStoreOwner` garantindo que o lojista só acesse/edite sua própria loja |

> [!IMPORTANT]
> CNPJ deve ser sanitizado (somente números) e validado contra duplicidade no serializer antes da inserção.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | CNPJ duplicado ou inválido → `400` com campo `cnpj` descritivo |
| **CA-02** | Salvamento com sucesso → Nome Fantasia e Logo refletidos na Sidebar/Header sem reload |
| **CA-03** | Usuário sem role `SELLER` → `403 Forbidden` em qualquer endpoint de loja |
| **CA-04** | Lojista A não consegue acessar ou editar dados da Loja B → `403` ou `404` |

---

## Testes (TDD)

**Backend** (`apps/stores/tests/test_stores.py`): criação de loja `201`, CNPJ duplicado `400`, criação por usuário não-seller `403`, acesso de Seller A à loja de Seller B `403/404`. Validação de atualização parcial via `PATCH` permitindo apenas campos autorizados.

**Frontend** (`StoreProfileForm.test.tsx`): renderização dos campos, submissão válida chama serviço com payload correto (incluindo tratamento de arquivos), toast de sucesso exibido. Validação de erro de CNPJ inválido barrado pelo `zod`.

---

## Wireframe — Painel do Lojista

**Layout:**
- **Sidebar:** Logo NŌTA, tag "Seller Hub", links para Dashboard / Catálogo / Pedidos / Configurações.
- **Header:** Status "Loja Ativa", avatar do usuário.
- **Área central (card de configurações):**
  - Upload de Logo e Capa.
  - Campos: Nome Fantasia, Razão Social, CNPJ, Telefone.
  - Textarea: "Bio Olfativa da Loja".
  - **Toggle (Chave): "Modo Férias"** (deixa a vitrine visível mas desativa novas compras).
  - Botão **"Salvar Perfil da Loja"** (destaque âmbar `#C5A880`).
  - Se a loja estiver **Desativada** (`is_active: false`), os campos ficam cinzas (somente leitura), e na Zona de Perigo exibe-se um botão verde **"Reativar Loja"** em vez do botão vermelho de desativação.

---

## Arquivos

**Backend:** `apps/stores/models.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_stores.py` — **[NOVO]**. Adicionar `IsStoreOwner` em `apps/core/permissions.py`.

**Frontend:** `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/pages/onboarding/StoreProfilePage.tsx`, `src/features/store/StoreProfileForm.tsx`, `src/services/storeService.ts` — **[NOVO]**.

---

## Dependências

**Backend:** nenhuma nova (usa DRF + simplejwt do RF-01)
**Frontend:** `react-hot-toast` (toasts), `react-hook-form`, `zod`

---

## Referências

- [`politicas-permissoes-drf.md`](../../../01-regras-de-negocio/politicas-permissoes-drf.md) — `IsStoreOwner` detalhado
- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/stores/`
- [`modelo-relacional.md`](../../../02-banco-de-dados/modelo-relacional.md) — Model `Store` e relacionamentos
