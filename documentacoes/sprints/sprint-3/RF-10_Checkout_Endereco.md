# RF-10 — Checkout e Endereço de Entrega (Mobile)

> **Sprint:** 3  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 5 SP  
> **Depende de:** RF-08 (Carrinho)

---

## Descrição

Tela de fechamento de pedido no aplicativo mobile. O usuário revisa os itens do carrinho (agrupados por loja), preenche ou seleciona o endereço de entrega com validação/autofill de CEP via ViaCEP, escolhe a modalidade de frete disponível e avança para a etapa de pagamento (RF-11).

---

## 🚚 Como Funciona a Logística e Frete no Marketplace (Benchmark e Modelo Adotado)

Em marketplaces com múltiplos vendedores (como Mercado Livre, Shopee, Enjoei e a NOTA), existem 3 modelos logísticos comuns no mercado:

1. **Fulfillment Centralizado (Mercado Livre Full):**
   - O vendedor envia o estoque antecipadamente para o galpão do marketplace.
   - O marketplace empacota e envia tudo junto em um único pacote.
   - *Desvantagem para o MVP:* Custo de infraestrutura alto e complexo para início.

2. **Drop-Shipping Integrado com Hub de Transportadoras (Melhor Envio / Frenet / Correios WebService):**
   - Cada loja é a origem da postagem física.
   - O marketplace calcula cotações em tempo real nas transportadoras (Correios, Jadlog, Loggi).
   - O lojista recebe a etiqueta pré-paga gerada pelo marketplace e despacha na agência mais próxima.

3. **Modelo de Precificação Regional por Zonas (Adotado):**
   - **Origem por Loja:** Se o cliente comprar perfumes de duas lojas com origens distintas, são gerados pacotes e cotações independentes para cada origem.
   - **Tabelas de Frete por Região:** O lojista/marca define taxas e prazos diferenciados conforme a distância do destino em relação ao seu estado de origem:
     - **Mesmo Estado (Local):** Frete mais ágil e acessível (ex: SP -> SP).
     - **Mesma Região (ex: Sudeste -> Sudeste):** Tarifa interestadual intermediária.
     - **Demais Regiões do Brasil:** Tarifa longa distância (Sul, Centro-Oeste, Nordeste, Norte).
   - **Composição dos Prazos Exibidos para o Cliente:**
     - **Prazo de Manuseio/Expedição (`shipping_handling_days`):** Tempo que a loja leva para separar, embalar com proteção e postar (ex: 1 a 2 dias úteis).
     - **Prazo de Trânsito da Transportadora:** Estimativa dos Correios/transportadora para a modalidade (PAC ou SEDEX) e rota.
     - **Prazo Total de Entrega:** `Prazo de Envio (Manuseio) + Prazo de Trânsito = Prazo Total de Entrega`, garantindo total clareza no checkout.

---

## 🔒 Regras de Negócio Críticas (RF-10 / Gestão de Loja)

### RN-01: Dependência Sequencial Obrigatória (Endereço → Frete)
1. **A seção de "Configurações de Frete" fica estritamente BLOQUEADA (inoperante/disabled/incapaz de receber valores)** até que o lojista preencha todos os dados obrigatórios do **Endereço de Origem** (`postal_code`, `street`, `number`, `neighborhood`, `city`, `state`) e clique em **"Salvar"**, persistindo o endereço com sucesso no banco de dados.
2. Enquanto o endereço não estiver salvo, exibe-se um card com badge de aviso explicativo informando: *"Cadastre e salve o Endereço de Origem da loja para liberar a configuração das taxas e prazos de frete."*
3. Somente após a confirmação no banco de que a loja tem endereço de origem válido, o card de frete é desbloqueado para edição.

### RN-02: Requisito de Visibilidade e Venda (Aparecer na Plataforma)
1. Uma loja (lojista ou Marca D2C) **NÃO PODE VENDER** e **NÃO FICA ATIVA/VISÍVEL** na vitrine pública ou buscas enquanto:
   - Não tiver **Endereço Completo** salvo no banco de dados;
   - Não tiver pelo menos os valores de **Frete Base (PAC e SEDEX)** configurados e salvos.
2. Lojas sem endereço ou sem frete têm a propriedade computada `is_ready_to_sell = False`. O backend e a vitrine pública (`Showcase`) barram lojas que não cumpram esses pré-requisitos, impedindo compras de produtos órfãos de frete.

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-10.1** | Rota `src/app/(shop)/checkout/index.tsx` — resumo da compra com itens **agrupados por loja**, discriminando subtotal de cada loja. |
| **RF-10.2** | Seção de **Endereço de Entrega**: formulário com `cep`, `street`, `number`, `complement`, `neighborhood`, `city` e `state`. |
| **RF-10.3** | Consulta de CEP via API pública (ViaCEP) ao preencher 8 dígitos no campo `cep`, preenchendo automaticamente logradouro, bairro, cidade e UF. |
| **RF-10.4** | **Cálculo de Frete Independente por Loja:** Cotação individual de frete (**SEDEX** ou **PAC**) para cada loja do carrinho, baseando-se no CEP de destino e na cidade/estado de origem daquela loja específica. |
| **RF-10.5** | **Seleção de Frete por Pacote:** O cliente seleciona a modalidade de entrega desejada para cada loja separadamente, com visualização clara de prazo e preço. |
| **RF-10.6** | **Cupons de Desconto (Modelo Shopee):**
  - **Cupom por Loja:** Campo ou seletor para aplicar código de desconto exclusivo para a loja selecionada.
  - **Cupom da Plataforma / Frete:** Campo para aplicar cupons globais do marketplace. |
