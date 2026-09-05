# RF-06 — Cadastro de Cliente Mobile (B2C Onboarding)

> **Sprint:** 2 | **Prioridade:** 🔴 Alta | **Estimativa:** 8 SP | **Depende de:** RF-01

---

## Descrição

Fluxo de cadastro do consumidor B2C exclusivamente via aplicativo mobile (React Native / Expo Router). O onboarding é estruturado em telas sequenciais para reduzir fricção e coletar o Perfil Olfativo do usuário de forma progressiva. O usuário também pode optar pelo cadastro rápido via Google OAuth.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-06.1** | Tela 1 — Dados Gerais: coleta `first_name`, `phone`, `email` e `password`. Validações em tempo real com feedback visual inline. |
| **RF-06.2** | Tela 2 — Famílias Olfativas: apresenta cards ilustrados das 7 famílias (Amadeirado, Cítrico, Oriental, Floral, Fougère, Aquático, Gourmand). O usuário seleciona as que mais se identificam (múltipla escolha). |
| **RF-06.3** | Tela 3 — Notas Preferidas: exibe chips de notas olfativas agrupados por categoria (Saída, Corpo, Fundo). O usuário seleciona no mínimo 1 e no máximo 10 notas. |
| **RF-06.4** | Botão "Pular" visível nas Telas 2 e 3. Ao pular, exibe um `Toast` leve: *"Tudo bem! Você pode completar seu perfil olfativo depois em 'Minha Conta'."* |
| **RF-06.5** | Opção "Entrar com Google" na Tela 1 via `expo-auth-session` + `google-auth`. O backend cria ou recupera o usuário via `POST /api/v1/auth/google/`. |
| **RF-06.6** | **[Backend — Adaptação Arquitetural]** Adicionar campos ao model `CustomUser`: `olfactory_families` (`JSONField`, default=`[]`) e `preferred_notes` (`JSONField`, default=`[]`). Criar e aplicar migration. |
| **RF-06.7** | **[Backend — Novo Endpoint]** `POST /api/v1/auth/google/` — recebe `id_token` do Google, valida com a biblioteca `google-auth`, cria usuário com `role=CUSTOMER` caso não exista, retorna par de tokens JWT. |
| **RF-06.8** | **[Backend — Novo Endpoint]** `PATCH /api/v1/auth/me/olfactory-profile/` — usuário autenticado envia `olfactory_families` e `preferred_notes`. Permissão: `IsAuthenticated`. |
| **RF-06.9** | `POST /api/v1/auth/register/` — atualizado para aceitar opcionalmente `olfactory_families` e `preferred_notes` no body de cadastro. |
| **RF-06.10** | Após cadastro ou login com Google, redirecionar para `(shop)/index` via `router.replace`. |

> [!IMPORTANT]
> Os campos `olfactory_families` e `preferred_notes` são **opcionais** em todos os endpoints. Nunca bloquear o cadastro por ausência deles. A validação de `olfactory_families` deve verificar se os valores pertencem ao enum de famílias definido em `Product.OlfactoryFamily`.

> [!WARNING]
> O `id_token` do Google **nunca** deve ser armazenado no device. Apenas o par JWT emitido pelo backend (access + refresh) deve ser persistido via `SecureStore`.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | Cadastro completo (3 telas) → usuário criado no banco com `olfactory_families` e `preferred_notes` preenchidos, role `CUSTOMER`. |
| **CA-02** | Cadastro com "Pular" nas telas 2 e 3 → usuário criado com `olfactory_families=[]` e `preferred_notes=[]`. Toast de confirmação exibido. |
| **CA-03** | `POST /api/v1/auth/google/` com `id_token` válido → cria usuário (primeiro acesso) ou recupera existente, retorna tokens JWT. |
| **CA-04** | `POST /api/v1/auth/google/` com `id_token` inválido → `400 Bad Request` com mensagem clara. |
| **CA-05** | Campos `email` inválido ou já cadastrado → erro inline na Tela 1, sem avançar para a Tela 2. |
| **CA-06** | `PATCH /api/v1/auth/me/olfactory-profile/` com família inválida (ex: `"Inexistente"`) → `400 Bad Request`. |

---

