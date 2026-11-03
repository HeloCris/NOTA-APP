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
  stock_quantity?: number;
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

export interface ReviewPhotoItem {
  id: number;
  image: string;
  created_at: string;
}

export interface ReviewReplyItem {
  id: number;
  text: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface ApiStoreReview {
  id: number;
  order_item: number;
  rating: number;
  comment: string;
  photos: ReviewPhotoItem[];
  reply?: ReviewReplyItem | null;
  author_name: string;
  product_name: string;
  product_image?: string | null;
  volume_ml?: number | null;
  order_id?: number | null;
  edited_at?: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreReviewsSummary {
  count: number;
  average: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface StoreReviewsResponse {
  summary: StoreReviewsSummary;
  results: ApiStoreReview[];
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
  store_product_ids?: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface ProductStoreOffer {
  id: number;
  store_product_id?: number;
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

  registerView: async (id: number | string): Promise<void> => {
    await api.post(`/stores/${id}/view/`);
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

  getStoreReviews: async (
    storeId: number | string,
    params?: {
      product?: number | string;
      rating?: number | string;
      with_photos?: boolean;
      ordering?: string;
    }
  ): Promise<StoreReviewsResponse> => {
    const response = await api.get(`/stores/${storeId}/reviews/`, {
      params: {
        ...params,
        with_photos: params?.with_photos ? 'true' : undefined,
      },
    });
    return response.data;
  },

  getProductReviews: async (
    productId: number | string,
    params?: {
      storeId?: number | string;
      rating?: number | string;
      with_photos?: boolean;
      ordering?: string;
    }
  ): Promise<StoreReviewsResponse> => {
    const url = params?.storeId
      ? `/stores/${params.storeId}/products/${productId}/reviews/`
      : `/products/${productId}/reviews/`;
    const response = await api.get(url, {
      params: {
        rating: params?.rating,
        with_photos: params?.with_photos ? 'true' : undefined,
        ordering: params?.ordering,
      },
    });
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