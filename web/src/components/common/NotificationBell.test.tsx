import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { communicationService } from "../../services/communicationService";
import { NotificationBell, resolveNotificationUrl } from "./NotificationBell";

vi.mock("../../services/communicationService", () => ({
  communicationService: {
    listNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

const listNotifications = vi.mocked(
  communicationService.listNotifications,
);
const markNotificationRead = vi.mocked(
  communicationService.markNotificationRead,
);
const markAllNotificationsRead = vi.mocked(
  communicationService.markAllNotificationsRead,
);

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listNotifications.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      unread_count: 2,
      results: [
        {
          id: 1,
          user: null,
          store: 7,
          title: "Novo Pedido",
          message: "Pedido #105 recebido.",
          type: "NEW_ORDER",
          target_url: "/store/orders/105",
          is_read: false,
          created_at: "2026-11-02T10:00:00Z",
        },
        {
          id: 2,
          user: null,
          store: 7,
          title: "Nova Mensagem",
          message: "Maria: Olá!",
          type: "NEW_MESSAGE",
          target_url: "/store/messages?chat=1",
          is_read: false,
          created_at: "2026-11-02T10:05:00Z",
        },
      ],
    });
    markNotificationRead.mockResolvedValue({
      id: 1,
      user: null,
      store: 7,
      title: "Novo Pedido",
      message: "Pedido #105 recebido.",
      type: "NEW_ORDER",
      target_url: "/store/orders/105",
      is_read: true,
      created_at: "2026-11-02T10:00:00Z",
    });
    markAllNotificationsRead.mockResolvedValue();
  });

  it("renderiza o badge e o dropdown com as últimas notificações", async () => {
    renderBell();

    await waitFor(() => {
      expect(screen.getByTestId("notification-badge")).toHaveTextContent("2");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Notificações" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Central de notificações" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Novo Pedido")).toBeInTheDocument();
    expect(screen.getByText("Nova Mensagem")).toBeInTheDocument();
  });

  it("marca todas as notificações como lidas", async () => {
    renderBell();

    await waitFor(() => {
      expect(screen.getByTestId("notification-badge")).toHaveTextContent("2");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Notificações" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar lidas" }),
    );

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByTestId("notification-badge"),
      ).not.toBeInTheDocument();
    });
  });

  it("resolveNotificationUrl mapeia rotas do backend para as abas do painel", () => {
    expect(
      resolveNotificationUrl("/store/messages?chat=1", "/brand", "BRAND_OWNER"),
    ).toBe("/brand?chat=1&tab=messages");
    expect(
      resolveNotificationUrl("/store/orders/105", "/seller", "SELLER"),
    ).toBe("/seller?tab=orders");
    expect(
      resolveNotificationUrl("/store/inventory", "/brand", "BRAND_OWNER"),
    ).toBe("/brand?tab=catalog");
    expect(
      resolveNotificationUrl(
        "/store/reviews?review_id=5&highlight=true",
        "/seller",
        "SELLER",
      ),
    ).toBe("/seller?review_id=5&highlight=true&tab=reviews");
    expect(
      resolveNotificationUrl(
        "/store/reviews?review_id=5&highlight=true",
        "/brand",
        "BRAND_OWNER",
      ),
    ).toBe("/brand?review_id=5&highlight=true&tab=reviews");
  });
});
