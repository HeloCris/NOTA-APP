import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  communicationService,
  resolveMediaUrl,
} from "../../services/communicationService";
import type {
  ChatConversation,
  ChatMessage,
} from "../../types/communication";

const POLL_INTERVAL_MS = 5000;

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Aguardando pagamento",
    PAID: "Pago",
    PROCESSING: "Em separação",
    CANCEL_REQUESTED: "Cancelamento solicitado",
    SHIPPED: "Enviado",
    DELIVERY_DISPUTED: "Entrega contestada",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  return labels[status] ?? status;
}

export function StoreMessages() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] =
    useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastMessageIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;

  const loadConversations = useCallback(async () => {
    try {
      const data = await communicationService.listConversations();
      setConversations(data);
      setError(null);
    } catch (loadError) {
      console.error("Erro ao carregar conversas:", loadError);
      setError("Não foi possível carregar as conversas.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConversations();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadConversations();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (conversationId: number, onlyNew = false) => {
      if (!onlyNew) {
        setIsLoadingMessages(true);
      }

      try {
        const data = await communicationService.listMessages(conversationId, {
          since_id: onlyNew ? lastMessageIdRef.current ?? undefined : undefined,
          page_size: 100,
        });

        if (onlyNew) {
          if (data.results.length > 0) {
            setMessages((current) => [...current, ...data.results]);
            lastMessageIdRef.current =
              data.results[data.results.length - 1].id;
          }
        } else {
          setMessages(data.results);
          lastMessageIdRef.current =
            data.results.length > 0
              ? data.results[data.results.length - 1].id
              : null;
        }
      } catch (loadError) {
        console.error("Erro ao carregar mensagens:", loadError);
        setError("Não foi possível carregar as mensagens.");
      } finally {
        if (!onlyNew) {
          setIsLoadingMessages(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastMessageIdRef.current = null;
      setMessages([]);
      setText("");
      setImage(null);

      void loadMessages(activeId);
      void communicationService.markConversationRead(activeId).catch((error) => {
        console.error("Erro ao marcar conversa como lida:", error);
      });
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadMessages(activeId, true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (conversationId: number) => {
    setActiveId(conversationId);
    setError(null);
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeId) {
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText && !image) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await communicationService.sendMessage(activeId, {
        text: trimmedText || undefined,
        image,
      });

      setText("");
      setImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadMessages(activeId);
    } catch (sendError) {
      console.error("Erro ao enviar mensagem:", sendError);
      setError("Não foi possível enviar a mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 min-h-[560px]">
      <section
        aria-label="Lista de conversas"
        className="bg-white border border-[#E6E1D2] rounded-[20px] overflow-hidden flex flex-col"
      >
        <div className="px-4 py-4 border-b border-[#EFEBDD]">
          <h2 className="font-jakarta text-[17px] font-extrabold text-[#263847]">
            Mensagens
          </h2>
          <p className="text-[12px] text-[#93927F] mt-0.5">
            {conversations.length} conversa
            {conversations.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#93927F]">
              Carregando conversas...
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#93927F]">
              Nenhuma conversa iniciada.
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                aria-label={`Conversa com ${conversation.customer_name}`}
                onClick={() => handleSelectConversation(conversation.id)}
                className={`w-full text-left px-4 py-3 border-b border-[#F3F0E8] last:border-b-0 transition-colors cursor-pointer ${
                  conversation.id === activeId
                    ? "bg-[#E9EDF0]"
                    : "hover:bg-[#F8F6F0]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[13.5px] text-[#263847] truncate">
                    {conversation.customer_name}
                  </strong>
                  {conversation.unread_count > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#A85A38] text-white text-[10px] font-extrabold flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                <span className="block text-[11.5px] text-[#93927F] mt-0.5 truncate">
                  {conversation.order
                    ? `Pedido ${conversation.order.number} · ${statusLabel(
                        conversation.order.status,
                      )}`
                    : "Conversa geral"}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section
        aria-label="Conversa ativa"
        className="bg-white border border-[#E6E1D2] rounded-[20px] flex flex-col overflow-hidden"
      >
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
            <div>
              <div className="w-[56px] h-[56px] rounded-2xl bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center mx-auto mb-4">
                <svg className="w-[26px] h-[26px]">
                  <use href="#ic-mail-nav" />
                </svg>
              </div>
              <h3 className="text-[17px] font-extrabold text-[#23282D] mb-1">
                Selecione uma conversa
              </h3>
              <p className="text-[13px] text-[#5A6067]">
                Escolha um cliente na lista ao lado para responder.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-[#EFEBDD]">
              <h2 className="font-jakarta text-[16px] font-extrabold text-[#263847]">
                {activeConversation.customer_name}
              </h2>
              <p className="text-[12px] text-[#93927F]">
                {activeConversation.store_name}
              </p>
            </div>

            {activeConversation.order && (
              <div className="mx-5 mt-4 rounded-xl border border-[#E6E1D2] bg-[#F8F6F0] px-4 py-3">
                <p className="text-[12px] font-bold text-[#263847]">
                  Referente ao Pedido {activeConversation.order.number}
                </p>
                <p className="text-[11.5px] text-[#5A6067] mt-0.5">
                  Status: {statusLabel(activeConversation.order.status)}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {isLoadingMessages ? (
                <p className="text-center text-[13px] text-[#93927F]">
                  Carregando mensagens...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-[13px] text-[#93927F]">
                  Nenhuma mensagem ainda. Envie a primeira.
                </p>
              ) : (
                messages.map((message) => {
                  const isStoreMessage =
                    message.sender_id !== activeConversation.customer;
                  const imageUrl = resolveMediaUrl(message.attachment_image);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isStoreMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isStoreMessage
                            ? "bg-[#354B5E] text-white"
                            : "bg-[#F1EEE6] text-[#263847]"
                        }`}
                      >
                        <p className="text-[11px] font-bold opacity-80 mb-0.5">
                          {message.sender_name}
                        </p>
                        {message.text && (
                          <p className="text-[13px] whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        )}
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(imageUrl)}
                            className="block mt-2 cursor-zoom-in"
                            aria-label="Visualizar imagem anexada"
                          >
                            <img
                              src={imageUrl}
                              alt="Imagem anexada"
                              className="max-h-[180px] rounded-lg object-cover"
                            />
                          </button>
                        )}
                        <span className="block text-[10px] opacity-70 mt-1">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <p className="px-5 pb-2 text-[12px] text-[#A24726]">{error}</p>
            )}

            <form
              onSubmit={(event) => void handleSend(event)}
              className="border-t border-[#EFEBDD] px-4 py-3 flex items-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Selecionar foto"
                onChange={(event) =>
                  setImage(event.target.files?.[0] ?? null)
                }
              />
              <button
                type="button"
                aria-label="Anexar foto"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full border border-[#E6E1D2] text-[#354B5E] flex items-center justify-center hover:bg-[#F8F6F0] cursor-pointer"
              >
                <svg className="w-5 h-5">
                  <use href="#ic-image" />
                </svg>
              </button>

              <input
                type="text"
                aria-label="Escreva uma mensagem"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  image ? `Foto selecionada: ${image.name}` : "Escreva uma mensagem..."
                }
                maxLength={1500}
                className="flex-1 border border-[#E6E1D2] rounded-full px-4 py-2.5 text-[13px] outline-none focus:border-[#354B5E]"
              />

              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={isSending || (!text.trim() && !image)}
                className="h-10 px-5 rounded-full bg-[#354B5E] text-white text-[13px] font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSending ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </>
        )}
      </section>

      {previewImage && (
        <div
          role="dialog"
          aria-label="Visualizador de imagem"
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-6"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Imagem anexada ampliada"
            className="max-h-[85vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
