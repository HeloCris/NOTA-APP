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

## 4. Aba Métricas e Inteligência de Mercado — RF-23 & RF-24
Acessível pelo menu lateral **"Métricas"** em `SellerHomePage` e `BrandHomePage`, dividida em duas visões complementares:

### 4.1 Visão 1: 🌍 Inteligência de Mercado & Tendências Olfativas (`MarketMetricsSection` — RF-23)
*   **Pulso do Mercado (4 KPIs):** Família olfativa #1 entre os clientes do app, Nota da pirâmide mais desejada, Participação de vendas de Decants ($\le 15\text{ml}$) no marketplace e Total de fragrâncias/ofertas ativas.
*   **Mapa de Demanda por Família Olfativa:** Gráfico de barras horizontais mostrando o percentual de clientes da NŌTA adeptos de cada uma das 7 famílias (`CustomUser.olfactory_families`) comparado à quantidade de produtos no catálogo.
*   **Ranking Top 10 Notas Favoritas dos Clientes:** As 10 notas da pirâmide (`CustomUser.preferred_notes`) mais buscadas/favoritadas pelos consumidores.
*   **Termômetro de Formato (Decants $\le 15\text{ml}$ vs. Frascos $> 15\text{ml}$):** Comparativo visual da proporção de unidades vendidas e ticket médio de cada formato no marketplace.
*   **Benchmark de Preço por Família e Top 5 Perfumes em Alta:** Compara o preço médio da loja com o mercado e sinaliza quais dos 5 perfumes mais vendidos da NŌTA já estão ou não no catálogo da loja (`in_my_catalog`).

### 4.2 Visão 2: 📊 Desempenho da Minha Loja & Diagnóstico de Gap (`StoreAnalyticsSection` — RF-24)
*   **Seletor de Período:** `7 dias`, `30 dias` ou `Todo o período`.
*   **Funil da Vitrine e Fidelização:** Visitas à vitrine (`views_count`) $\rightarrow$ Seguidores conquistados (`StoreFollower`) $\rightarrow$ Pedidos pagos e Taxa de Conversão estimada.
*   **Performance de Cupons (RF-19) e Mix de Receita da Loja:** Receita gerada por Decants vs. Frascos na própria loja e desempenho dos cupons de desconto.
*   **Diagnóstico de *Gap de Catálogo* (Oportunidades de Estoque):** Cruza as famílias e notas mais desejadas pelos clientes com o estoque ativo da loja, alertando sobre notas/famílias em alta onde a loja possui `0` ofertas e sugerindo perfumes do catálogo mestre para ofertar imediatamente.
*   **Ranking de Ofertas Campeãs da Loja:** Tabela com os itens mais vendidos da loja por volumetria, estoque atual e receita.

## 5. Configurações da Loja e Busca Rápida na Topbar
*   **Busca Rápida na Topbar (RF-24):** O campo de pesquisa no topo do painel filtra e navega diretamente para os produtos da loja.
*   **Dados Cadastrais:** Edição de Nome Fantasia, CNPJ, Telefone, E-mail de suporte.
*   **Personalização:** Upload de Logo da Loja e Banner (se aplicável ao perfil da loja no app).
*   **Financeiro e Parcelamento (RF-19):** Configuração de parcelas máximas aceitas (1 a 12), parcelas sem juros assumidas pela loja e valor de parcela mínima. Extrato de repasses e comissões da plataforma.
*   **Cupons de Desconto (RF-19):** Gerenciamento e criação de cupons próprios da loja (% ou R$), valor mínimo, limite de usos e validade.

## Telas Externas
*   **Landing Page de Onboarding:** Tela pública para atração de novos sellers, com explicação de taxas e formulário de cadastro de interesse.
*   **Login / Recuperação de Senha:** Tela de acesso ao painel.
