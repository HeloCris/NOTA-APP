# RF-18 — Mensageria (Chat Loja/Cliente) e Central de Notificações

> **Sprint:** 4  
> **Prioridade:** 🔴 Alta  
> **Estimativa:** 8 SP  
> **Depende de:** RF-15 (Pós-Compra), RF-16 (Avaliações), RF-17 (Dashboard/Estoque)

---

## Descrição

Implementa o canal de comunicação direto (chat) entre o cliente (`CUSTOMER`) e o lojista (`SELLER` ou `BRAND_OWNER` com D2C ativo), permitindo tirar dúvidas pré-compra diretamente da vitrine da loja ou tratar questões operacionais de pós-compra citando um pedido específico. Inclui o botão de notificações (ícone de sino com contador badge e menu dropdown) no cabeçalho do painel web da loja e no app mobile do cliente, centralizando avisos de novos pedidos, mensagens, solicitações de pós-compra, avaliações e alertas de reposição.

> [!NOTE]
> **Estratégia Técnica:** A sincronização de novas mensagens e notificações adota **Polling inteligente** (intervalo de 5 segundos quando o chat estiver ativo e revalidação ao focar na janela/aba), evitando custos e complexidade operacional com servidores ASGI/Redis neste ciclo.

---

## Regras de Negócio

### 1. Mensageria (Chat)

| ID | Regra |
|---|---|
| **RN-01** | **Canais de Abertura:** O cliente pode iniciar conversa via botão **"Falar com a loja"** na página pública da loja (chat geral), ou a partir do botão **"Ajuda com o pedido"** no detalhe do pedido (chat vinculado ao `Order.id`). |
| **RN-02** | **Isolamento de Conversas:** Uma conversa (`ChatConversation`) vincula exclusivamente 1 Cliente (`User`) e 1 Loja (`Store`), garantindo isolamento estrito multi-tenant. |
| **RN-03** | **Mensagens e Anexos:** Cada mensagem aceita texto (obrigatório se sem foto, até 1500 caracteres) e **1 foto opcional** (envio via câmera ou galeria). |
| **RN-04** | **Leitura e Status:** Mensagens possuem status de leitura (`is_read = True`). Ao abrir a conversa, todas as mensagens não lidas enviadas pela outra parte são marcadas como lidas automaticamente. |
| **RN-05** | **Bloqueio de Spams e Moderação:** O envio consecutivo sem resposta é limitado a 10 mensagens por cliente para prevenir abusos. |

### 2. Central e Botão de Notificações (Sino)

| ID | Regra |
|---|---|
| **RN-06** | **Botão de Notificação no Header Web (Lojista/Marca):** Ícone de sino com badge indicando o total de notificações não lidas (`unread_count`). Ao clicar, abre popover/dropdown com as últimas notificações, botão "Marcar todas como lidas" e redirecionamento rápido ao clicar em um item. |
| **RN-07** | **Eventos Notificados para o Lojista:**<br>- **Novo Pedido:** quando um pedido é criado com sucesso.<br>- **Nova Mensagem:** quando o cliente envia mensagem no chat da loja.<br>- **Solicitação de Cancelamento:** cliente solicitou cancelamento em separação (RF-15).<br>- **Solicitação ou Contestação de Entrega:** cliente contestou entrega ou pediu devolução (RF-15).<br>- **Nova Avaliação:** cliente postou avaliação para item da loja (RF-16).<br>- **Estoque Baixo:** perfume atingiu menos de 3 unidades (RF-17). |
| **RN-08** | **Central de Notificações no Mobile (Cliente):** Ícone no topo com contador de não lidas avisando quando:<br>- A loja responder no chat.<br>- O pedido for despachado (com código de rastreio).<br>- O pedido for entregue ou cancelamento/devolução for aprovado/recusado.<br>- A loja responder à sua avaliação pública. |
| **RN-09** | **Limpeza e Histórico:** Notificações não lidas são destacadas com cor suave. Ao clicar em uma notificação, o sistema a marca como lida e redireciona para a tela correspondente (ex.: Pedido, Chat ou Avaliações). |

---

## Requisitos Funcionais

| ID | Descrição |
|---|---|
| **RF-18.1** | **[Backend — Model]** Criar app `communication`: `ChatConversation` (`customer`, `store`, `order`, `updated_at`), `ChatMessage` (`conversation`, `sender`, `text`, `attachment_image`, `is_read`, `created_at`) e `Notification` (`user`, `store`, `title`, `message`, `type`, `target_url`, `is_read`, `created_at`). |
| **RF-18.2** | **[Backend — Chat Endpoints]**<br>- `GET /api/v1/chats/` — lista conversas ativas do usuário/loja.<br>- `POST /api/v1/chats/` — cria/recupera conversa com a loja (com ou sem `order_id`).<br>- `GET /api/v1/chats/{id}/messages/` — histórico paginado com polling.<br>- `POST /api/v1/chats/{id}/messages/` — envio de mensagem (multipart com texto e imagem opcional).<br>- `POST /api/v1/chats/{id}/read/` — marca mensagens como lidas. |
| **RF-18.3** | **[Backend — Notificações Endpoints]**<br>- `GET /api/v1/notifications/` — lista notificações (`is_read`, paginação).<br>- `PATCH /api/v1/notifications/{id}/read/` — marca notificação individual como lida.<br>- `POST /api/v1/notifications/read-all/` — marca todas como lidas. |
| **RF-18.4** | **[Backend — Disparadores de Eventos]** Helpers/Signals para disparar `Notification.objects.create(...)` nos fluxos de pedido, chat, avaliação e estoque baixo. |
| **RF-18.5** | **[Web — Header do Lojista]** Componente `NotificationBell.tsx` no Header do painel da loja com badge vermelho, dropdown de notificações com atalhos e ação "Marcar lidas". |
| **RF-18.6** | **[Web — Tela de Mensagens]** Interface `/store/messages` com lista de conversas à esquerda, chat ativo ao centro, balões com data/hora, visualizador de imagem anexada e card de contexto do pedido fixado no topo quando houver `order_id`. |
| **RF-18.7** | **[Mobile — Chat]** Tela de conversa `/chat/[id]` com lista de balões, campo de texto, botão de anexo de foto (`expo-image-picker`) e polling suave. |
| **RF-18.8** | **[Mobile — Central de Notificações]** Sino no header da Home e da Minha Conta com modal/tela de listagem e navegação contextual. |

