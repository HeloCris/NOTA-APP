import { apiClient } from "../lib/apiClient";
import type {
  PaginatedShowcaseProducts,
  ShowcaseStore,
} from "../types/showcase";

export interface ShowcaseFilters {
  brand?: string;
  family?: string;
  min_price?: string;
  max_price?: string;
  search?: string;
}

export const showcaseService = {
  async getProducts(filters: ShowcaseFilters = {}) {
    const response = await apiClient.get<PaginatedShowcaseProducts>(
      "/showcase/products/",
      { params: filters },
    );
    return response.data;
  },

  async getStore(slug: string, filters: ShowcaseFilters = {}) {
    const response = await apiClient.get<ShowcaseStore>(
      `/showcase/stores/${slug}/`,
      { params: filters },
    );
    return response.data;
  },
};
