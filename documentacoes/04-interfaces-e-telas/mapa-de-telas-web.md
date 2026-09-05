# Mapa de Telas - Painel Web (Lojista)

O Painel Web do Lojista é acessado via navegador desktop e foca na gestão operacional do marketplace para aquele tenant específico. A estrutura visual baseia-se em uma **Side Bar** (Menu Lateral) e uma área principal de conteúdo.

## 1. Dashboard (Visão Geral)
*   **Métricas Principais (Cards):** Vendas do dia, Faturamento do Mês, Pedidos Pendentes, Produtos com Estoque Baixo.
*   **Gráfico de Desempenho:** Linha do tempo de vendas na última semana/mês.
*   **Atividades Recentes:** Lista rápida dos últimos pedidos recebidos aguardando ação.

## 2. Gestão de Produtos (Meu Estoque)
*   **Listagem de Produtos:** Tabela (DataGrid) contendo foto, nome, marca, preço de venda, quantidade em estoque e status (Ativo/Inativo).
*   **Ações da Tabela:** Editar (modal/página para alterar preço e estoque), Pausar Anúncio, Excluir.
*   **Adicionar Novo Produto:**
    *   *Passo 1:* Busca no Catálogo Global NŌTA. Se encontrar, importa e define preço/estoque.
    *   *Passo 2 (Fallback):* Solicitar cadastro de novo produto (formulário completo com upload de foto e definição da pirâmide olfativa) - Sujeito a aprovação do Admin.

## 3. Gestão de Pedidos
*   **Fila de Pedidos (Kanban ou Tabela Avançada):** Listagem de pedidos recebidos.
*   **Filtros:** Por Status (Pendente, Processando, Enviado, Concluído, Cancelado), por Data, por ID do Pedido.
*   **Detalhes do Pedido (Modal ou Tela Nova):**
    *   Dados do Comprador (Nome, Endereço de Entrega, Contato).
    *   Itens Comprados (Quantidade x Preço).
    *   Resumo Financeiro (Subtotal, Frete, Total).
    *   **Ações de Status:** Botões para avançar o fluxo do pedido (Ex: Marcar como "Em Separação", Informar Código de Rastreio e marcar como "Enviado").

## 4. Configurações da Loja
*   **Dados Cadastrais:** Edição de Nome Fantasia, CNPJ, Telefone, E-mail de suporte.
*   **Personalização:** Upload de Logo da Loja e Banner (se aplicável ao perfil da loja no app).
*   **Financeiro (Extrato):** Visão dos repasses recebidos da plataforma, comissões retidas e histórico de transferências (Pode ser uma aba separada dependendo da complexidade).

## Telas Externas
*   **Landing Page de Onboarding:** Tela pública para atração de novos sellers, com explicação de taxas e formulário de cadastro de interesse.
*   **Login / Recuperação de Senha:** Tela de acesso ao painel.
