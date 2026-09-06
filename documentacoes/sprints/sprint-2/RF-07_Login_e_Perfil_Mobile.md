# RF-07 — Login e Perfil Mobile

> **Sprint:** 2 | **Prioridade:** 🔴 Alta | **Estimativa:** 6 SP | **Depende de:** RF-01, RF-06

---

## Descrição

Autenticação segura do consumidor B2C no aplicativo mobile, suportando login via e-mail/senha e Login com Google. O JWT é armazenado com segurança no device via `SecureStore` e injetado automaticamente nas rotas protegidas. A aba "Minha Conta" oferece visualização e edição do perfil do usuário, incluindo a possibilidade de completar o Perfil Olfativo que pode ter sido pulado durante o onboarding da RF-06.

---

## Requisitos Funcionais

| ID | Descrição |
| :--- | :--- |
| **RF-07.1** | Tela de Login: campos `email` e `password`, botão primário "Entrar" e botão "[ G ] Entrar com Google". |
| **RF-07.2** | Login padrão via `POST /api/v1/auth/token/`. Em caso de sucesso, salvar `access_token` e `refresh_token` no `SecureStore`. |
| **RF-07.3** | Login com Google via `expo-auth-session`. Trocar `id_token` Google por tokens JWT do backend via `POST /api/v1/auth/google/` (definido na RF-06). |
| **RF-07.4** | Renovação silenciosa do `access_token` expirado via `POST /api/v1/auth/token/refresh/`, interceptada automaticamente por um interceptor Axios no `services/api.ts`. |
| **RF-07.5** | Logout: chamar `POST /api/v1/auth/token/blacklist/` para invalidar o `refresh_token` no servidor e limpar ambos os tokens do `SecureStore`. |
| **RF-07.6** | Guard de rota: `AuthContext` verifica token na inicialização do app. Usuário não autenticado é redirecionado para `(auth)/login`. Usuário autenticado é redirecionado para `(shop)/`. |
| **RF-07.7** | **Aba "Minha Conta" — Dados Pessoais:** exibe `first_name`, `last_name`, `email`, `phone`. Botão "Editar" abre modal ou tela de edição com `PATCH /api/v1/auth/me/`. |
| **RF-07.8** | **Aba "Minha Conta" — Perfil Olfativo:** exibe as `olfactory_families` e `preferred_notes` salvas. Se ambos estiverem vazios, exibe CTA: *"Complete seu perfil olfativo e receba recomendações personalizadas 🌸"* com botão "Completar agora". |
| **RF-07.9** | Tela/modal de edição do Perfil Olfativo reutiliza os componentes `OlfactoryFamilyCard` e `NoteChip` da RF-06. Salva via `PATCH /api/v1/auth/me/olfactory-profile/`. |
| **RF-07.10** | **[Backend — Adaptação]** `GET /api/v1/auth/me/` deve incluir `olfactory_families` e `preferred_notes` no response para clientes com `role=CUSTOMER`. |

> [!IMPORTANT]
> O `access_token` e o `refresh_token` devem ser armazenados **exclusivamente** via `expo-secure-store`. Nunca usar `AsyncStorage` para dados de autenticação — violação de segurança crítica.

> [!WARNING]
> O interceptor de refresh deve implementar um mecanismo de fila para evitar múltiplas chamadas de refresh simultâneas (race condition). Se o refresh falhar (token revogado/expirado), o usuário deve ser deslogado automaticamente e redirecionado para a tela de login.

---

## Critérios de Aceitação

| ID | Critério |
| :--- | :--- |
| **CA-01** | Login com credenciais válidas → tokens salvos no `SecureStore`, usuário redirecionado para `(shop)/`. |
| **CA-02** | Login com senha incorreta → `401`, mensagem de erro inline na tela, sem navegar. |
| **CA-03** | `access_token` expirado em requisição → interceptor renova silenciosamente e reenvia a requisição original sem interrupção para o usuário. |
| **CA-04** | `refresh_token` expirado → usuário deslogado automaticamente e redirecionado para `(auth)/login`. |
| **CA-05** | Logout → tokens removidos do `SecureStore`, `refresh_token` invalidado no servidor, redireciona para `(auth)/login`. |
| **CA-06** | Aba "Minha Conta" com perfil olfativo vazio → CTA de completar perfil exibido. |
| **CA-07** | Aba "Minha Conta" com perfil olfativo preenchido → famílias e notas exibidas como chips, sem CTA. |
| **CA-08** | Edição do perfil olfativo → `PATCH` enviado, dados atualizados na tela sem necessidade de recarregar. |

