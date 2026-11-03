import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardTab } from "./DashboardTab";

const { getDashboardData } = vi.hoisted(() => ({ getDashboardData: vi.fn() }));

vi.mock("../../services/storeService", () => ({
  storeService: { getDashboardData },
}));

describe("DashboardTab RF-17", () => {
  it("renderiza KPIs reais, período e não renderiza Top Perfumes", async () => {
    getDashboardData.mockResolvedValue({
      rating: 4.8,
      is_verified: false,
      period: "7d",
      kpis: {
        gross_revenue: 100,
        net_revenue: 90,
        commission: 10,
        refunds: 0,
        average_ticket: 100,
        pending_orders: 1,
        stock_alerts: 2,
        stock_value: 250,
        store_views: 8,
        cancellation_rate: 2,
        return_rate: 1,
      },
      chart: { labels: ["01/01"], values: [100] },
      recent_orders: [],
      restock_alerts: [],
    });

    render(<DashboardTab store={{ id: 1, owner_id: 1, name: "Loja RF17", cnpj: "12345678000199", is_active: true, vacation_mode: false }} />);

    await waitFor(() => expect(screen.getByText("Faturamento líquido")).toBeInTheDocument());
    expect(screen.getByText("Ticket médio")).toBeInTheDocument();
    expect(screen.getByText("Cancelamentos e devoluções")).toBeInTheDocument();
    expect(screen.queryByText("Top Perfumes")).not.toBeInTheDocument();
    expect(getDashboardData).toHaveBeenCalledWith("7d");
  });
});
