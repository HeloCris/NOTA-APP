import { apiClient } from '../lib/apiClient';
import type { Store, StoreUpdatePayload, DashboardData, StoreCoupon, StoreCouponCreatePayload } from '../types/store';

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
  },

  getCoupons: async (): Promise<StoreCoupon[]> => {
    const response = await apiClient.get<StoreCoupon[] | { results: StoreCoupon[] }>('/store/coupons/');
    const data = response.data;
    return Array.isArray(data) ? data : data.results || [];
  },

  createCoupon: async (payload: StoreCouponCreatePayload): Promise<StoreCoupon> => {
    const response = await apiClient.post<StoreCoupon>('/store/coupons/', payload);
    return response.data;
  },

  updateCoupon: async (id: number, payload: Partial<StoreCouponCreatePayload>): Promise<StoreCoupon> => {
    const response = await apiClient.patch<StoreCoupon>(`/store/coupons/${id}/`, payload);
    return response.data;
  },

  deleteCoupon: async (id: number): Promise<void> => {
    await apiClient.delete(`/store/coupons/${id}/`);
  },

  getInstallmentSettings: async (): Promise<{ max_installments: number; free_interest_installments: number; min_installment_amount: number }> => {
    const response = await apiClient.get('/store/settings/installments/');
    return response.data;
  },

  updateInstallmentSettings: async (payload: { max_installments?: number; free_interest_installments?: number; min_installment_amount?: number }): Promise<void> => {
    await apiClient.patch('/store/settings/installments/', payload);
  },
};

