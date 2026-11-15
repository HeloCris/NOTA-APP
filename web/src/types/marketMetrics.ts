export interface MarketSummary {
  total_customers_with_profile: number;
  total_active_catalog_products: number;
  total_active_marketplace_offers: number;
  my_store_products_count?: number;
  top_family_name: string;
  top_note_name: string;
  decant_sales_share_pct: number;
}

export interface FamilyDemand {
  family: string;
  customers_count: number;
  share_pct: number;
  catalog_products_count: number;
}

export interface TopNoteDemand {
  note: string;
  customers_count: number;
  share_pct: number;
}

export interface FormatData {
  active_offers_count: number;
  units_sold: number;
  sales_share_pct: number;
  avg_ticket: string;
}

export interface FormatThermometer {
  decants: FormatData;
  bottles: FormatData;
}

export type CatalogPricePosition = "lowest" | "competitive" | "above_market" | "exclusive";

export interface CatalogPriceComparisonItem {
  store_product_id: number;
  product_id: number;
  product_name: string;
  brand_name: string;
  olfactory_family: string;
  volume_ml: number;
  is_decant: boolean;
  my_price: string;
  market_min_price: string;
  market_avg_price: string;
  sellers_count: number;
  position: CatalogPricePosition;
}

export interface TrendingProduct {
  id: number;
  name: string;
  brand_name: string;
  olfactory_family: string;
  sold_count: number;
  min_market_price: string;
  sellers_count: number;
  in_my_catalog: boolean;
}

export interface MarketMetricsData {
  summary: MarketSummary;
  family_demand: FamilyDemand[];
  top_notes_demand: TopNoteDemand[];
  format_thermometer: FormatThermometer;
  catalog_price_comparison: CatalogPriceComparisonItem[];
  trending_products: TrendingProduct[];
}

