import { apiClient } from "../lib/apiClient";
import type {
  PaginatedStoreProducts,
  StoreProduct,
  StoreProductPayload,
} from "../types/inventory";

interface ListParams {
  search?: string;
  status?: string;
  is_active?: string;
}

export const inventoryService = {
  listStoreProducts: async (params?: ListParams): Promise<StoreProduct[]> => {
    const response = await apiClient.get<PaginatedStoreProducts>(
      "/store-products/",
      { params },
    );

    return response.data.results;
  },

  createStoreProduct: async (
    payload: StoreProductPayload,
  ): Promise<StoreProduct> => {
    const response = await apiClient.post<StoreProduct>(
      "/store-products/",
      payload,
    );

    return response.data;
  },

  updateStoreProduct: async (
    id: number,
    payload: Partial<StoreProductPayload>,
  ): Promise<StoreProduct> => {
    const response = await apiClient.patch<StoreProduct>(
      `/store-products/${id}/`,
      payload,
    );

    return response.data;
  },

  deleteStoreProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/store-products/${id}/`);
  },
};