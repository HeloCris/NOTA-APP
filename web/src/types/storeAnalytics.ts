export type AnalyticsPeriod = "7d" | "30d" | "all";

export interface StoreAnalyticsFunnel {
  store_views: number;
  followers_count: number;
  new_followers_in_period: number;
  paid_orders_count: number;
  conversion_rate_pct: number;
}

export interface StoreAnalyticsFormatMix {
  decants_units_sold: number;
  decants_revenue: string;
  bottles_units_sold: number;
  bottles_revenue: string;
}

export interface StoreAnalyticsCoupons {
  active_coupons_count: number;
  orders_with_coupon: number;
  total_discount_granted: string;
  revenue_with_coupon: string;
  top_coupon_code: string | null;
}

export interface TopStoreOffer {
  store_product_id: number;
  product_name: string;
  brand_name: string;
  volume_ml: number;
  is_decant: boolean;
  price: string;
  stock_quantity: number;
  units_sold: number;
  revenue: string;
}

export interface SuggestedProduct {
  id: number;
  name: string;
  brand_name: string;
}

export interface CatalogGap {
  type: "family" | "note";
  name: string;
  customer_demand_pct: number;
  my_active_offers_count: number;
  suggested_products: SuggestedProduct[];
}

export interface StoreAnalyticsData {
  period: AnalyticsPeriod;
  funnel: StoreAnalyticsFunnel;
  format_mix: StoreAnalyticsFormatMix;
  coupons_performance: StoreAnalyticsCoupons;
  top_store_offers: TopStoreOffer[];
  catalog_gaps: CatalogGap[];
}
