import { apiClient } from "../lib/apiClient";
import type { PaginatedProducts, Product } from "../types/catalog";

export const catalogService = {
  searchProducts: async (search: string): Promise<Product[]> => {
    const response = await apiClient.get<PaginatedProducts>("/products/", {
      params: { search },
    });

    return response.data.results;
  },
};