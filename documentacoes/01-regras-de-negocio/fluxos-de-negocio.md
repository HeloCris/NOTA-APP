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

### 1.1 Estados da Loja (Visibilidade e Funcionalidade)

Após aprovada, a loja pode transitar pelos seguintes estados, controlados pelo próprio lojista no painel de configurações:
*   **Loja Incompleta (Pendente de Configuração):** Loja recém-criada ou sem endereço de origem completo (`postal_code`, `street`, `number`, `neighborhood`, `city`, `state`) ou sem frete configurado. **Não aparece nas buscas, não vende e não é listada na vitrine pública** até que o lojista salve o endereço de postagem e os valores de frete regional. No painel, o card de frete fica bloqueado até a confirmação do endereço.
*   **Loja Ativa:** Fluxo normal. Com endereço e taxas de frete salvos, a loja ganha status operacional (`is_ready_to_sell = True`), aparece nas buscas, seu catálogo é público e os clientes podem adicionar produtos ao carrinho e cotar frete no checkout.
*   **Modo Férias (`vacation_mode = True`):** A loja continua visível na plataforma e seu catálogo pode ser navegado pelos clientes (mantendo SEO e engajamento), mas o botão de "Comprar" ou adicionar ao carrinho fica desabilitado com um aviso de que o lojista está temporariamente ausente.
*   **Loja Desativada (`is_active = False`):** A loja é totalmente ocultada da plataforma pública. Seus produtos não aparecem nas buscas e sua página fica offline (404). Novos pedidos não podem ser feitos. O lojista não consegue alterar configurações do perfil até que clique expressamente em "Reativar Loja" na zona de perigo. Pedidos em andamento devem ser finalizados normalmente.

## 2. Fluxo do Catálogo

O sistema utiliza um modelo de **Catálogo Global**, onde o produto base é único na plataforma, evitando duplicidade e melhorando a busca olfativa.

1.  **Vínculo com Catálogo Global:**
    *   O lojista busca um perfume no painel (ex: "Acqua di Gio").
    *   O sistema retorna o produto do catálogo global.
    *   O lojista clica em "Adicionar ao meu estoque".
    *   O lojista define seu preço de venda e quantidade em estoque (`StoreProduct`).
2.  **Novo Cadastro (Solicitação do Lojista):**
    *   O lojista não encontra o perfume no catálogo global.
    *   Ele preenche um formulário de solicitação de novo produto, incluindo: Nome, Marca, Foto, Descrição, e a **Pirâmide Olfativa** (Notas de Saída, Notas de Corpo, Notas de Fundo), e Família Olfativa.
    *   O Admin Plataforma revisa a solicitação. Se correta, adiciona ao Catálogo Global (`Product`), tornando-o disponível para o lojista solicitante e para todos os outros no futuro.
3.  **Cadastro Direto pelo BRAND_OWNER:**
    *   O dono de marca (`BRAND_OWNER`) acessa o **Brand Hub** e cadastra novos perfumes diretamente, com validação de `ean`, `anvisa_code`, **concentração** (Parfum, EDP, EDT, EDC, Eau Fraîche), **classificação de gênero** (Feminino, Masculino, Compartilhável), família olfativa e pirâmide olfativa completa (topo, coração e fundo).
    *   O produto é adicionado ao catálogo global com `is_approved=True` automaticamente para marcas com status `APPROVED`.

## 3. Fluxo do Pedido, Carrinho Multi-Loja e Logística de Entrega (Modelo Shopee)

Acompanhamento do ciclo de vida de uma compra no marketplace com múltiplos vendedores:

1.  **Carrinho Unificado com Agrupamento por Loja:**
    *   O cliente pode adicionar perfumes e decants de lojas diferentes na mesma sacola.
    *   No carrinho (`/(shop)/cart`), os itens são **agrupados visualmente pelo nome da loja vendedora**, com destaque para o selo de Loja Oficial (`checkmark-circle`).
    *   **Regra de Ouro do Frete no Carrinho:** O carrinho exibe apenas o **Subtotal dos Produtos**. **Nenhum frete é cotado ou cobrado na tela do carrinho**, pois o frete depende do endereço de entrega e da origem de cada lojista.
    *   O cliente clica em **"Finalizar Compra"** para avançar para a tela de Checkout (RF-10).

