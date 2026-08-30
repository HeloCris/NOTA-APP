# Fluxos de Negócio

## 1. Fluxo de Onboarding da Loja

Este fluxo descreve os passos desde o interesse de um lojista até a sua ativação na plataforma.

1.  **Cadastro Inicial:** O lojista preenche um formulário na landing page ou painel web com dados básicos (Nome da Empresa, CNPJ, E-mail, Telefone).
2.  **Envio de Documentos:** O lojista faz o upload dos documentos necessários (ex: Contrato Social, Documento dos Sócios, Comprovante de Endereço).
3.  **Análise (Pendente de Aprovação):** O status da loja fica como "Pendente". O Admin Plataforma recebe uma notificação.
4.  **Aprovação/Rejeição:**
    *   **Aprovado:** O Admin aprova o cadastro. O lojista recebe um e-mail com as credenciais de acesso definitivo e instruções. O status da loja muda para "Ativa".
    *   **Rejeitado:** O Admin rejeita, podendo informar o motivo (ex: documento inválido). O lojista é notificado e pode reenviar.
5.  **Configuração Inicial:** O lojista acessa o painel, configura frete, meios de pagamento (se aplicável por loja) e começa a gerenciar seu catálogo.

## 2. Fluxo do Catálogo

O sistema utiliza um modelo de **Catálogo Global**, onde o produto base é único na plataforma, evitando duplicidade e melhorando a busca olfativa.

1.  **Vínculo com Catálogo Global:**
    *   O lojista busca um perfume no painel (ex: "Acqua di Gio").
    *   O sistema retorna o produto do catálogo global.
    *   O lojista clica em "Adicionar ao meu estoque".
    *   O lojista define seu preço de venda e quantidade em estoque (`StoreProduct`).
2.  **Novo Cadastro (Solicitação):**
    *   O lojista não encontra o perfume no catálogo global.
    *   Ele preenche um formulário de solicitação de novo produto, incluindo: Nome, Marca, Foto, Descrição, e a **Pirâmide Olfativa** (Notas de Saída, Notas de Corpo, Notas de Fundo), e Família Olfativa.
    *   O Admin Plataforma revisa a solicitação. Se correta, adiciona ao Catálogo Global (`Product`), tornando-o disponível para o lojista solicitante e para todos os outros no futuro.

## 3. Fluxo do Pedido

Acompanhamento do ciclo de vida de uma compra no marketplace.

1.  **Abertura do Pedido:** O Cliente finaliza o checkout no App. Se o carrinho tiver itens de duas lojas diferentes, o sistema gera **dois pedidos distintos** (um para cada loja), possivelmente atrelados a uma mesma "Transação" ou "Sessão de Checkout". Status inicial: **Pendente** (Aguardando pagamento).
2.  **Pagamento Confirmado:** O gateway aprova o pagamento. O status muda para **Pago / Em Separação**. O lojista é notificado.
3.  **Em Separação:** O lojista inicia a preparação do pacote.
4.  **Enviado:** O lojista emite a nota fiscal, gera a etiqueta de frete, despacha o produto e insere o código de rastreio no painel. O status muda para **Enviado**. O Cliente é notificado no App.
5.  **Entregue:** A transportadora confirma a entrega ou o lojista altera manualmente. Status final: **Entregue**.
