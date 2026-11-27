import { apiClient } from "../lib/apiClient";
import type { PaginatedProducts, Product } from "../types/catalog";

export const catalogService = {
  searchProducts: async (
    search?: string,
    params?: Record<string, any>,
  ): Promise<Product[]> => {
    const response = await apiClient.get<PaginatedProducts>("/products/", {
      params: { ...(search ? { search } : {}), ...params },
    });

    return response.data.results;
  },
};