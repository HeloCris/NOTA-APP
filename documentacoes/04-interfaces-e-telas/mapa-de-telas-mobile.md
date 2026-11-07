# Mapa de Telas - App Mobile (Cliente)

> **Nota de UI:** Todas as telas descritas neste documento devem ser implementadas consumindo estritamente os tokens de cor e tipografia definidos em [design-system.md](design-system.md).

A navegação principal do aplicativo será centralizada em uma **Tab Bar Inferior** com 4 abas principais, além de telas em formato stack (sobrepostas) para fluxos específicos.

## 1. Tab: Início / Vitrine (Home) — RF-20 & RF-21
*   **Header Dinâmico:** Saudação com o primeiro nome real do cliente logado (`useAuth()`), iniciais do usuário como avatar (sem fotos mockadas) e atalho para a tela Minha Conta.
*   **Banners Editoriais Interativos:** Carrossel promocional (`"Descubra seu Match Olfativo"` e `"Especial Decants ≤ 15ml"`), redirecionando ao toque para a aba Explorar já filtrada.
*   **Categorias Rápidas (7 Famílias Olfativas):** Ícones das 7 famílias (`Floral`, `Amadeirado`, `Oriental`, `Cítrico`, `Aromático`, `Couriado`, `Gourmand`). Tocar em uma família navega para a aba Explorar com o filtro aplicado.
*   **Trilha "Para o Seu Perfil Olfativo" (RF-20 / RF-21):**
    *   Se o cliente completou o Quiz Olfativo (`has_olfactory_profile === true`), exibe os perfumes com maior compatibilidade e a badge dourada `"✨ 92% Match"`.
    *   Se o cliente ainda não preencheu o perfil, exibe um card convidativo (`"Descubra seu DNA Olfativo em 30s"`) levando para `/account/edit-olfactory-profile`, seguido pelos perfumes mais vendidos.
*   **Trilha "Descubra em Decants (≤ 15ml)":** Perfumes com ofertas ativas de `5ml`, `10ml` ou `15ml` e tag `"Decant a partir de R$ X"`.
*   **Lojas em Destaque:** Lista horizontal de lojas reais (`GET /api/v1/showcase/home/`) com selo oficial, nota média e navegação ao toque para `/store/[id]`.

## 2. Tab: Busca e Descoberta (Explorar) — RF-22
*   **Barra de Pesquisa Unificada (Lupa Global):** Busca em tempo real (debounce `350ms`) por nome do perfume, nome da marca, família olfativa, notas da pirâmide (`top_notes`, `heart_notes`, `base_notes`) e nome de lojas.
*   **Explorador por Notas Olfativas (Diferencial NŌTA):**
    *   Seletor de notas reais extraídas do catálogo (`GET /api/v1/catalog/notes/`), permitindo combinar até 5 notas simultaneamente (`?notes=Sândalo,Bergamota`).
    *   Botão de atalho **"✨ Usar minhas notas favoritas"**, que aplica automaticamente as `preferred_notes` do perfil olfativo do cliente logado.
*   **Filtros Rápidos de Formato e Família:**
    *   Pílulas de formato: `[ Todos ]`, `[ 🧪 Só Decants (≤ 15ml) ]`, `[ 🍾 Frascos (> 15ml) ]`.
    *   Chips das 7 Famílias Olfativas e ordenação por Relevância/Match, Mais Vendidos, Menor Preço ou Maior Preço.
*   **Resultados da Busca Unificada:** Exibe seção horizontal de Lojas encontradas e grid de Perfumes reais do banco de dados com menor preço ativo, badge `"🧪 Decant disponível"` e `% Match`.

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
*   **Dados do Usuário (RF-24):** Nome, e-mail, telefone e botão **"Editar"** que abre o Modal de Edição de Dados Pessoais (`PATCH /api/v1/auth/me/`).
*   **Meu Perfil Olfativo (RF-05 / RF-20):** Exibe as famílias e notas favoritas do cliente e botão **"Refazer / Editar"** que leva à tela `/account/edit-olfactory-profile` abastecida dinamicamente pelas notas reais do catálogo (`GET /api/v1/catalog/notes/`).
*   **Meus Pedidos:** Acesso rápido ao histórico de compras.
    *   **Tela de Detalhe do Pedido:** Exibe os itens, valor pago, endereço de entrega, transportadora + código de rastreio (copiar / "Rastrear no site da transportadora") e a linha do tempo do status (Pendente, Pago, Em Separação, Enviado, Entregue, além de Cancelamento/Contestação/Devolução quando houver).
    *   **Ações por status (RF-15):** Cancelar / Solicitar cancelamento · Alterar endereço (mesma cidade) · Recebi meu pedido · Não recebi (contestar) · Solicitar devolução (seleção de itens + motivo + até 3 fotos via câmera/galeria) · Avaliar.
*   **Lojas que Sigo (RF-19):** Lista das lojas favoritadas/seguidas pelo cliente com atalho direto para suas vitrines e cupons.
*   **Endereços Salvos:** Gestão de endereços de entrega.
*   **Meios de Pagamento:** Cartões salvos.
*   **Dúvidas e Suporte e Sair da Conta** *(Nota: o item estático "Configurações" sem ação foi removido na RF-24).*

## Telas em Stack (Fora da Tab Bar)

### Tela de Produto ([id].tsx) — RF-20
*   Header limpo com botão Voltar e botão de Acesso Rápido à Sacola *(o botão de coração estático sem persistência foi removido na RF-20)*.
*   Imagens em carrossel.
*   Nome, Marca e Preço (com seletor de ofertas/volumetrias de cada loja, diferenciando Decants ≤ 15ml e Frascos).
*   **Card de Compatibilidade Olfativa (RF-20):** Exibe `"✨ X% compatível com seu Perfil Olfativo"` e explica a afinidade da família e notas.
*   **Visualização da Pirâmide Olfativa com Destaque de Notas (RF-20):** Representação gráfica das notas de saída (`top_notes`), corpo (`heart_notes`) e fundo (`base_notes`), destacando em dourado (`#B8965A`) com ícone `✨` as notas que coincidem com as `preferred_notes` do cliente (`matched_notes`).
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
