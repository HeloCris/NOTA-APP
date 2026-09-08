import { apiClient } from "../lib/apiClient";

export interface BrandRegisterPayload {
  name: string;
  cnpj: string;
  inpi_registration: string;
}

export interface BrandRegisterResponse {
  name: string;
  cnpj: string;
  inpi_registration: string;
}

export const brandService = {
  register(payload: BrandRegisterPayload) {
    return apiClient.post<BrandRegisterResponse>("/brands/register/", payload);
  },
  onboarding(formData: FormData) {
    return apiClient.post("/brands/onboarding/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  status(cnpj: string, inpi: string) {
    return apiClient.get<{name: string, status: string}>("/brands/status/", {
      params: { cnpj, inpi }
    });
  },
  getBrandMe() {
    return apiClient.get<import("../types/catalog").Brand>("/brands/me/");
  },
  activateD2C() {
    return apiClient.post<{detail: string, store_id: number, access: string, refresh: string}>("/brands/me/activate-d2c/");
  },
  deactivateD2C() {
    return apiClient.post<{detail: string}>("/brands/me/deactivate-d2c/");
  },
  getMyProducts() {
    return apiClient.get<import("../types/catalog").Product[]>("/brands/me/products/");
  },
  createProduct(data: Partial<import("../types/catalog").Product>) {
    return apiClient.post<import("../types/catalog").Product>("/brands/me/products/", data);
  },
  updateProduct(id: number, data: Partial<import("../types/catalog").Product>) {
    return apiClient.patch<import("../types/catalog").Product>(`/brands/me/products/${id}/`, data);
  },
  deleteProduct(id: number) {
    return apiClient.delete(`/brands/me/products/${id}/`);
  }
};
