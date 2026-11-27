import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreAnalyticsSection } from "./StoreAnalyticsSection";
import { storeService } from "../../services/storeService";
import type { StoreAnalyticsData } from "../../types/storeAnalytics";

vi.mock("../../services/storeService", () => ({
  storeService: {
    getStoreAnalytics: vi.fn(),
  },
}));

const getStoreAnalytics = vi.mocked(storeService.getStoreAnalytics);

const mockData: StoreAnalyticsData = {
  period: "30d",
  funnel: {
    store_views: 250,
    followers_count: 12,
    new_followers_in_period: 4,
    paid_orders_count: 5,
    conversion_rate_pct: 2,
  },
  format_mix: {
    decants_units_sold: 8,
    decants_revenue: "480.00",
    bottles_units_sold: 2,
    bottles_revenue: "900.00",
  },
  coupons_performance: {
    active_coupons_count: 2,
    orders_with_coupon: 3,
    total_discount_granted: "30.00",
    revenue_with_coupon: "270.00",
    top_coupon_code: "NOTA10",
  },
  top_store_offers: [
    {
      store_product_id: 1,
      product_name: "Santal 33",
      brand_name: "Le Labo",
      volume_ml: 10,
      is_decant: true,
      price: "65.00",
      stock_quantity: 7,
      units_sold: 8,
      revenue: "520.00",
    },
  ],
  catalog_gaps: [
    {
      type: "family",
      name: "Gourmand",
      customer_demand_pct: 68,
      my_active_offers_count: 0,
      suggested_products: [
        { id: 9, name: "La Vie Est Belle", brand_name: "Lancôme" },
      ],
    },
  ],
};

describe("StoreAnalyticsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoreAnalytics.mockResolvedValue(mockData);
  });

  it("exibe funil, cupons, mix e ranking da loja", async () => {
    render(<StoreAnalyticsSection />);

    await waitFor(() => expect(screen.getByText("250")).toBeInTheDocument());
    expect(screen.getByText("+4 novos seguidores no período")).toBeInTheDocument();
    expect(screen.getByText("3 pedidos · 2 cupons ativos")).toBeInTheDocument();
    expect(screen.getByText("R$ 480,00")).toBeInTheDocument();
    expect(screen.getByText("Santal 33")).toBeInTheDocument();
    expect(screen.getByText("Cupom campeão: NOTA10")).toBeInTheDocument();
  });

  it("refaz a consulta ao trocar o período", async () => {
    render(<StoreAnalyticsSection />);

    await waitFor(() => expect(getStoreAnalytics).toHaveBeenCalledWith("30d"));
    fireEvent.click(screen.getByText("Últimos 7 dias"));
    await waitFor(() => expect(getStoreAnalytics).toHaveBeenCalledWith("7d"));
    expect(screen.getAllByText("Últimos 7 dias").length).toBeGreaterThan(0);
  });

  it("renderiza gap de catálogo e redireciona ao clicar em Ofertar", async () => {
    const onGoToProducts = vi.fn();
    render(<StoreAnalyticsSection onGoToProducts={onGoToProducts} />);

    await waitFor(() => expect(screen.getByText("Gourmand")).toBeInTheDocument());
    expect(screen.getByText("68% dos clientes")).toBeInTheDocument();
    expect(screen.getByText("La Vie Est Belle · Lancôme")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ofertar na minha loja"));
    expect(onGoToProducts).toHaveBeenCalledWith("Gourmand");
    expect(onGoToProducts).toHaveBeenCalledTimes(1);
  });

  it("exibe erro com retry quando a API falha", async () => {
    getStoreAnalytics.mockRejectedValueOnce(new Error("Network Error"));
    render(<StoreAnalyticsSection />);

    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar o desempenho da sua loja. Tente novamente.")
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Tentar novamente"));
    await waitFor(() => expect(getStoreAnalytics).toHaveBeenCalledTimes(2));
  });

  it("exibe mensagem de sucesso quando não há gaps", async () => {
    getStoreAnalytics.mockResolvedValueOnce({ ...mockData, catalog_gaps: [] });
    render(<StoreAnalyticsSection />);

    await waitFor(() =>
      expect(
        screen.getByText(/Nenhum gap de catálogo identificado/)
      ).toBeInTheDocument()
    );
  });
});