---

## Testes (TDD)

**Backend** (`apps/users/tests/test_auth.py`):
- `GET /auth/me/` com token válido de CUSTOMER → response inclui `olfactory_families` e `preferred_notes`.
- `GET /auth/me/` com token de SELLER → response inclui `store_id`, sem campos olfativos.
- `POST /auth/token/blacklist/` com refresh válido → `205 No Content`, token blacklistado.

**Mobile** (`__tests__/LoginScreen.test.tsx`, `__tests__/ProfileTab.test.tsx`):
- Tela de login renderiza campos e botões corretamente.
- Credenciais inválidas → erro exibido, sem navegação.
- `AuthContext` inicializado com token válido no `SecureStore` → usuário não redirecionado para login.
- Aba "Minha Conta" sem perfil olfativo → CTA renderizado.
- Aba "Minha Conta" com perfil preenchido → chips de famílias e notas renderizados.

---

## Wireframe — Telas

**Tela de Login:**
- Logo NŌTA centralizado
- Input Email + Input Senha (toggle de visibilidade)
- Link "Esqueci minha senha"
- Botão primário: `Entrar`
- Separador `ou`
- Botão: `[ G ] Entrar com Google`
- Link inferior: `Não tem conta? Cadastre-se`

**Aba "Minha Conta" — Estado com perfil incompleto:**
- Avatar + Nome do usuário
- Seção "Dados Pessoais" com campos editáveis
- Card de destaque (cor suave): *"Seu perfil olfativo está incompleto 🌸"* + botão `Completar agora`
- Botão "Sair" no rodapé

**Aba "Minha Conta" — Estado com perfil completo:**
- Avatar + Nome do usuário
- Seção "Dados Pessoais"
- Seção "Meu Perfil Olfativo":
  - Linha "Famílias": chips horizontais com scroll (ex: `Amadeirado`, `Floral`)
  - Linha "Notas favoritas": chips de notas selecionadas
  - Botão `Editar preferências`
- Botão "Sair" no rodapé

---

## Arquivos

**Backend:**
- `apps/users/serializers.py` — **[MODIFY]** `MeSerializer` incluir `olfactory_families` e `preferred_notes` para role `CUSTOMER`.
- `apps/users/views.py` — **[MODIFY]** `MeView` atualizar response por role.
- `apps/users/tests/test_auth.py` — **[MODIFY]** Adicionar casos de teste para novos campos no `/me/`.

**Mobile:**
- `src/app/(auth)/login.tsx` — **[NOVO]**
- `src/app/(auth)/_layout.tsx` — **[NOVO]** Layout do grupo de autenticação (sem Tab Bar).
- `src/app/(shop)/profile.tsx` — **[NOVO]** Aba "Minha Conta".
- `src/app/(shop)/edit-olfactory-profile.tsx` — **[NOVO]** Tela de edição do perfil olfativo.
- `src/services/api.ts` — **[NOVO]** Instância Axios com interceptor de refresh token e fila anti-race-condition.
- `src/services/auth.ts` — **[MODIFY]** `login`, `loginWithGoogle`, `logout`, `refreshToken`, `getMe`, `updateProfile`.
- `src/context/AuthContext.tsx` — **[NOVO]** Estado global: `user`, `isAuthenticated`, `isLoading`, `login`, `logout`, `updateOlfactoryProfile`.
- `src/app/_layout.tsx` — **[NOVO]** Layout raiz: inicializa `AuthContext`, aplica guard de rota.

---

## Dependências

**Backend:** nenhuma nova (usa `djangorestframework-simplejwt` já instalado)
**Mobile:** `expo-secure-store`, `expo-auth-session`, `expo-crypto`, `axios`

---

## Referências

- [`especificacao-api-rest.md`](../../../03-arquitetura/especificacao-api-rest.md) — Contratos de `/auth/token/`, `/auth/me/`, `/auth/token/refresh/`, `/auth/token/blacklist/`
- [`perfis-e-permissoes.md`](../../../01-regras-de-negocio/perfis-e-permissoes.md) — Regras do perfil CUSTOMER e SELLER
- [`estrutura-app-mobile-expo.md`](../../../03-arquitetura/estrutura-app-mobile-expo.md) — Estrutura de rotas `(auth)/` e `(shop)/`
- [RF-06](./RF-06_Cadastro_Cliente_Mobile.md) — Componentes `OlfactoryFamilyCard` e `NoteChip`, endpoint `/auth/google/`
