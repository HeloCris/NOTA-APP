import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000/api/v1";

export const ACCESS_TOKEN_KEY = "nota_access_token";
export const REFRESH_TOKEN_KEY = "nota_refresh_token";

interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(
    ACCESS_TOKEN_KEY,
  );

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined;

    const isUnauthorized = error.response?.status === 401;

    const isRefreshRequest =
      originalRequest?.url?.includes(
        "/auth/token/refresh/",
      ) ?? false;

    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem(
      REFRESH_TOKEN_KEY,
    );

    if (!refreshToken) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);

      return Promise.reject(error);
    }

    try {
      const response = await refreshClient.post<{
        access: string;
        refresh?: string;
      }>(
        "/auth/token/refresh/",
        {
          refresh: refreshToken,
        },
      );

      const newAccessToken = response.data.access;

      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        newAccessToken,
      );

      if (response.data.refresh) {
        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          response.data.refresh,
        );
      }

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);

      window.location.assign("/login");

      return Promise.reject(refreshError);
    }
  },
);