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

export const storesService = {
  getStore: async (id: number | string): Promise<Store> => {
    const response = await api.get(`/stores/${id}/`);
    return response.data;
  },

  getStoreProducts: async (id: number | string, params?: StoreProductsParams): Promise<StoreProduct[]> => {
    const response = await api.get(`/stores/${id}/products/`, { params });
    return response.data;
  },
};