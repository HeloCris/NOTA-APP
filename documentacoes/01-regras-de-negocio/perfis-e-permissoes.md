# Perfis e Permissões

O projeto NŌTA possui três perfis principais de usuários, cada um com diferentes níveis de acesso e permissões.

## 1. Admin Plataforma
Este é o superusuário do sistema, responsável pela gestão global do marketplace.

*   **Permissões de Acesso:** Acesso irrestrito a todas as áreas do sistema via painel administrativo (Django Admin ou painel customizado).
*   **Gestão de Lojistas:** Aprovação de novos lojistas, bloqueio/desbloqueio de lojas, análise de documentos.
*   **Gestão do Catálogo Global:** Criação, edição e exclusão de marcas (`Brand`) e produtos no catálogo global (`Product`), incluindo pirâmides olfativas (notas de saída, corpo e fundo).
*   **Gestão Financeira:** Visualização de todas as transações, comissionamento e repasses.
*   **Isolamento:** Não se aplica, pois o Admin tem visão global de todos os tenants.

## 2. Lojista (Empresa/Seller)
Usuário representante de uma loja ou distribuidora de perfumes.

*   **Permissões de Acesso:** Acesso restrito ao Painel Web do Lojista.
*   **Gestão da Loja:** Edição de dados da loja (nome, logo, descrição, endereço).
*   **Gestão de Estoque e Preços:** Vínculo de produtos do catálogo global ao seu estoque (`StoreProduct`), definindo preço próprio, quantidade e status (ativo/inativo). Caso o produto não exista no catálogo global, pode solicitar o cadastro.
*   **Gestão de Pedidos:** Visualização apenas dos pedidos direcionados à sua loja. Alteração do status do pedido (Pendente -> Em Separação -> Enviado -> Entregue).
*   **Isolamento Multi-tenant:** **Regra Crítica:** Um lojista **jamais** pode ver pedidos, clientes, produtos em estoque ou dados financeiros de outros lojistas. As consultas no banco de dados devem sempre filtrar pelo ID da loja (Tenant ID).

## 3. Cliente (Comprador B2C)
Usuário final que utiliza o App Mobile para buscar e comprar perfumes.

*   **Permissões de Acesso:** Acesso ao App Mobile via autenticação (e-mail/senha ou social login).
*   **Navegação e Busca:** Acesso livre a toda a vitrine, podendo buscar produtos por nome, marca, loja, e, principalmente, através da busca olfativa (notas/famílias).
*   **Carrinho e Checkout:** Capacidade de adicionar produtos de **múltiplas lojas** no mesmo carrinho (carrinho multi-loja). No checkout, o sistema deve dividir a transação ou os pedidos de acordo com as lojas (split de carrinho).
*   **Meus Pedidos:** Visualização do histórico de pedidos próprios e acompanhamento de status.
*   **Isolamento:** O cliente tem acesso apenas aos seus próprios dados (endereços, cartões, histórico de pedidos).
