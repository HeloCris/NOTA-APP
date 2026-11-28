export interface StoreProduct {
  id: number;
  product: {
    id: number;
    name: string;
    brand: string;
    image_url?: string;
    ean?: string;
    anvisa_code?: string;
    concentration?: string;
    gender?: string;
    olfactory_family?: string;
    top_notes?: string[];
    heart_notes?: string[];
    base_notes?: string[];
    description?: string;
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