# Mapa de Telas - Painel Web (Lojista)

> **Nota de UI:** Todas as telas descritas neste documento devem ser implementadas consumindo estritamente os tokens de cor e tipografia definidos em [design-system.md](design-system.md).

O Painel Web do Lojista é acessado via navegador desktop e foca na gestão operacional do marketplace para aquele tenant específico. A estrutura visual baseia-se em uma **Side Bar** (Menu Lateral) e uma área principal de conteúdo.

## 1. Dashboard (Visão Geral) — RF-17
*   **Seletor de Período:** Alternância rápida entre **7 dias** e **30 dias**.
*   **Métricas Principais (Cards):**
    *   Faturamento Bruto e Faturamento Líquido (descontados 10% de comissão sobre produtos e reembolsos).
    *   Ticket Médio do período.
    *   Pedidos Pendentes (aguardando ação operacional).
    *   Taxa Consolidada de Cancelamento e Devolução (ex.: "3.2% cancelados · 1.1% devolvidos").
    *   Valor Total em Estoque (patrimônio em produtos ativos).
    *   Alertas de Estoque (produtos com menos de 3 unidades).
    *   Visualizações da Loja (contador real de acessos no mobile).
*   **Gráfico de Desempenho (SVG dinâmico):** Curva real de vendas dia a dia no período selecionado (7d ou 30d).
*   **Atividades Recentes:** Tabela dos últimos pedidos recebidos, com link "Ver Todos" direcionando para a aba de Pedidos e clique na linha abrindo o detalhe do pedido.
*   **Alerta de Reposição:** Lista de produtos com estoque crítico (< 3 un.) com atalho rápido "Repor" para a tela de estoque.
*   *(Nota: O antigo bloco estático de "Top Perfumes" foi removido).*
*   **Card de Avaliação (RF-16):** Nota média da loja + total de avaliações; ao clicar, redireciona para a tela de Avaliações (`/store/reviews`).

## 1.1 Avaliações (`/store/reviews`) — RF-16
*   **Resumo:** média, total e distribuição por estrela.
*   **Filtros:** Perfume, Nota (1–5), Só com fotos, Sem resposta.
*   **Ordenação:** Mais recentes, Mais antigas, Maior nota, Menor nota.
*   **Card da Avaliação:** autor ("Nome S."), data, perfume + volumetria, nº do pedido, comentário, fotos (tela cheia), tag "Editada".
*   **Ação:** Responder / Editar resposta (resposta pública, 1 por avaliação). Vale para lojista e Loja Oficial.

## 1.2 Mensagens e Chat (`/store/messages`) — RF-18
*   **Lista Lateral de Conversas:** Lista de clientes em contato, com avatar, nome, última mensagem, timestamp e badge de não lidas.
*   **Área de Chat:**
    *   Header com nome do cliente e badge indicativo do Pedido vinculado (com link direto para o pedido quando aplicável).
    *   Linha do tempo com balões de conversa, data/hora e fotos anexadas com clique para zoom.
    *   Barra de envio: campo de texto, botão de anexo de foto e botão enviar.
    *   Sincronização em tempo real via polling a cada 5s.

## 1.3 Central de Notificações (Header) — RF-18
*   Botão do Sino com badge de não lidas. Dropdown com lista rápida de eventos (novos pedidos, mensagens, cancelamentos, avaliações, estoque baixo) e botão "Marcar todas como lidas".

## 2. Gestão de Produtos (Meu Estoque)
*   **Listagem de Produtos:** Tabela (DataGrid) contendo foto, nome, marca, preço de venda, quantidade em estoque e status (Ativo/Inativo).
*   **Ações da Tabela:** Editar (modal/página para alterar preço e estoque), Pausar Anúncio, Excluir.
*   **Adicionar Novo Produto:**
    *   *Passo 1:* Busca no Catálogo Global NŌTA. Se encontrar, importa e define preço/estoque.
    *   *Passo 2 (Fallback / Brand Hub):* Cadastro de produto pelo lojista ou dono de marca (formulário completo com upload de foto, concentração [Parfum/EDP/EDT/EDC/Eau Fraîche], classificação de gênero [Feminino/Masculino/Compartilhável] e definição da pirâmide olfativa).

## 3. Gestão de Pedidos
*   **Fila de Pedidos (Kanban ou Tabela Avançada):** Listagem de pedidos recebidos.
*   **Filtros:** Por Status (Pago, Em Separação, Enviado, Entregue, Cancelado) + aba **"Solicitações"** (cancelamentos, devoluções e contestações pendentes — RF-15), por Data, por ID do Pedido.
*   **Detalhes do Pedido (Tela `/store/orders/:id`):**
    *   Dados do Comprador (Nome, Endereço de Entrega com aviso "Endereço alterado" quando aplicável, Contato).
    *   Itens Comprados (foto, nome, volume, Quantidade x Preço).
    *   Resumo Financeiro (Subtotal, Frete, Total).
    *   Histórico (timeline com ator e motivo de cada transição).
    *   **Ações de Status:** Marcar como "Em Separação", Informar Rastreio e marcar como "Enviado", Marcar como Entregue, Cancelar (com motivo), Aprovar/Recusar cancelamento, Resolver contestação (Reenviado/Reembolsar), Aprovar/Recusar devolução e Marcar devolução recebida (com opção "Em condições de revenda").

## 4. Configurações da Loja
*   **Dados Cadastrais:** Edição de Nome Fantasia, CNPJ, Telefone, E-mail de suporte.
*   **Personalização:** Upload de Logo da Loja e Banner (se aplicável ao perfil da loja no app).
*   **Financeiro e Parcelamento (RF-19):** Configuração de parcelas máximas aceitas (1 a 12), parcelas sem juros assumidas pela loja e valor de parcela mínima. Extrato de repasses e comissões da plataforma.
*   **Cupons de Desconto (RF-19):** Gerenciamento e criação de cupons próprios da loja (% ou R$), valor mínimo, limite de usos e validade.

## Telas Externas
*   **Landing Page de Onboarding:** Tela pública para atração de novos sellers, com explicação de taxas e formulário de cadastro de interesse.
*   **Login / Recuperação de Senha:** Tela de acesso ao painel.
