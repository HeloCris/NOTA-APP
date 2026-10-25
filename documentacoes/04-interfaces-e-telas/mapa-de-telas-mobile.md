# Mapa de Telas - App Mobile (Cliente)

> **Nota de UI:** Todas as telas descritas neste documento devem ser implementadas consumindo estritamente os tokens de cor e tipografia definidos em [design-system.md](design-system.md).

A navegação principal do aplicativo será centralizada em uma **Tab Bar Inferior** com 4 abas principais, além de telas em formato stack (sobrepostas) para fluxos específicos.

## 1. Tab: Início / Vitrine (Home)
*   **Header:** Logo do App e saudação ao usuário.
*   **Banners de Destaque:** Carrossel promocional (Lançamentos, Mais Vendidos).
*   **Categorias Rápidas:** Ícones para famílias olfativas (Amadeirado, Floral, Cítrico).
*   **Lojas em Destaque:** Lista horizontal de lojistas recomendados.
*   **Feed de Produtos:** Lista vertical infinita (Infinite Scroll) de perfumes misturados de várias lojas, em formato de grid.

## 2. Tab: Busca (Explorar)
*   **Barra de Pesquisa de Texto:** Buscar por nome do perfume ou marca.
*   **Busca Olfativa (Diferencial NŌTA):**
    *   Seleção visual de Notas de Saída (ex: Bergamota, Limão).
    *   Seleção visual de Notas de Corpo (ex: Jasmim, Rosa).
    *   Seleção visual de Notas de Fundo (ex: Baunilha, Patchouli).
*   **Filtros Avançados:** Faixa de preço, Família Olfativa, Loja específica.
*   **Resultados da Busca:** Lista de produtos encontrados com os filtros aplicados.

## 3. Tab: Carrinho (Multi-loja)
*   **Lista de Itens:** Produtos adicionados, agrupados visualmente por Loja.
*   **Controles:** Alterar quantidade, remover item.
*   **Consistência de Estoque (RF-17):**
    *   Itens esgotados (`stock == 0`) exibem tag "Indisponível", subtotal zerado e bloqueiam o botão de checkout com aviso para removê-los.
    *   Itens com estoque inferior à quantidade solicitada sofrem ajuste automático para a quantidade máxima disponível com notificação toast ao cliente.
*   **Resumo de Valores:** Subtotal dos produtos e estimativa de frete (calculado por loja).
*   **Aviso de Split:** Mensagem clara informando que as entregas ocorrerão de forma separada caso haja múltiplas lojas.
*   **Botão Checkout:** Leva para a tela de finalização de compra (Stack de Checkout: Endereço -> Pagamento -> Sucesso).

## 4. Tab: Minha Conta (Perfil)
*   **Dados do Usuário:** Nome, e-mail.
*   **Meus Pedidos:** Acesso rápido ao histórico de compras.
    *   **Tela de Detalhe do Pedido:** Exibe os itens, valor pago, endereço de entrega, transportadora + código de rastreio (copiar / "Rastrear no site da transportadora") e a linha do tempo do status (Pendente, Pago, Em Separação, Enviado, Entregue, além de Cancelamento/Contestação/Devolução quando houver).
    *   **Ações por status (RF-15):** Cancelar / Solicitar cancelamento · Alterar endereço (mesma cidade) · Recebi meu pedido · Não recebi (contestar) · Solicitar devolução (seleção de itens + motivo + até 3 fotos via câmera/galeria) · Avaliar.
*   **Lojas que Sigo (RF-19):** Lista das lojas favoritadas/seguidas pelo cliente com atalho direto para suas vitrines e cupons.
*   **Endereços Salvos:** Gestão de endereços de entrega.
*   **Meios de Pagamento:** Cartões salvos.
*   **Configurações e Sair.**

## Telas em Stack (Fora da Tab Bar)

### Tela de Produto ([id].tsx)
*   Imagens em carrossel.
*   Nome, Marca e Preço.
*   **Visualização da Pirâmide Olfativa:** Representação gráfica elegante das notas de saída, corpo e fundo.
*   Loja Vendedora (com link para ver mais produtos desta loja).
*   **Nota do perfume na loja (RF-16):** "4,8 ★ · 32 avaliações" — ao tocar, abre as avaliações daquele perfume naquela loja (todas as volumetrias).
*   Botão "Adicionar ao Carrinho".

### Telas de Avaliações (RF-16)
*   **Avaliar Item:** a partir do pedido entregue — estrelas (obrigatório), comentário (opcional), até 3 fotos (câmera/galeria). Também usada para a edição única.
*   **Avaliações da Loja:** aberta ao tocar na nota no topo da página da loja.
*   **Avaliações do Perfume na Loja:** aberta ao tocar na nota na Tela de Produto.
*   **Conteúdo comum:** resumo (média + distribuição por estrela), filtros (perfume — só na visão da loja; nota; só com fotos), ordenação (mais recentes, mais antigas, maior nota, menor nota), autor "Nome S.", tag "Editada", resposta da loja e visualizador de fotos em tela cheia.

### Mensageria e Chat (`/chat/[id]`) — RF-18
*   Chat direto com a loja, com identificação no topo (logo, nome e status de resposta).
*   Se aberto a partir do pedido, card fixo no topo com número e status do pedido.
*   Balões de mensagens, envio de fotos (`expo-image-picker`) e polling a cada 5s.

### Central de Notificações (`/notifications`) — RF-18
*   Acessível pelo ícone de sino no header da Home e da Minha Conta.
*   Lista de notificações com timestamp, badge de não lidas e redirecionamento rápido ao tocar.

### Fluxo de Autenticação
*   Login, Cadastro, Recuperação de Senha.
