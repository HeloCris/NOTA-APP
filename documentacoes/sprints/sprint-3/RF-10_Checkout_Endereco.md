# RF-10 — Checkout e Endereço de Entrega (Mobile)

> **Sprint:** 3  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 5 SP  
> **Depende de:** RF-08 (Carrinho)

---

## Descrição

Tela de fechamento de pedido no aplicativo mobile. O usuário revisa os itens do carrinho (agrupados por loja), preenche ou seleciona o endereço de entrega com validação/autofill de CEP, escolhe a modalidade de frete disponível e avança para a etapa de pagamento.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-10.1** | Rota `src/app/(shop)/checkout/index.tsx` — resumo do carrinho com itens, quantidade, preço unitário e subtotal por loja. |
| **RF-10.2** | Seção de **Endereço de Entrega**: formulário com `cep`, `street`, `number`, `complement`, `neighborhood`, `city` e `state`. |
| **RF-10.3** | Consulta de CEP via API pública (ex.: ViaCEP) ao preencher 8 dígitos no campo `cep`, preenchendo automaticamente logradouro, bairro, cidade e UF. |
| **RF-10.4** | Seleção de modalidade de frete (**Expresso / Econômico**) com cálculo simulado com base no CEP de destino e origem da loja. |
| **RF-10.5** | Persistência temporária do endereço no estado global e/ou `AsyncStorage` local do dispositivo para conveniência em compras futuras. |
| **RF-10.6** | Validação dos campos obrigatórios (`cep`, `street`, `number`, `neighborhood`, `city`, `state`) antes de habilitar o botão **"Ir para Pagamento"**. |

> [!IMPORTANT]
> O CEP inválido ou não encontrado deve exibir feedback visual claro e impedir o avanço para o cálculo de frete.

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Carrinho vazio acessando o checkout redireciona de volta para a aba do carrinho. |
| **CA-02** | Digitação de CEP válido (8 dígitos) preenche automaticamente logradouro, bairro, cidade e estado. |
| **CA-03** | CEP inválido ou inexistente exibe mensagem de erro amigável. |
| **CA-04** | Seleção de frete atualiza o valor total estimado do pedido. |
| **CA-05** | Botão **"Ir para Pagamento"** permanece desabilitado se o formulário de endereço estiver incompleto. |

---

## Testes (TDD)

### Mobile

Arquivo: `__tests__/CheckoutScreen.test.tsx`

- Renderiza o resumo do carrinho com os itens corretos.
- A busca de CEP com 8 dígitos dispara o mock da API de endereço e preenche os inputs.
- A seleção de frete recalcula o total.
- A submissão com campos vazios exibe mensagens de validação.

---

## Wireframe — Tela de Checkout

```text
┌─────────────────────────────────────────┐
│ <  Checkout                             │
├─────────────────────────────────────────┤
│ 📦 Resumo do Pedido (Loja Oficial Dior) │
│    • Sauvage EDP 100ml (x1) - R$ 349,90 │
├─────────────────────────────────────────┤
│ 📍 Endereço de Entrega                  │
│    CEP: [ 01310-100 ]                   │
│    Rua: Av. Paulista, 1000              │
│    Compl.: Apt 42 | Bairro: Bela Vista  │
│    Cidade/UF: São Paulo / SP            │
├─────────────────────────────────────────┤
│ 🚚 Frete                                │
│    (o) Expresso (2-3 dias) - R$ 25,00   │
│    ( ) Econômico (5-7 dias) - R$ 12,00  │
├─────────────────────────────────────────┤
│ [ Ir para Pagamento → R$ 374,90 ]       │
└─────────────────────────────────────────┘
```
---

## Arquivos

**Mobile:**
- `src/app/(shop)/checkout/index.tsx` — **[NOVO]** Tela principal de checkout.
- `src/components/checkout/AddressForm.tsx` — **[NOVO]** Formulário de endereço com auto-fill de CEP.
- `src/components/checkout/ShippingSelector.tsx` — **[NOVO]** Seletor de modalidade de frete.
- `src/services/cep.ts` — **[NOVO]** Serviço de consulta de CEP.

---

## Dependências

**Backend:** nenhuma nova para esta etapa de formularia/UI.  
**Mobile:** `axios` (para consulta ViaCEP), `react-hook-form` / `zod` (validação de formulário).

---

## Referências

- [RF-08](./RF-08_Visualizacao_Loja_Mobile.md) — Contexto de produtos e lojas
- [`estrutura-app-mobile-expo.md`](../../03-arquitetura/estrutura-app-mobile-expo.md) — Roteamento em `(shop)/`