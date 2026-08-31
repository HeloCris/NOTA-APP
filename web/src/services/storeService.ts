import { apiClient } from '../lib/apiClient';
import type { Store, StoreUpdatePayload, DashboardData } from '../types/store';

export const storeService = {
  getStoreMe: async (): Promise<Store> => {
    const response = await apiClient.get<Store>('/stores/me/');
    return response.data;
  },

  createStore: async (payload: StoreUpdatePayload): Promise<Store> => {
    const response = await apiClient.post<Store>('/stores/', payload);
    return response.data;
  },

  updateStoreMe: async (payload: StoreUpdatePayload): Promise<Store> => {
    const response = await apiClient.patch<Store>('/stores/me/', payload);
    return response.data;
  },

  getDashboardData: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/stores/me/dashboard/');
    return response.data;
  }
};
