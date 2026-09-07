# RF-09 — Gestão de Marcas D2C (Brand Hub)

> **Sprint:** 2 | **Prioridade:** 🔴 Alta | **Estimativa:** 10 SP | **Depende de:** RF-01, RF-02, RF-03

---

## Descrição

Estrutura completa para o onboarding, validação e gestão de marcas oficiais na plataforma NŌTA. Introduz o papel `BRAND_OWNER`, que possui um painel web exclusivo (Brand Hub) para gerenciar seu portfólio de perfumes com ficha técnica rigorosa. O modelo D2C permite que a marca ative uma Loja Oficial, gerando automaticamente um tenant de vendas com o selo de autenticidade da plataforma.

---

## Requisitos Funcionais

### Backend — Model e Migrations

| ID | Descrição |
| :--- | :--- |
| **RF-09.1** | **[Adaptação Arquitetural]** Adicionar `BRAND_OWNER` aos choices do campo `role` em `CustomUser` (`max_length` deve ser ajustado para `15`). Criar migration. |
| **RF-09.2** | **[Novo Model]** Expandir `Brand` com os campos: `owner` (`FK(User)`, nullable), `cnpj` (`CharField(14)`, unique, nullable), `inpi_registration` (`CharField(50)`, nullable), `status` (`CharField` com choices `PENDING` / `APPROVED` / `REJECTED`, default `PENDING`), `is_official` (`BooleanField`, default `False`), `d2c_store` (`OneToOneField(Store)`, nullable). Criar migration. |
| **RF-09.3** | **[Adaptação Arquitetural]** Adicionar `ean` (`CharField(13)`, unique, **obrigatório**) e `anvisa_code` (`CharField(30)`, unique, **obrigatório**) ao model `Product`. Alterar `olfactory_family`, `top_notes`, `heart_notes`, `base_notes` para `blank=False` (campo obrigatório). Criar migration. |
| **RF-09.4** | **[Adaptação Arquitetural]** Adicionar `is_official` (`BooleanField`, default `False`) ao model `Store` para identificar Lojas Oficiais D2C na vitrine. |

### Backend — Endpoints Brand Onboarding

| ID | Descrição |
| :--- | :--- |
| **RF-09.5** | `POST /api/v1/brands/register/` — submissão de Brand Onboarding. Permissão: `IsAuthenticated`. Body: `name`, `cnpj`, `inpi_registration`. Cria `Brand` com `status=PENDING` e vincula ao usuário (que ainda não recebe `BRAND_OWNER` até aprovação). |
| **RF-09.6** | `PATCH /api/v1/admin/brands/{id}/approve/` — Admin aprova ou rejeita a marca. Body: `status` (`APPROVED` ou `REJECTED`), `rejection_reason` (opcional). Ao aprovar: `Brand.status=APPROVED`, `Brand.is_official=True`, `owner.role=BRAND_OWNER`. Permissão: `IsPlatformAdmin`. |
| **RF-09.7** | `GET /api/v1/brands/me/` — retorna os dados da marca do `BRAND_OWNER` autenticado. Permissão: `IsBrandOwner`. |
| **RF-09.8** | `PATCH /api/v1/brands/me/` — edição parcial dos dados da marca (nome, logo). Permissão: `IsBrandOwner`. |

### Backend — Endpoints Brand Hub (Portfólio)

| ID | Descrição |
| :--- | :--- |
| **RF-09.9** | `GET /api/v1/brands/me/products/` — lista todos os produtos do portfólio da marca autenticada (incluindo `is_approved=False`). Permissão: `IsBrandOwner`. |
| **RF-09.10** | `POST /api/v1/brands/me/products/` — cadastro de novo perfume. Validação obrigatória: `ean` (formato EAN-13, 13 dígitos), `anvisa_code`, `olfactory_family`, `top_notes` (≥ 1 item), `heart_notes` (≥ 1 item), `base_notes` (≥ 1 item). Produto criado com `is_approved=True` automaticamente (marca já validada pelo Admin). Permissão: `IsBrandOwner`. |
| **RF-09.11** | `PATCH /api/v1/brands/me/products/{id}/` — edição de perfume do portfólio. Revalida `ean` e `anvisa_code`. Permissão: `IsBrandOwner` + `has_object_permission` (produto pertence à marca). |
| **RF-09.12** | `DELETE /api/v1/brands/me/products/{id}/` — remoção do portfólio (soft-delete via `is_approved=False`). Não remove do catálogo se houver `StoreProduct` vinculado. Permissão: `IsBrandOwner`. |

