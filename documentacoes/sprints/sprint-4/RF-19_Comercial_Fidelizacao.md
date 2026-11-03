# RF-19 — Ferramentas Comerciais e Fidelização (Cupons, Parcelamento e Lojas Seguidas)

> **Sprint:** 4  
> **Prioridade:** 🟡 Média  
> **Estimativa:** 7 SP  
> **Depende de:** RF-10 (Checkout), RF-11 (Pagamento), RF-18 (Notificações)

---

## Descrição

Consolida as ferramentas comerciais do lojista (`SELLER` e `BRAND_OWNER` com D2C ativo) e a retenção/fidelização de clientes no app mobile:
1. **Cupons de Desconto da Loja (`Seller Coupon`):** criação e gestão de cupons próprios com regras de valor mínimo, limite de uso e validade, aplicáveis exclusivamente aos produtos da loja emitente no checkout.
2. **Configuração de Parcelamento no Cartão:** definição pelo lojista de parcelas máximas, parcelas sem juros e valor de parcela mínima.
3. **Lojas Seguidas (Mobile):** funcionalidade de "Seguir Loja" com listagem dedicada no perfil do consumidor e disparo de notificação quando a loja seguida lança cupom novo.

---

## Regras de Negócio

### 1. Cupons de Desconto da Loja

| ID | Regra |
|---|---|
| **RN-01** | **Escopo da Loja:** O cupom criado pela loja aplica desconto **apenas** sobre os itens daquela loja específica no carrinho multi-loja. Não reduz o valor do frete nem afeta produtos de outras lojas. |
| **RN-02** | **Tipos e Parâmetros:** Código alfanumérico único (em caixa alta, ex.: `VERAO10`), tipo de desconto (`PERCENTAGE` ou `FIXED_VALUE`), valor do desconto, valor mínimo do subtotal da loja (`min_purchase_amount`), data de expiração (`valid_until`) e limite global de usos (`usage_limit`). |
| **RN-03** | **Validação no Checkout:** O cupom só pode ser aplicado se: estiver ativo, dentro do prazo de validade, abaixo do limite de utilizações e se o subtotal da loja atingir o valor mínimo. Se inválido, exibe erro claro ao cliente. |
| **RN-04** | **Consumo de Uso:** Ao concluir o pagamento do pedido, o contador `used_count` do cupom é incrementado de forma atômica. Em caso de cancelamento total antes do envio, o uso pode ser estornado. |

### 2. Parcelamento no Cartão (Configurações da Loja)

| ID | Regra |
|---|---|
| **RN-05** | **Configurações por Loja:** O lojista define em suas configurações:<br>- `max_installments`: Número máximo de parcelas aceitas (1 a 12, padrão: 6).<br>- `free_interest_installments`: Quantidade de parcelas sem juros assumidas pela loja (1 a `max_installments`, padrão: 3).<br>- `min_installment_amount`: Valor mínimo de cada parcela (padrão: R$ 30,00). |
| **RN-06** | **Aplicação no Checkout:** O seletor de parcelas no checkout calcula as opções possíveis considerando o total da loja e respeitando a parcela mínima. As parcelas além do limite sem juros exibem acréscimo informativo da taxa da operadora de cartão. |

### 3. Lojas Seguidas (Fidelização Mobile)