2.  **Checkout Multi-Loja (RF-10):**
    *   **Endereço de Entrega Dinâmico (Resolução de Endereço Salvo):**
        *   Ao avançar para a entrega, o sistema busca os endereços cadastrados na conta do cliente ("Meus Endereços").
        *   **Com endereços cadastrados (mesmo na 1ª compra):** O endereço padrão (`is_default = true`) é automaticamente selecionado e exibido no card de entrega. O botão **"Trocar"** abre um modal com a lista de todos os seus endereços salvos (Casa, Trabalho, etc.) e um botão para **"Adicionar outro endereço"**.
        *   **Sem endereço cadastrado:** O formulário de endereço é exibido diretamente para preenchimento (com busca de CEP via ViaCEP).
        *   Ao confirmar um novo endereço na compra, este é automaticamente salvo no perfil do usuário para pedidos futuros.
    *   **Cálculo e Seleção de Frete por Loja:**
        *   Como cada loja despacha de uma cidade/estado diferente, o checkout divide a compra em pacotes por loja.
        *   Para cada loja, o cliente escolhe a opção de envio desejada (**PAC** ou **SEDEX**), visualizando o prazo de despacho + trânsito e o valor cotado daquela loja.
        *   Se a loja oferecer **Frete Grátis** acima de determinado valor (`free_shipping_threshold`) e o subtotal daquela loja atingir a meta, a opção PAC fica zerada com a tag "Grátis".
    *   **Cupons de Desconto (Estilo Shopee):**
        *   **Cupom da Loja (Seller Coupon):** Aplicado especificamente aos itens daquela loja (ex: R$ 20 OFF ou 10% OFF para compras na loja "Decants & Co.").
        *   **Cupom da Plataforma / Frete (Platform Coupon):** Desconto concedido pelo marketplace sobre o valor total ou subsídio de frete.
    *   **Resumo Transparente do Pedido:** Exibe a soma dos subtotais dos produtos + a soma dos fretes escolhidos de cada loja - os cupons aplicados = **Total Geral do Pedido**.

3.  **Pagamento e Split Automático de Pedidos (RF-11 / RF-12):**
    *   O cliente realiza um **único pagamento** via Cartão de Crédito ou Pix.
    *   O backend gera automaticamente um pedido principal (`Order`) e sub-pedidos independentes por loja (`StoreOrder`), com seus respectivos números, fretes, prazos e itens.
    *   Cada lojista recebe apenas a notificação e a etiqueta referente ao seu próprio pacote.

4.  **Em Separação e Embalagem:** Cada lojista prepara a embalagem segura com plástico bolha e caixa rígida (requisito para perfumes de vidro e decants).
5.  **Enviado (Postagem Correios/Transportadora):** Cada lojista despacha seu pacote e insere o seu respectivo **Código de Rastreamento** (`tracking_code`). O cliente acompanha os rastreios de forma separada no App para cada loja.
6.  **Entregue:** A transportadora confirma a entrega no endereço do cliente ou o lojista atualiza o status. Status final: **Entregue**.

## 4. Fluxo de Brand Onboarding e Ativação D2C

Fluxo exclusivo para marcas que desejam ter presença oficial e/ou vendas diretas (D2C) na plataforma.

1.  **Solicitação de Marca:** O representante da marca preenche o formulário de Brand Onboarding informando: Nome da Marca, CNPJ, Número de Registro no INPI e documentos comprobatórios. O status da marca fica `PENDING`.
2.  **Aprovação pelo Admin:** O Admin Plataforma valida os documentos.
    *   **Aprovado:** Status muda para `APPROVED`, `is_official=True`. O usuário recebe role `BRAND_OWNER` e acesso ao **Brand Hub**.
    *   **Rejeitado:** Notificação com motivo, possibilidade de reenvio.
3.  **Gestão do Portfólio:** O `BRAND_OWNER` acessa o Brand Hub e cadastra perfumes com `ean`, `anvisa_code`, concentração, gênero e pirâmide olfativa completa. Produtos são auto-aprovados no catálogo global.
4.  **Ativação do Modelo D2C (Loja Oficial):** O `BRAND_OWNER` pode opcionalmente ativar as vendas diretas via `POST /api/v1/brands/me/activate-d2c/`.
    *   O sistema gera automaticamente uma `Store` vinculada à marca com o campo `is_official=True` e selo **"Loja Oficial"** visível na plataforma.
    *   O usuário passa a ter as permissões combinadas de `BRAND_OWNER` + `SELLER` — o `store_id` da Loja Oficial é injetado no JWT.
    *   A partir deste ponto, o `BRAND_OWNER` acessa a aba **"Estoque & Vendas (D2C)"** no Brand Hub para precificar, gerenciar estoque e disponibilizar múltiplas volumetrias para o mesmo perfume.
5.  **Multi-Volumetrias e Decants (Lojistas Comuns e Lojas Oficiais):**
    *   Tanto lojistas convencionais (`SELLER`) quanto marcas oficiais com D2C ativo (`BRAND_OWNER`) podem cadastrar um mesmo perfume em **múltiplas volumetrias** (`StoreProduct` com chave única `[store, product, volume_ml]`), cada qual com seu preço e estoque individual.
    *   Volumetrias de **5ml, 10ml ou 15ml** são automaticamente categorizadas e rotuladas como **Decants** na vitrine, na listagem de estoque e nos seletores de compra no app mobile e web.
    *   Volumetrias tradicionais (ex.: 30ml, 50ml, 100ml, 200ml) representam os frascos padrão.
    *   Na vitrine do consumidor, as ofertas agrupam as opções de volumetria e exibem o menor preço de entrada com a tag `"A partir de R$ X"`. Ao clicar, o consumidor seleciona o tamanho desejado (seja decant ou frasco completo).