| **RF-10.7** | **Frete Somente no Checkout:** O cálculo e a cobrança de frete ocorrem exclusivamente após clicar em "Finalizar Compra" no carrinho. A tela do carrinho permanece focada no subtotal dos produtos. |
| **RF-10.8** | **[Web - Lojista & Marca]** Seção de **Configuração de Frete Regional**: valores para frete estadual/local (`shipping_local_pac`, `shipping_local_sedex`) e nacional (`shipping_pac_price`, `shipping_sedex_price`), prazo de manuseio (`shipping_handling_days`) e threshold de Frete Grátis (`free_shipping_threshold`). |
| **RF-10.9** | **[Web - Bloqueio Sequencial]** Bloqueio dos inputs de frete enquanto o formulário de endereço da loja não estiver salvo e persistido no banco de dados. |
| **RF-10.10** | **[Backend - Cotação de Frete Regional]** Endpoint `POST /api/v1/stores/{id}/shipping-quote/` que compara o UF de origem da loja com o CEP/UF de destino para aplicar a tarifa correta e retornar detalhes de prazo de postagem vs. prazo de entrega final. |
| **RF-10.11** | **[Mobile - Endereço Padrão Pré-selecionado]** Ao acessar a etapa de entrega, mesmo que seja a primeira compra do usuário, se ele já possuir endereços previamente cadastrados nas configurações de sua conta ("Meus Endereços"), o endereço marcado como padrão (`is_default = true`) é automaticamente selecionado e exibido no card de entrega, calculando o frete de forma imediata sem exigir digitação manual. |
| **RF-10.12** | **[Mobile - Seleção entre Endereços Salvos ou Novo]** Na seção de entrega, é disponibilizada a opção **"Trocar"** que abre a listagem de todos os endereços salvos do usuário (ex: Casa, Trabalho, etc.). O usuário pode alternar para qualquer endereço salvo (com recálculo dinâmico de frete) ou clicar em **"Adicionar outro endereço"** para preencher um novo local de recebimento. Caso preencha um novo, ele é salvo em "Meus Endereços" para pedidos futuros. |

> [!IMPORTANT]
> O CEP inválido ou não encontrado deve exibir feedback visual claro e impedir o avanço para o cálculo de frete.

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Carrinho vazio acessando o checkout redireciona de volta para a aba do carrinho. |
| **CA-02** | Digitação de CEP válido (8 dígitos) preenche automaticamente logradouro, bairro, cidade e estado e calcula os fretes de todas as lojas presentes na compra. |
| **CA-03** | CEP inválido ou inexistente exibe mensagem de erro amigável. |
| **CA-04** | A alteração da opção de envio de uma loja atualiza o frete total e o valor final a pagar de forma reativa. |
| **CA-05** | Aplicação de cupom válido deduz o desconto correspondente com feedback visual. |
| **CA-06** | Botão **"Ir para Pagamento"** permanece desabilitado se o formulário de endereço estiver incompleto ou o frete não estiver selecionado. |

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
│ 🚚 Frete e Prazos                       │
│    (o) SEDEX / Expresso                 │
│        • Envio em até 1 dia útil        │
│        • Trânsito: 1 a 2 dias úteis     │
│        • Prazo Final: 2 a 3 dias úteis  │
│        • Valor: R$ 25,00                │
│                                         │
│    ( ) PAC / Econômico                  │
│        • Envio em até 1 dia útil        │
│        • Trânsito: 4 a 6 dias úteis     │
│        • Prazo Final: 5 a 7 dias úteis  │
│        • Valor: R$ 14,00                │
├─────────────────────────────────────────┤
│ [ Ir para Pagamento → R$ 374,90 ]       │
└─────────────────────────────────────────┘
```
---

## Arquivos
 
+**Backend:**
+- `apps/stores/models.py` — **[MODIFY]** Adição dos campos de configuração de frete no modelo `Store`.
+- `apps/stores/serializers.py` — **[MODIFY]** Inclusão dos campos de frete em `StoreOwnerSerializer` e `StorePublicSerializer`.
+- `apps/stores/views.py` — **[MODIFY]** Endpoint de cotação de frete (`/api/v1/stores/{id}/shipping-quote/`).
+
+**Web (Lojista & Marca):**
+- `src/types/store.ts` — **[MODIFY]** Adição dos campos de frete nas interfaces `Store` e `StoreUpdatePayload`.
+- `src/components/seller/SettingsTab.tsx` — **[MODIFY]** Nova seção de configuração de frete (PAC, SEDEX, Frete Grátis e Prazo).
+- `src/components/brand/BrandSettingsTab.tsx` — **[MODIFY]** Nova seção de configuração de frete para Loja Oficial D2C da Marca.
+
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