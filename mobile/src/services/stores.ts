import { api } from './api';

export interface StoreProduct {
  id: number;
  product_name: string;
  brand_name: string;
  olfactory_family: string;
  price: string;
  promotional_price?: string;
  volume_ml?: number;
  image_url?: string;
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
}

export interface StoreProductsParams {
  search?: string;
  olfactory_family?: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  brand: ProductBrand;
  olfactory_family: string;
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  description: string;
  image_url: string;
  is_approved: boolean;
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

  getProduct: async (id: number | string): Promise<ProductDetails> => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },
};