| ID | Regra |
|---|---|
| **RN-07** | **Ação de Seguir/Deixar de Seguir:** Botão na vitrine/perfil da loja no app mobile (`/store/[id]`). A ação é idempotente (toggle) e incrementa/decrementa atomicamente o contador `Store.followers_count`. |
| **RN-08** | **Listagem "Lojas que Sigo":** Acessível a partir da aba Minha Conta (`(shop)/profile/following.tsx`), listando todas as lojas seguidas com logo, nome, selo de Loja Oficial, nota de avaliação e link para a vitrine. |
| **RN-09** | **Notificação de Novo Cupom:** Ao ativar um novo cupom na loja, uma notificação automática é gerada na central de notificações (RF-18) para todos os clientes que seguem aquela loja: *"A loja [Nome] acabou de lançar o cupom [CÓDIGO] de X% OFF! Aproveite."* |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-19.1** | **[Backend — Models]** Criar `StoreCoupon` (`store`, `code`, `discount_type`, `discount_value`, `min_purchase_amount`, `usage_limit`, `used_count`, `valid_until`, `is_active`, `created_at`) e `StoreFollower` (`store`, `user`, `created_at`). |
| **RF-19.2** | **[Backend — Model Store]** Adicionar campos `max_installments`, `free_interest_installments`, `min_installment_amount` e `followers_count` no model `Store`. |
| **RF-19.3** | **[Backend — Endpoints Lojista]**<br>- `GET /api/v1/store/coupons/` — listagem dos cupons da loja autenticada.<br>- `POST /api/v1/store/coupons/` — criação de cupom (com validações de unicidade e limites).<br>- `PATCH /api/v1/store/coupons/{id}/` — ativar/desativar ou editar cupom.<br>- `PATCH /api/v1/store/settings/installments/` — salvar parâmetros de parcelamento. |
| **RF-19.4** | **[Backend — Endpoints Cliente]**<br>- `POST /api/v1/checkout/validate-coupon/` — valida código e retorna valor deduzido para a respectiva loja.<br>- `POST /api/v1/stores/{id}/follow/` — alterna estado de seguir/deixar de seguir loja.<br>- `GET /api/v1/customers/following-stores/` — lista lojas seguidas pelo cliente. |
| **RF-19.5** | **[Web — Painel Lojista]** Nova aba ou modal de Cupons em Configurações/Marketing para gerenciar códigos ativos, e card de parcelamento na aba de Configurações/Financeiro. |
| **RF-19.6** | **[Mobile — Lojas Seguidas]** Botão Seguir/Seguindo no perfil da loja e tela "Lojas que Sigo" no perfil do cliente. |
| **RF-19.7** | **[Mobile — Checkout]** Input de cupom por loja no resumo do pedido e seletor de parcelas alimentado pelas regras da loja. |

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Cupom com validade expirada ou limite de uso esgotado retorna erro no checkout e não aplica desconto. |
| **CA-02** | O desconto de um cupom de loja reduz apenas o subtotal da respectiva loja, sem diminuir o frete. |
| **CA-03** | Lojista não consegue visualizar ou alterar cupons de outras lojas (`403` / `404`). |
| **CA-04** | Seguir uma loja altera o estado do botão no mobile para "Seguindo" e incrementa `followers_count` da loja. |
| **CA-05** | Deixar de seguir remove a loja da lista "Lojas que Sigo" do cliente e decrementa o contador. |
| **CA-06** | As opções de parcelamento no checkout respeitam a parcela mínima e a quantidade máxima configurada pela loja. |
| **CA-07** | Ao criar um cupom, clientes seguidores da loja recebem notificação na central (RF-18). |

---

## Testes (TDD)

### Backend
- `apps/stores/tests/test_coupons.py` — criação de cupons, validação de regras de desconto (% e fixo), valor mínimo e expiração.
- `apps/stores/tests/test_store_follow.py` — seguir/deixar de seguir e listagem de seguidos.
- `apps/stores/tests/test_installments_config.py` — validação de limites de parcelamento.

### Frontend Web
- `StoreCoupons.test.tsx` — listagem e formulário de novo cupom.

### Mobile
- `__tests__/FollowStoreButton.test.tsx` — alternância de estado do botão Seguir.
- `__tests__/CouponInput.test.tsx` — validação e aplicação do cupom no checkout.

---

## Arquivos

**Backend:**
- `apps/stores/models.py` — **[MODIFY]** campos de parcelamento e followers.
- `apps/stores/models_coupon.py` ou `coupons/` — **[NOVO]** models `StoreCoupon` e `StoreFollower`.
- `apps/stores/views.py` — **[MODIFY]** endpoints de cupons, follow e parcelas.
- `apps/orders/views.py` — **[MODIFY]** aplicação do cupom no checkout.

**Web:**
- `src/features/store/StoreCoupons.tsx` — **[NOVO]** gestão de cupons.
- `src/components/seller/SettingsTab.tsx` — **[MODIFY]** bloco de parcelamento.

**Mobile:**
- `src/app/(shop)/store/[id].tsx` — **[MODIFY]** botão seguir.
- `src/app/(shop)/profile/following.tsx` — **[NOVO]** lista de lojas seguidas.
- `src/app/(shop)/checkout/index.tsx` — **[MODIFY]** campo de cupom e parcelamento.

---

## Referências

- [RF-10](../sprint-3/RF-10_Checkout_MultiLoja.md) — Checkout e carrinho multi-loja
- [RF-18](./RF-18_Mensageria_Notificacoes.md) — Notificação aos seguidores sobre cupom novo