### Backend — Endpoint de Ativação D2C

| ID | Descrição |
| :--- | :--- |
| **RF-09.13** | `POST /api/v1/brands/me/activate-d2c/` — ativa o modelo D2C. Cria automaticamente uma `Store` com `name=Brand.name`, `is_official=True`, vinculada ao `BRAND_OWNER`. Persiste `Brand.d2c_store`. Retorna os dados da `Store` criada e um novo par de tokens JWT com `store_id` incluído. Permissão: `IsBrandOwner`. |
| **RF-09.14** | `POST /api/v1/brands/me/deactivate-d2c/` — desativa D2C. Define `Store.is_active=False`. Não destrói a `Store` para preservar histórico de pedidos. Permissão: `IsBrandOwner`. |

### Backend — Permission Class

| ID | Descrição |
| :--- | :--- |
| **RF-09.15** | **[Novo]** Implementar `IsBrandOwner` em `apps/core/permissions.py` conforme especificado em `politicas-permissoes-drf.md`. |
| **RF-09.16** | **[Adaptar]** `CustomTokenObtainPairSerializer` — incluir `brand_id` e `store_id` (D2C) no JWT para usuários `BRAND_OWNER`. |

### Frontend Web — Brand Hub

| ID | Descrição |
| :--- | :--- |
| **RF-09.17** | Página `/brand/register` — formulário de Brand Onboarding: Nome da Marca, CNPJ (com máscara), Número INPI, campo de upload de documentos. Estado pós-envio: banner "Sua solicitação está em análise". |
| **RF-09.18** | Página `/brand/hub` — painel protegido (role `BRAND_OWNER`). Exibe nome da marca, badge "Marca Oficial ✓", e tabela de perfumes do portfólio. |
| **RF-09.19** | Modal/formulário de cadastro de perfume: campos `name`, `ean` (com validação de 13 dígitos em tempo real), `anvisa_code`, `olfactory_family` (select), `top_notes`, `heart_notes`, `base_notes` (inputs de chips dinâmicos), `image_url`. Todos obrigatórios — sem opção de pular. |
| **RF-09.20** | Card de ativação D2C na página do Brand Hub: banner destacado com CTA **"Ativar Loja Oficial e começar a vender"**. Ao clicar, abre modal de confirmação detalhando o que será criado. Após confirmação, chama `POST /brands/me/activate-d2c/` e redireciona para o painel de lojista. |
| **RF-09.21** | Após ativação D2C, o Brand Hub exibe uma seção "Minha Loja Oficial" com link para o painel de lojista (`/store/dashboard`). O badge muda para "Marca Oficial + Loja D2C ✓". |

> [!IMPORTANT]
> O `ean` deve ser validado tanto no frontend (regex `^\d{13}$`) quanto no backend (serializer `validate_ean`). Um EAN-13 inválido não pode ser persistido em hipótese alguma — é o identificador universal do produto.

> [!WARNING]
> A ativação D2C é uma operação de alto impacto: cria um novo tenant, altera o JWT e modifica o role efetivo do usuário. Exibir modal de confirmação detalhado antes de executar. Logar a ação no Django Admin para auditoria.

