# RF-01 — Autenticação, Perfis & Sessão

> **Sprint:** 1 | **Prioridade:** 🔴 Alta | **Estimativa:** 5 SP

---

## Descrição

Usuário faz cadastro ou login com e-mail e senha. Backend valida, emite JWT com `role` no payload. Frontend armazena sessão e redireciona por perfil (`ADMIN` / `SELLER` / `CUSTOMER`). Token expirado → interceptor tenta refresh automático antes de redirecionar ao login.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-01.1** | `CustomUser` com `AbstractBaseUser`: campos `email` (único), `name`, `role`, `is_active` |
| **RF-01.2** | JWT customizado com claims `user_id`, `role`, `email` e `store_id` (se `SELLER`) |
| **RF-01.3** | `POST /api/v1/auth/register/` — cadastro com hash de senha e validação de e-mail único |
| **RF-01.4** | `POST /api/v1/auth/token/` e `POST /token/refresh/` — emissão e renovação de tokens |
| **RF-01.5** | `GET /api/v1/auth/me/` — retorna dados do usuário logado |
| **RF-01.6** | Telas de Login e Cadastro (web) com validação client-side (React Hook Form + Zod) |
| **RF-01.7** | `AuthContext` + `ProtectedRoute` por role — redireciona se não autenticado ou sem permissão |
| **RF-01.8** | Interceptor Axios — injeta `Bearer <token>` e trata `401` com refresh automático |

> [!IMPORTANT]
> Senhas nunca em texto plano. Payload JWT sem dados sensíveis além de `user_id`, `role` e `store_id`.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | E-mail duplicado no cadastro → `400` com mensagem no campo `email` |
| **CA-02** | Login de Seller → tokens com `role == "SELLER"` e `store_id` |
| **CA-03** | Login com senha errada → `401`, sem tokens |
| **CA-04** | `/me/` sem token → `401` |
| **CA-05** | Rota protegida sem sessão → redirect `/login` |
| **CA-06** | Refresh válido após `401` → nova request executada automaticamente |

---

## Testes (TDD)

**Backend** (`apps/users/tests/test_auth.py`): registro `201`, e-mail duplicado `400`, login com claims corretas, senha errada `401`, `/me/` autenticado e sem token.

**Frontend** (`LoginForm.test.tsx`): renderização, validação de campos vazios, erro de `401` exibido sem gravar tokens.

---

## Arquivos

**Backend:** `models.py`, `managers.py`, `serializers.py`, `views.py`, `urls.py`, `tests/test_auth.py` — todos **[NOVO]** em `apps/users/`. Alterar `settings.py` (`AUTH_USER_MODEL`, `SIMPLE_JWT`).

**Frontend:** `LoginForm.tsx`, `RegisterForm.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx` — **[NOVO]**. Alterar `apiClient.ts` com interceptors.

---

## Dependências

**Backend:** `djangorestframework-simplejwt`, `pytest-django`
**Frontend:** `react-hook-form`, `zod`, `axios`, `jwt-decode`

---

## Referências

- [`politicas-permissoes-drf.md`](../../../01-regras-de-negocio/politicas-permissoes-drf.md) — Claims JWT e Permission Classes
- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos dos endpoints
- [`plano-de-testes.md`](../../../05-qualidade-e-testes/plano-de-testes.md) — Casos `AUTH-01` a `AUTH-05`
