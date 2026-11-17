import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketMetricsSection } from "./MarketMetricsSection";
import { storeService } from "../../services/storeService";
import type { MarketMetricsData } from "../../types/marketMetrics";

vi.mock("../../services/storeService", () => ({
  storeService: {
    getMarketMetrics: vi.fn(),
  },
}));

const getMarketMetrics = vi.mocked(storeService.getMarketMetrics);

const mockMetricsData: MarketMetricsData = {
  summary: {
    total_customers_with_profile: 142,
    total_active_catalog_products: 30,
    total_active_marketplace_offers: 85,
    top_family_name: "Amadeirado",
    top_note_name: "Sândalo",
    decant_sales_share_pct: 64,
  },
  family_demand: [
    { family: "Amadeirado", customers_count: 58, share_pct: 41, catalog_products_count: 8 },
    { family: "Oriental", customers_count: 49, share_pct: 35, catalog_products_count: 5 },
  ],
  top_notes_demand: [
    { note: "Sândalo", customers_count: 46, share_pct: 32 },
    { note: "Baunilha", customers_count: 41, share_pct: 29 },
  ],
  format_thermometer: {
    decants: { active_offers_count: 48, units_sold: 310, sales_share_pct: 64, avg_ticket: "58.90" },
    bottles: { active_offers_count: 37, units_sold: 175, sales_share_pct: 36, avg_ticket: "689.00" },
  },
  catalog_price_comparison: [
    {
      store_product_id: 101,
      product_id: 1,
      product_name: "Santal 33",
      brand_name: "Le Labo",
      olfactory_family: "Amadeirado",
      volume_ml: 10,
      is_decant: true,
      my_price: "65.00",
      market_min_price: "65.00",
      market_avg_price: "72.00",
      sellers_count: 3,
      position: "lowest",
    },
    {
      store_product_id: 102,
      product_id: 1,
      product_name: "Santal 33",
      brand_name: "Le Labo",
      olfactory_family: "Amadeirado",
      volume_ml: 100,
      is_decant: false,
      my_price: "890.00",
      market_min_price: "820.00",
      market_avg_price: "835.00",
      sellers_count: 2,
      position: "above_market",
    },
  ],
  trending_products: [
    {
      id: 1,
      name: "Santal 33",
      brand_name: "Le Labo",
      olfactory_family: "Amadeirado",
      sold_count: 124,
      min_market_price: "65.00",
      sellers_count: 4,
      in_my_catalog: true,
    },
    {
      id: 2,
      name: "Baccarat Rouge 540",
      brand_name: "Maison Francis Kurkdjian",
      olfactory_family: "Oriental",
      sold_count: 98,
      min_market_price: "89.00",
      sellers_count: 2,
      in_my_catalog: false,
    },
  ],
};

describe("MarketMetricsSection", () => {
  it("renderiza o cabeçalho e as abas de sub-navegação RF-23 e RF-24", async () => {
    getMarketMetrics.mockResolvedValue(mockMetricsData);
    render(<MarketMetricsSection />);

    expect(screen.getByText("Métricas & Inteligência")).toBeInTheDocument();
    expect(screen.getByText("Inteligência de Mercado")).toBeInTheDocument();
    expect(screen.getByText("Desempenho da Minha Loja")).toBeInTheDocument();
  });

  it("exibe skeletons de loading enquanto carrega", () => {
    // Promise que nunca resolve = estado loading
    getMarketMetrics.mockReturnValue(new Promise(() => {}));
    render(<MarketMetricsSection />);

    // Verifica que há divs de skeleton (animate-pulse)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("alterna para a sub-aba RF-24 e volta para RF-23", async () => {
    getMarketMetrics.mockResolvedValue(mockMetricsData);
    render(<MarketMetricsSection />);

    fireEvent.click(screen.getByText("Desempenho da Minha Loja"));
    expect(screen.getByText("Módulo em Construção")).toBeInTheDocument();

    fireEvent.click(screen.getByText("← Voltar para Inteligência de Mercado"));
    await waitFor(() =>
      expect(screen.getByText("Mapa de Demanda por Família Olfativa")).toBeInTheDocument()
    );
  });

  it("exibe dados dinâmicos da API quando a chamada tem sucesso", async () => {
    getMarketMetrics.mockResolvedValue(mockMetricsData);
    render(<MarketMetricsSection />);

    // Aguarda dados carregarem
    await waitFor(() => expect(screen.queryAllByText("Amadeirado").length).toBeGreaterThan(0));

    // Notas
    expect(screen.getByText("Baunilha")).toBeInTheDocument();

    // Trending products badges
    expect(screen.queryAllByText("Santal 33").length).toBeGreaterThan(0);
    expect(screen.getByText("No catálogo")).toBeInTheDocument();
    expect(screen.getByText("Baccarat Rouge 540")).toBeInTheDocument();
    expect(screen.getByText("Oportunidade")).toBeInTheDocument();

    // Radar de Competitividade do Meu Catálogo por perfume + volumetria
    expect(screen.getByText("Competitividade do Meu Catálogo")).toBeInTheDocument();
    expect(screen.getByText("10ml")).toBeInTheDocument();
    expect(screen.getByText("Menor preço")).toBeInTheDocument();
    expect(screen.getByText("Acima da média")).toBeInTheDocument();
  });

  it("exibe mensagem de erro com botão de retry quando a API falha", async () => {
    getMarketMetrics.mockRejectedValue(new Error("Network Error"));
    render(<MarketMetricsSection />);

    await waitFor(() =>
      expect(
        screen.getByText(/Não foi possível carregar os dados de mercado/i)
      ).toBeInTheDocument()
    );

    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });
});
