import { api } from './api';

export interface StoreProduct {
  id: number;
  product_id?: number;
  product_name: string;
  brand_name: string;
  olfactory_family: string;
  price: string;
  promotional_price?: string;
  volume_ml?: number;
  image_url?: string;
  store_name?: string;
  is_official?: boolean;
  store_city?: string;
  store_state?: string;
  sold_count?: number;
}

export interface StoreReview {
  id: string;
  user_name: string;
  rating: number;
  date: string;
  comment: string;
  verified_purchase: boolean;
  perfume_bought?: string;
  photos?: string[];
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  cover_url?: string;
  logo_url?: string;
  is_active: boolean;
  vacation_mode: boolean;
  is_verified?: boolean; // Mapeado ou opcional para o badge visual
  is_official?: boolean;
  rating?: number;
  reviews_count?: number;
  products_count?: number;
  followers_count?: number;
  is_following?: boolean;
  city?: string;
  state?: string;
  postal_code?: string;
  reviews?: StoreReview[];
}

export interface StoreProductsParams {
  search?: string;
  olfactory_family?: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface ProductStoreOffer {
  id: number;
  store_id: number;
  store_name: string;
  store_slug: string;
  is_official: boolean;
  city?: string;
  state?: string;
  volume_ml: number;
  price: string;
  promotional_price?: string | null;
  stock_quantity: number;
  store_logo?: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  brand: ProductBrand;
  concentration?: string;
  gender?: string;
  olfactory_family: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  description: string;
  image_url: string;
  is_approved: boolean;
  sold_count?: number;
  store_name?: string;
  store_is_official?: boolean;
  store_city?: string;
  store_state?: string;
  store_offers?: ProductStoreOffer[];
  available_volumes?: number[];
  min_price?: number | null;
}

export const storesService = {
  getStores: async (search?: string): Promise<Store[]> => {
    const response = await api.get('/stores/', {
      params: search ? { search } : undefined,
    });
    return Array.isArray(response.data) ? response.data : response.data?.results ?? [];
  },

  getStore: async (id: number | string): Promise<Store> => {
    const response = await api.get(`/stores/${id}/`);
    return response.data;
  },

  getStoreProducts: async (id: number | string, params?: StoreProductsParams): Promise<StoreProduct[]> => {
    const response = await api.get(`/stores/${id}/products/`, { params });
    return response.data;
  },

  getProducts: async (params?: { search?: string; olfactory_family?: string; brand?: number | string }): Promise<ProductDetails[]> => {
    const response = await api.get('/products/', { params });
    return Array.isArray(response.data) ? response.data : response.data?.results ?? [];
  },

  getProduct: async (id: number | string): Promise<ProductDetails> => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  toggleFollow: async (id: number | string): Promise<{ is_following: boolean; followers_count: number }> => {
    const response = await api.post(`/stores/${id}/follow/`);
    return response.data;
  },

  calculateShippingQuote: async (
    storeId: number | string,
    payload: { postal_code: string; cart_subtotal?: number; state?: string }
  ): Promise<ShippingQuoteResponse> => {
    const response = await api.post(`/stores/${storeId}/shipping-quote/`, payload);
    return response.data;
  },
};

export interface ShippingMethodQuote {
  id: "PAC" | "SEDEX";
  name: string;
  price: number;
  handling_days: number;
  transit_days_min: number;
  transit_days_max: number;
  total_delivery_days_min: number;
  total_delivery_days_max: number;
  description: string;
  is_free: boolean;
}

export interface ShippingQuoteResponse {
  store_id: number;
  store_name: string;
  origin_state: string;
  origin_postal_code: string;
  destination_state: string;
  destination_postal_code: string;
  region_tier: "LOCAL" | "NATIONAL";
  region_description: string;
  handling_days: number;
  free_shipping_threshold: number | null;
  qualifies_for_free_shipping: boolean;
  methods: ShippingMethodQuote[];
}