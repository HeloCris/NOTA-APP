export interface StoreProduct {
  id: number;
  product: {
    id: number;
    name: string;
    brand: string;
  };
  volume_ml: number;
  price: string;
  promotional_price: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoreProductPayload {
  product_id: number;
  volume_ml: number;
  price: string;
  promotional_price?: string | null;
  stock_quantity: number;
  is_available?: boolean;
}

export interface PaginatedStoreProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: StoreProduct[];
}