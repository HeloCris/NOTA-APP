import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { communicationService } from "../../services/communicationService";
import { StoreMessages } from "./StoreMessages";

vi.mock("../../services/communicationService", () => ({
  communicationService: {
    listConversations: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    markConversationRead: vi.fn(),
  },
  resolveMediaUrl: (url: string | null) => url,
}));

const listConversations = vi.mocked(communicationService.listConversations);
const listMessages = vi.mocked(communicationService.listMessages);
const sendMessage = vi.mocked(communicationService.sendMessage);
const markConversationRead = vi.mocked(
  communicationService.markConversationRead,
);

const conversation = {
  id: 1,
  customer: 10,
  store: 7,
  customer_name: "Maria Silva",
  store_name: "Essência & Arte",
  order: {
    id: 105,
    number: "#105",
    status: "PROCESSING",
    total_amount: "199.90",
  },
  updated_at: "2026-11-02T10:00:00Z",
  created_at: "2026-11-02T09:00:00Z",
  unread_count: 1,
};

const messages = [
  {
    id: 1,
    conversation: 1,
    sender_id: 10,
    sender_name: "Maria Silva",
    text: "Olá, vocês têm previsão de despacho?",
    attachment_image: null,
    is_read: false,
    created_at: "2026-11-02T09:10:00Z",
  },
];

describe("StoreMessages", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    listConversations.mockResolvedValue([conversation]);
    listMessages.mockResolvedValue({
      count: messages.length,
      next: null,
      previous: null,
      results: messages,
    });
    sendMessage.mockResolvedValue({
      id: 2,
      conversation: 1,
      sender_id: 7,
      sender_name: "Loja",
      text: "Postamos amanhã!",
      attachment_image: null,
      is_read: false,
      created_at: "2026-11-02T10:00:00Z",
    });
    markConversationRead.mockResolvedValue();
  });

  it("renderiza a lista de conversas e o card do pedido vinculado", async () => {
    render(<StoreMessages />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Conversa com Maria Silva" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Conversa com Maria Silva" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Referente ao Pedido #105"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Olá, vocês têm previsão de despacho?"),
      ).toBeInTheDocument();
      expect(markConversationRead).toHaveBeenCalledWith(1);
    });
  });

  it("envia uma nova mensagem", async () => {
    render(<StoreMessages />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Conversa com Maria Silva" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Conversa com Maria Silva" }),
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText("Escreva uma mensagem"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Escreva uma mensagem"), {
      target: { value: "Postamos amanhã!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar mensagem" }),
    );

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(1, {
        text: "Postamos amanhã!",
        image: null,
      });
    });
  });
});
