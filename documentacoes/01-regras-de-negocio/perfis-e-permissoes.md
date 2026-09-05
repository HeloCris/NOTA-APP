# Perfis e Permissões

O projeto NŌTA possui **quatro** perfis de usuários, cada um com diferentes níveis de acesso e permissões.

## 1. Admin Plataforma
Este é o superusuário do sistema, responsável pela gestão global do marketplace.

*   **Permissões de Acesso:** Acesso irrestrito a todas as áreas do sistema via painel administrativo (Django Admin ou painel customizado).
*   **Gestão de Lojistas:** Aprovação de novos lojistas, bloqueio/desbloqueio de lojas, análise de documentos.
*   **Gestão do Catálogo Global:** Criação, edição e exclusão de marcas (`Brand`) e produtos no catálogo global (`Product`), incluindo pirâmides olfativas (notas de saída, corpo e fundo).
*   **Gestão Financeira:** Visualização de todas as transações, comissionamento e repasses.
*   **Isolamento:** Não se aplica, pois o Admin tem visão global de todos os tenants.

## 2. Dono de Marca (Brand Owner)
Representante oficial de uma marca de perfumes (fabricante, distribuidora exclusiva ou importador autorizado).

*   **Permissões de Acesso:** Acesso ao **Brand Hub** — painel web exclusivo de gestão de portfólio.
*   **Gestão da Marca:** Submissão de nova marca para aprovação (CNPJ + registro INPI obrigatórios). Edição de dados da marca após aprovação pelo Admin.
*   **Gestão do Portfólio (Catálogo Global):** Único perfil (além do Admin) com permissão para adicionar novos perfumes ao catálogo global. O cadastro exige `ean` (GTIN/EAN-13), `anvisa_code` e a pirâmide olfativa completa (`top_notes`, `heart_notes`, `base_notes`).
*   **Modelo D2C (Loja Oficial):** O `BRAND_OWNER` pode ativar as vendas diretas ao consumidor, gerando automaticamente uma `Store` para o tenant com o selo **"Loja Oficial"**. Ao ativar o D2C, o usuário recebe também as permissões de `SELLER`, podendo gerenciar estoque, preços e pedidos da sua loja oficial.
*   **Isolamento:** Acesso restrito aos produtos da sua própria marca e à sua Loja Oficial. Não visualiza dados de outros lojistas ou marcas.

## 3. Lojista (Empresa/Seller)
Usuário representante de uma loja ou distribuidora de perfumes.

*   **Permissões de Acesso:** Acesso restrito ao Painel Web do Lojista.
*   **Gestão da Loja:** Edição de dados da loja (nome, logo, descrição, endereço).
*   **Gestão de Estoque e Preços:** Vínculo de produtos do catálogo global ao seu estoque (`StoreProduct`), definindo preço próprio, quantidade e status (ativo/inativo). Caso o produto não exista no catálogo global, pode solicitar o cadastro ao Admin.
*   **Gestão de Pedidos:** Visualização apenas dos pedidos direcionados à sua loja. Alteração do status do pedido (Pendente -> Em Separação -> Enviado -> Entregue).
*   **Isolamento Multi-tenant:** **Regra Crítica:** Um lojista **jamais** pode ver pedidos, clientes, produtos em estoque ou dados financeiros de outros lojistas. As consultas no banco de dados devem sempre filtrar pelo ID da loja (Tenant ID).

## 4. Cliente (Comprador B2C)
Usuário final que utiliza o App Mobile para buscar e comprar perfumes.

*   **Permissões de Acesso:** Acesso ao App Mobile via autenticação (e-mail/senha ou social login).
*   **Navegação e Busca:** Acesso livre a toda a vitrine, podendo buscar produtos por nome, marca, loja, e, principalmente, através da busca olfativa (notas/famílias).
*   **Carrinho e Checkout:** Capacidade de adicionar produtos de **múltiplas lojas** no mesmo carrinho (carrinho multi-loja). No checkout, o sistema deve dividir a transação ou os pedidos de acordo com as lojas (split de carrinho).
*   **Meus Pedidos:** Visualização do histórico de pedidos próprios e acompanhamento de status.
*   **Isolamento:** O cliente tem acesso apenas aos seus próprios dados (endereços, cartões, histórico de pedidos).
