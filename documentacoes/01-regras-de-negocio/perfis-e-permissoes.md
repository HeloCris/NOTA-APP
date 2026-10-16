# Perfis e Permissões (Tags de Usuário)

O projeto NŌTA possui **quatro** perfis de usuários bem delimitados para garantir o correto isolamento multi-tenant e a experiência do marketplace:

| Tag / Perfil de Usuário | Enum Técnico (`role`) | Descrição Principal e Acesso |
| :--- | :---: | :--- |
| **Cliente** | `CUSTOMER` | Usuário comprador que se cadastra e utiliza o **App Mobile** |
| **Loja Não Oficial** | `SELLER` | Lojista independente, revendedor multimarca ou loja de decants no **Painel Web** |
| **Loja Oficial** | `BRAND_OWNER` | Fabricante / Marca oficial com registro INPI e vendas diretas (**Brand Hub / D2C**) |
| **Administrador** | `ADMIN` | Gestão global do catálogo, moderação e financeiro via **Painel Admin** |

---

## 1. Administrador (`ADMIN`)
Este é o superusuário do sistema, responsável pela gestão global do marketplace.

*   **Permissões de Acesso:** Acesso irrestrito a todas as áreas do sistema via painel administrativo (Django Admin ou painel customizado).
*   **Gestão de Lojas:** Aprovação de novas lojas e marcas, bloqueio/desbloqueio, análise documental.
*   **Gestão do Catálogo Global:** Criação, edição e exclusão de marcas (`Brand`) e produtos no catálogo global (`Product`), incluindo pirâmides olfativas.
*   **Gestão Financeira:** Visualização de todas as transações, comissionamento e repasses.
*   **Isolamento:** Não se aplica (visão global de todos os tenants).

## 2. Loja Oficial (`BRAND_OWNER`)
Representante oficial de uma marca de perfumes (fabricante, distribuidora exclusiva ou importador autorizado com registro INPI).

*   **Permissões de Acesso:** Acesso ao **Brand Hub** — painel web exclusivo de gestão de portfólio oficial.
*   **Gestão da Marca:** Submissão de nova marca para aprovação (CNPJ + registro INPI obrigatórios).
*   **Gestão do Portfólio (Catálogo Global):** Permissão para adicionar novos perfumes ao catálogo global com `ean` (GTIN/EAN-13), `anvisa_code` e a pirâmide olfativa completa.
*   **Modelo D2C (Loja Oficial com Selo):** O `BRAND_OWNER` pode ativar as vendas diretas ao consumidor, gerando automaticamente uma `Store` com o selo verificado **"Loja Oficial ✓"**.
*   **Isolamento:** Acesso restrito aos produtos da sua própria marca e à sua Loja Oficial.

## 3. Loja Não Oficial / Multimarcas (`SELLER`)
Usuário representante de uma loja multimarcas, perfumaria independente ou fracionador de decants.

*   **Permissões de Acesso:** Acesso restrito ao Painel Web do Lojista (`/seller`).
*   **Cadastro:** Registrado com a role `SELLER` já na criação da conta ou ao concluir a configuração da loja.
*   **Gestão da Loja:** Edição de dados da loja (nome, logo, capa, bio olfativa, endereço).
*   **Gestão de Estoque e Preços:** Vínculo de produtos do catálogo global ao seu estoque próprio (`StoreProduct`), definindo preços, decants e quantidades.
*   **Gestão de Pedidos:** Visualização e despacho apenas dos pedidos direcionados à sua loja (Pendente -> Em Separação -> Enviado -> Entregue).
*   **Isolamento Multi-tenant:** **Regra Crítica:** Um lojista **jamais** pode ver pedidos, clientes ou estoque de outros lojistas.

## 4. Cliente (`CUSTOMER`)
Usuário final (comprador B2C) que utiliza o App Mobile para buscar e comprar perfumes.

*   **Permissões de Acesso:** Acesso exclusivo ao **App Mobile** via autenticação (e-mail/senha ou social login).
*   **Perfil Padrão:** Todo cadastro realizado pelo App Mobile recebe automaticamente a role `CUSTOMER`.
*   **Navegação e Busca:** Acesso livre a toda a vitrine, podendo buscar produtos por nome, marca, pirâmide olfativa e explorar tanto **Lojas Oficiais** quanto **Lojas Não Oficiais**.
*   **Carrinho e Checkout:** Capacidade de adicionar produtos de **múltiplas lojas** no mesmo carrinho (carrinho multi-loja com split por loja na RF-10).
*   **Meus Pedidos:** Visualização do histórico de pedidos próprios e acompanhamento do rastreamento.
*   **Isolamento:** Acesso restrito apenas aos seus próprios dados (endereços, cartões, histórico de pedidos).