> [!NOTE]
> O `DELETE` de produto (RF-09.12) usa soft-delete para não quebrar `StoreProduct` de outros lojistas que já vincularam aquele perfume ao seu estoque. O produto some do catálogo público mas mantém integridade referencial.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | `POST /brands/register/` com CNPJ válido → Brand criada com `status=PENDING`, usuário ainda é `CUSTOMER`/`SELLER`. |
| **CA-02** | `PATCH /admin/brands/{id}/approve/` com `status=APPROVED` → `Brand.is_official=True`, `owner.role=BRAND_OWNER`. |
| **CA-03** | `PATCH /admin/brands/{id}/approve/` com `status=REJECTED` e reason → Brand rejeitada, role do usuário não muda. |
| **CA-04** | `POST /brands/me/products/` sem `ean` → `400 Bad Request` com campo indicado. |
| **CA-05** | `POST /brands/me/products/` com `ean` de 12 dígitos → `400 Bad Request` com mensagem de validação EAN-13. |
| **CA-06** | `POST /brands/me/products/` com `top_notes=[]` → `400 Bad Request`. |
| **CA-07** | `POST /brands/me/products/` com todos os campos válidos → produto criado com `is_approved=True`, aparece no catálogo público. |
| **CA-08** | `POST /brands/me/activate-d2c/` → `Store` criada com `is_official=True`, `Brand.d2c_store` preenchida, JWT renovado com `store_id`. |
| **CA-09** | `BRAND_OWNER` sem D2C → acesso a `/store-products/` retorna `403`. |
| **CA-10** | `BRAND_OWNER` com D2C → acesso a `/store-products/` retorna `200` com produtos da Loja Oficial. |
| **CA-11** | `PATCH /brands/me/products/{id}/` tentando editar produto de outra marca → `403 Forbidden`. |
| **CA-12** | Frontend: formulário de produto com `ean` inválido (< 13 dígitos) → erro inline imediato, sem chamar a API. |

---

## Testes (TDD)

**Backend** (`apps/catalog/tests/test_brand_hub.py`, `apps/catalog/tests/test_d2c.py`):
- Brand Onboarding → `201`, status `PENDING`.
- Aprovação Admin → role do owner atualizado para `BRAND_OWNER`.
- `POST /brands/me/products/` sem EAN → `400`.
- `POST /brands/me/products/` com pirâmide incompleta → `400`.
- `POST /brands/me/products/` completo → `201`, `is_approved=True`.
- `PATCH /brands/me/products/{id}/` de produto de outra marca → `403`.
- `POST /brands/me/activate-d2c/` → Store criada, `d2c_store_id` preenchido.
- `POST /brands/me/activate-d2c/` segunda vez → `400` ("D2C já ativo").
- BRAND_OWNER sem D2C → `/store-products/` retorna `403`.
- BRAND_OWNER com D2C → `/store-products/` retorna `200`.

**Frontend Web** (`BrandOnboarding.test.tsx`, `BrandHub.test.tsx`):
- Formulário de onboarding valida CNPJ com máscara.
- Input de EAN bloqueia envio com menos de 13 dígitos.
- Tabela de produtos exibe portfólio da marca.
- Modal D2C renderiza detalhes antes da confirmação.
- Após ativação D2C, Brand Hub exibe seção "Minha Loja Oficial".

---

## Wireframe — Páginas Web

**`/brand/register` — Brand Onboarding:**
- Header: Logo NŌTA + "Registre sua Marca"
- Form: Nome da Marca | CNPJ (máscara) | Nº Registro INPI | Upload de Documentos
- Botão: `Enviar para análise →`
- Pós-envio: banner âmbar "Sua solicitação está em análise. Você receberá um e-mail em até 5 dias úteis."

**`/brand/hub` — Brand Hub (após aprovação):**
```
┌─ [Logo Marca] ─────────────────────────────────────────────────────┐
│  DIOR  [✓ Marca Oficial]                        [+ Novo Perfume]  │
└────────────────────────────────────────────────────────────────────┘
│  Meu Portfólio (8 produtos)                                        │
│  ┌──────┬─────────────────┬────────────┬───────────┬──────────┐   │
│  │ EAN  │ Nome            │ Família    │ Anvisa    │ Ações    │   │
│  ├──────┼─────────────────┼────────────┼───────────┼──────────┤   │
│  │ ...  │ Sauvage         │ Amadeirado │ 25351...  │ ✏️ 🗑️  │   │
│  └──────┴─────────────────┴────────────┴───────────┴──────────┘   │
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║  💎 Ative sua Loja Oficial e venda direto aos clientes NŌTA  ║  │
│  ║                  [Ativar Loja Oficial →]                     ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
```

