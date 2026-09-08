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
  }
};
