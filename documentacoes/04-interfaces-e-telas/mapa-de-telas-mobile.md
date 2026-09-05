# Mapa de Telas - App Mobile (Cliente)

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
*   **Lista de Itens:** Produtos adicionados, agrupados visualmente por **Loja**.
*   **Controles:** Alterar quantidade, remover item.
*   **Resumo de Valores:** Subtotal dos produtos e estimativa de frete (calculado por loja).
*   **Aviso de Split:** Mensagem clara informando que as entregas ocorrerão de forma separada caso haja múltiplas lojas.
*   **Botão Checkout:** Leva para a tela de finalização de compra (Stack de Checkout: Endereço -> Pagamento -> Sucesso).

## 4. Tab: Minha Conta (Perfil)
*   **Dados do Usuário:** Nome, e-mail.
*   **Meus Pedidos:** Acesso rápido ao histórico de compras.
    *   *Tela de Detalhe do Pedido:* Exibe os itens, valor pago, endereço de entrega e a **linha do tempo do status** (Pendente, Em Separação, Enviado, Entregue).
*   **Endereços Salvos:** Gestão de endereços de entrega.
*   **Meios de Pagamento:** Cartões salvos.
*   **Configurações e Sair.**

## Telas em Stack (Fora da Tab Bar)
*   **Tela de Produto (`[id].tsx`):**
    *   Imagens em carrossel.
    *   Nome, Marca e Preço.
    *   **Visualização da Pirâmide Olfativa:** Representação gráfica elegante das notas de saída, corpo e fundo.
    *   Loja Vendedora (com link para ver mais produtos desta loja).
    *   Botão "Adicionar ao Carrinho".
*   **Fluxo de Autenticação:** Login, Cadastro, Recuperação de Senha.