---

## Arquivos

**Backend:**
- `apps/users/models.py` — **[MODIFY]** Adicionar `BRAND_OWNER` ao `role choices`; ajustar `max_length`.
- `apps/catalog/models.py` — **[MODIFY]** Expandir `Brand` com novos campos; adicionar `ean`, `anvisa_code` a `Product`; tornar campos olfativos não-nulos.
- `apps/stores/models.py` — **[MODIFY]** Adicionar `is_official` ao `Store`.
- `apps/catalog/migrations/000X_brand_hub_fields.py` — **[NOVO]**
- `apps/users/migrations/000X_brand_owner_role.py` — **[NOVO]**
- `apps/stores/migrations/000X_store_is_official.py` — **[NOVO]**
- `apps/core/permissions.py` — **[MODIFY]** Implementar `IsBrandOwner`.
- `apps/catalog/views.py` — **[MODIFY]** Adicionar `BrandMeView`, `BrandProductViewSet`, `ActivateD2CView`.
- `apps/catalog/serializers.py` — **[MODIFY]** `ProductSerializer` com validação de `ean` e pirâmide obrigatória; `BrandSerializer` expandido; `BrandOnboardingSerializer`.
- `apps/catalog/urls.py` — **[MODIFY]** Registrar novas rotas `/brands/`.
- `apps/users/serializers.py` — **[MODIFY]** `CustomTokenObtainPairSerializer` com `brand_id`.
- `apps/catalog/tests/test_brand_hub.py` — **[NOVO]**
- `apps/catalog/tests/test_d2c.py` — **[NOVO]**
- `config/urls.py` — **[MODIFY]** Registrar rota do admin de aprovação de marcas.

**Frontend Web:**
- `src/pages/brand/register.tsx` — **[NOVO]** Formulário de Brand Onboarding.
- `src/pages/brand/hub.tsx` — **[NOVO]** Brand Hub.
- `src/features/brand/ProductForm.tsx` — **[NOVO]** Modal de cadastro de perfume com validação EAN.
- `src/features/brand/ActivateD2CModal.tsx` — **[NOVO]** Modal de confirmação da ativação D2C.
- `src/services/brandService.ts` — **[NOVO]** `registerBrand`, `getBrandMe`, `getMyProducts`, `createProduct`, `updateProduct`, `activateD2C`.
- `src/guards/BrandOwnerGuard.tsx` — **[NOVO]** HOC de proteção de rota para role `BRAND_OWNER`.

---

## Dependências

**Backend:** nenhuma nova (`django-cors-headers`, `djangorestframework-simplejwt` já instalados)
**Frontend:** `react-input-mask` (máscara de CNPJ), `zod` (validação de schema EAN-13 no formulário)

---

## Referências

- [`perfis-e-permissoes.md`](../../01-regras-de-negocio/perfis-e-permissoes.md) — Perfil `BRAND_OWNER` e modelo D2C
- [`politicas-permissoes-drf.md`](../../01-regras-de-negocio/politicas-permissoes-drf.md) — `IsBrandOwner`, payload JWT e tabela de endpoints
- [`fluxos-de-negocio.md`](../../01-regras-de-negocio/fluxos-de-negocio.md) — Fluxo 4: Brand Onboarding e Ativação D2C
- [`dicionario-de-dados.md`](../../02-banco-de-dados/dicionario-de-dados.md) — Campos `ean`, `anvisa_code`, `Brand` expandida
- [`modelo-relacional.md`](../../02-banco-de-dados/modelo-relacional.md) — Relacionamento `Brand` ↔ `User` ↔ `Store`
- [`especificacao-api-rest.md`](../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/brands/` e `/products/`
- [RF-03](../sprint-1/RF-03_Catalogo_Base_Piramide_Olfativa.md) — Modelo base de `Brand` e `Product`
