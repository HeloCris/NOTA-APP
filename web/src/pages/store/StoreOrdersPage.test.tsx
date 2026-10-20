import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StoreOrder } from "../../services/storeOrderService";
import { storeOrderService } from "../../services/storeOrderService";
import { StoreOrdersPage } from "./orders";

vi.mock("../../services/storeOrderService", () => ({
  storeOrderService: {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
}));

function makeOrder(
  overrides: Partial<StoreOrder> = {},
): StoreOrder {
  return {
    id: 105,
    status: "PAID",
    total_amount: "374.90",
    shipping_cost: "15.00",
    shipping_service: "PAC",
    shipping_address: {
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    tracking_code: null,
    carrier: null,
    created_at: "2026-10-20T12:00:00Z",
    customer_name: "João da Silva",
    items: [
      {
        id: 1,
        product_name: "Sauvage EDP",
        quantity: 1,
        unit_price: "374.90",
      },
    ],
    dispatch_deadline: "2026-10-22",
    urgency_status: "ON_TIME",
    is_delayed: false,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StoreOrdersPage />
    </MemoryRouter>,
  );
}

describe("StoreOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os cards de pedidos da loja", async () => {
    vi.mocked(storeOrderService.getOrders).mockResolvedValue([
      makeOrder(),
      makeOrder({
        id: 106,
        status: "PROCESSING",
        customer_name: "Maria Souza",
        items: [
          {
            id: 2,
            product_name: "Baccarat Rouge",
            quantity: 2,
            unit_price: "150.00",
          },
        ],
      }),
    ]);

    renderPage();

    expect(
      await screen.findByText(/Pedido #105 — João da Silva/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pedido #106 — Maria Souza/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1x Sauvage EDP/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/R\$ 374,90/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Av\. Paulista, 1000/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/PAC/).length).toBeGreaterThan(0);

    expect(
      screen.getAllByRole("button", {
        name: /iniciar separação/i,
      }),
    ).toHaveLength(1);
  });

  it("a mudança do filtro de status atualiza a lista exibida", async () => {
    const user = userEvent.setup();
    vi.mocked(storeOrderService.getOrders).mockResolvedValue([
      makeOrder(),
      makeOrder({
        id: 106,
        status: "PROCESSING",
        customer_name: "Maria Souza",
      }),
    ]);

    renderPage();

    await screen.findByText(/Pedido #105 — João da Silva/);
    expect(
      screen.getByText(/Pedido #106 — Maria Souza/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Pagos (1)" }),
    );

    expect(
      screen.getByText(/Pedido #105 — João da Silva/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Pedido #106 — Maria Souza/),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Em Separação (1)" }),
    );

    expect(
      screen.queryByText(/Pedido #105 — João da Silva/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Pedido #106 — Maria Souza/),
    ).toBeInTheDocument();
  });

  it('o botão "Processar" altera visualmente o estado do pedido', async () => {
    const user = userEvent.setup();
    const paidOrder = makeOrder();
    vi.mocked(storeOrderService.getOrders).mockResolvedValue([
      paidOrder,
    ]);
    vi.mocked(storeOrderService.updateOrderStatus).mockResolvedValue(
      {
        ...paidOrder,
        status: "PROCESSING",
      },
    );

    renderPage();

    const processButton = await screen.findByRole("button", {
      name: /iniciar separação/i,
    });
    await user.click(processButton);

    await waitFor(() => {
      expect(
        storeOrderService.updateOrderStatus,
      ).toHaveBeenCalledWith(105, "PROCESSING");
    });

    expect(
      await screen.findByText("Em Separação"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /iniciar separação/i,
      }),
    ).not.toBeInTheDocument();
  });
});