## Testes (TDD)

**Backend** (`apps/users/tests/test_register.py`, `test_google_auth.py`):
- Cadastro com perfil olfativo completo → `201`, campos gravados corretamente.
- Cadastro sem perfil olfativo → `201`, `olfactory_families=[]`.
- `POST /auth/google/` com token válido (mock) → `200`, JWT retornado.
- `POST /auth/google/` com token inválido → `400`.
- `PATCH /auth/me/olfactory-profile/` sem autenticação → `401`.
- `PATCH /auth/me/olfactory-profile/` com família inválida → `400`.

**Mobile** (`__tests__/RegisterFlow.test.tsx`):
- Tela 1 renderiza campos e valida e-mail em tempo real.
- Botão "Próximo" desabilitado com campos inválidos.
- Tela "Pular" exibe Toast com mensagem correta.
- Fluxo completo navega para `(shop)/index` após cadastro.

---

## Wireframe — Fluxo de Telas

**Tela 1 — Dados Gerais:**
- Logo NŌTA + título "Crie sua conta"
- Inputs: Nome, Telefone, E-mail, Senha (com toggle de visibilidade)
- Botão primário: `Próximo →`
- Separador `ou`
- Botão secundário: `[ G ] Continuar com Google`
- Link: `Já tenho conta → Login`

**Tela 2 — Famílias Olfativas:**
- Título: *"Quais famílias te conquistam?"*
- Grid 2x4 de cards com ilustração + nome da família
- Selecionados ganham borda e ícone de check
- Rodapé: `[ Pular ]` | `[ Próximo → ]`

**Tela 3 — Notas Preferidas:**
- Título: *"Suas notas favoritas"*
- Chips agrupados: 🌿 Saída | 🌸 Corpo | 🪵 Fundo
- Contador: `3/10 notas selecionadas`
- Rodapé: `[ Pular ]` | `[ Criar conta ✓ ]`

---

## Arquivos

**Backend:**
- `apps/users/models.py` — **[MODIFY]** Adicionar `olfactory_families` e `preferred_notes` (JSONField).
- `apps/users/migrations/000X_add_olfactory_profile.py` — **[NOVO]**
- `apps/users/views.py` — **[MODIFY]** Atualizar `RegisterView`; adicionar `GoogleAuthView` e `OlfactoryProfileView`.
- `apps/users/serializers.py` — **[MODIFY]** Adicionar campos opcionais ao `RegisterSerializer`; criar `GoogleAuthSerializer`, `OlfactoryProfileSerializer`.
- `apps/users/urls.py` — **[MODIFY]** Registrar rotas `/auth/google/` e `/auth/me/olfactory-profile/`.
- `apps/users/tests/test_google_auth.py` — **[NOVO]**

**Mobile:**
- `src/app/(auth)/register.tsx` — **[NOVO]** Controlador do fluxo multi-step.
- `src/app/(auth)/onboarding/families.tsx` — **[NOVO]** Tela 2.
- `src/app/(auth)/onboarding/notes.tsx` — **[NOVO]** Tela 3.
- `src/components/common/OlfactoryFamilyCard.tsx` — **[NOVO]**
- `src/components/common/NoteChip.tsx` — **[NOVO]**
- `src/services/auth.ts` — **[MODIFY]** Adicionar `registerWithGoogle`, `updateOlfactoryProfile`.
- `src/context/AuthContext.tsx` — **[MODIFY]** Incluir `olfactoryProfile` no estado global.

---

## Dependências

**Backend:** `google-auth>=2.0` (validação de `id_token`), `python-dotenv` (já instalado)
**Mobile:** `expo-auth-session`, `expo-crypto`, `@react-native-google-signin/google-signin`

---

## Referências

- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/auth/register/` e `/auth/me/`
- [`modelo-relacional.md`](../../../02-banco-de-dados/modelo-relacional.md) — Model `User` e campos JSONField
- [`perfis-e-permissoes.md`](../../../01-regras-de-negocio/perfis-e-permissoes.md) — Regras do perfil CUSTOMER
- [`estrutura-app-mobile-expo.md`](../../../03-arquitetura/estrutura-app-mobile-expo.md) — Estrutura de pastas e roteamento