---

## Fluxo de Interface

### Web — Botão de Notificação (Header)
```text
┌────────────────────────────────────────────────────────────┐
│ NŌTA Loja       [Pesquisar...]          (🔔 3) [ Perfil ▼] │
├─────────────────────────────────────────┌──────────────────┤
│                                         │ Notificações (3) │
│                                         ├──────────────────┤
│                                         │ 📦 Novo Pedido   │
│                                         │ #105 pago agora  │
│                                         ├──────────────────┤
│                                         │ 💬 Nova Mensagem │
│                                         │ Maria: "Olá..."  │
│                                         ├──────────────────┤
│                                         │ [Marcar lidas]   │
└─────────────────────────────────────────┴──────────────────┘
```

### Mobile e Web — Chat com Pedido Vinculado
```text
┌─────────────────────────────────────────┐
│ <  Chat · Essência & Arte               │
├─────────────────────────────────────────┤
│ 🏷️ Referente ao Pedido #105 (Em Separação)│
├─────────────────────────────────────────┤
│ [14:20] Cliente: Olá, vocês têm previsão│
│ de despacho?                            │
│                                         │
│ [14:22] Loja: Olá! Postamos amanhã cedo │
│ pelos Correios Sedex!                   │
│                                         │
│ [14:23] Cliente: [📷 foto comprovante] │
├─────────────────────────────────────────┤
│ [ 📎 ] Escreva uma mensagem...    [ ➤ ] │
└─────────────────────────────────────────┘
```

---

## Critérios de Aceitação

| ID | Critério |
|---|---|
| **CA-01** | Lojista não acessa mensagens ou conversas de outras lojas (`404` / `403`). |
| **CA-02** | Envio de mensagem com texto vazio e sem imagem é rejeitado com `400`. |
| **CA-03** | Abrir a conversa marca as mensagens pendentes como lidas e zera o contador de não lidas. |
| **CA-04** | Criação de novo pedido, recebimento de mensagem ou nova avaliação gera notificação instantânea para a loja. |
| **CA-05** | O sino no header da web exibe a contagem precisa de notificações não lidas e atualiza via polling. |
| **CA-06** | "Marcar todas como lidas" atualiza o estado de todas as notificações do usuário no banco. |
| **CA-07** | O chat com pedido vinculado exibe cabeçalho contextual com número e status do pedido em ambas as plataformas. |

---

## Testes (TDD)

### Backend
- `apps/communication/tests/test_chat.py` — criação de conversa, envio de mensagens, anexos e isolamento de tenants.
- `apps/communication/tests/test_notifications.py` — disparos automáticos de notificações e endpoints de leitura.

### Frontend Web
- `NotificationBell.test.tsx` — renderização do sino, dropdown e ação de marcar todas lidas.
- `StoreChat.test.tsx` — renderização da lista de mensagens e envio de nova mensagem.

### Mobile
- `__tests__/ChatScreen.test.tsx` — envio de mensagem e exibição do card de pedido vinculado.

---

## Arquivos

**Backend:**
- `apps/communication/` (**[NOVO APP]** `models.py`, `serializers.py`, `views.py`, `urls.py`, `services.py`).
- `apps/orders/services.py`, `apps/reviews/views.py` — **[MODIFY]** disparo de notificações nos eventos chave.

**Web:**
- `src/components/layout/Header.tsx` — **[MODIFY]** inclusão do `NotificationBell`.
- `src/components/common/NotificationBell.tsx` — **[NOVO]** componente dropdown.
- `src/features/store/StoreMessages.tsx` — **[NOVO]** tela completa de mensageria da loja.

**Mobile:**
- `src/app/(shop)/chat/[id].tsx` — **[NOVO]** tela de chat.
- `src/app/(shop)/notifications/index.tsx` — **[NOVO]** tela de notificações do cliente.

---

## Referências

- [RF-15](./RF-15_Gestao_Pos_Compra.md) — Notificações de pedidos, cancelamentos e devoluções
- [RF-16](./RF-16_Avaliacoes.md) — Notificações de novas avaliações
- [RF-17](./RF-17_Dashboard_Sincronizacao_Estoque.md) — Notificações de estoque crítico
