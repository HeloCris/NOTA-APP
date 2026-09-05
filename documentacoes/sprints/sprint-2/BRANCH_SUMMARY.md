# Branch: `feature/planejamento-sprint-2-e-ajuste-de-documentacao`

> **Criada em:** 05/09/2026 | **Base:** `develop` | **Autor:** Leticia Gomes

---

## Objetivo

Esta branch concentra todo o planejamento da **Sprint 2** do projeto NŌTA e os ajustes arquiteturais necessários para suportar as novas funcionalidades previstas.

---

## O que foi feito

### 📁 Gestão de Arquivos

- Criada a pasta `documentacoes/sprints/sprint-2/`
- **RF-05** movida da `sprint-1` → `sprint-2` como **débito técnico** (feature não entregue na sprint anterior)

---

### 📄 Novas RFs criadas (`sprint-2/`)

| Arquivo | Descrição | Estimativa |
| :--- | :--- | :---: |
| `RF-05_Vitrine_Publica_Exploracao_Lojas.md` | Débito técnico — vitrine pública e exploração de lojas | 4 SP |
| `RF-06_Cadastro_Cliente_Mobile.md` | Onboarding B2C em 3 telas com perfil olfativo e Google OAuth | 8 SP |
| `RF-07_Login_e_Perfil_Mobile.md` | Autenticação JWT com SecureStore e gestão de perfil olfativo | 6 SP |
| `RF-08_Visualizacao_Loja_Mobile.md` | Tela nativa da loja com hero parallax, chips e grid de produtos | 5 SP |
| `RF-09_Gestao_Marcas_D2C.md` | Brand Hub, validação de marcas oficiais e ativação de Loja D2C | 10 SP |

**Total estimado da Sprint 2: 33 SP**

---

### ✏️ Documentos base atualizados

| Arquivo | O que mudou |
| :--- | :--- |
| `01-regras-de-negocio/perfis-e-permissoes.md` | Adicionado o perfil **BRAND_OWNER** (§2) com suas permissões e modelo D2C |
| `01-regras-de-negocio/politicas-permissoes-drf.md` | Nova permission class `IsBrandOwner`, payload JWT para `BRAND_OWNER` e tabela de endpoints expandida |
| `01-regras-de-negocio/fluxos-de-negocio.md` | Adicionado **Fluxo 4 — Brand Onboarding e Ativação D2C** |
| `02-banco-de-dados/dicionario-de-dados.md` | `User.role` com `BRAND_OWNER`; `Brand` expandida com 6 novos campos; `Product` com `ean` e `anvisa_code` obrigatórios |

---

### 🔧 Correção técnica incluída

- Adicionado `backend/apps/catalog/migrations/__init__.py` que estava ausente, impedindo o Django de carregar as migrations do app `catalog` (causava erro `no such table: catalog_products`)

---

## Como integrar

```bash
# Abrir Pull Request no GitHub:
# https://github.com/HeloCris/NOTA-APP/pull/new/feature/planejamento-sprint-2-e-ajuste-de-documentacao

# Ou manualmente via merge local:
git checkout develop
git merge feature/planejamento-sprint-2-e-ajuste-de-documentacao
```

---

## Referências

- [RF-06](./RF-06_Cadastro_Cliente_Mobile.md)
- [RF-07](./RF-07_Login_e_Perfil_Mobile.md)
- [RF-08](./RF-08_Visualizacao_Loja_Mobile.md)
- [RF-09](./RF-09_Gestao_Marcas_D2C.md)
