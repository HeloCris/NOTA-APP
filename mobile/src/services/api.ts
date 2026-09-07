import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { getToken, saveToken, deleteToken } from '../utils/storage';

// Descobre o IP automaticamente através do Metro Bundler do Expo
const debuggerHost = Constants.expoConfig?.hostUri;
const machineIP = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// Monta a URL final (vai funcionar na Web, no Emulador e no Celular Físico)
const API_URL = `http://${machineIP}:8000/api/v1`;

export const ACCESS_TOKEN_KEY = 'nota_access_token';
export const REFRESH_TOKEN_KEY = 'nota_refresh_token';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;
    const isUnauthorized = error.response?.status === 401;

    if (!isUnauthorized || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshToken = await getToken(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      await deleteToken(ACCESS_TOKEN_KEY);
      await deleteToken(REFRESH_TOKEN_KEY);
      return Promise.reject(error);
    }

    try {
      const { data } = await refreshClient.post('/auth/token/refresh/', { refresh: refreshToken });
      await saveToken(ACCESS_TOKEN_KEY, data.access);
      
      if (data.refresh) {
        await saveToken(REFRESH_TOKEN_KEY, data.refresh);
      }

      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      await deleteToken(ACCESS_TOKEN_KEY);
      await deleteToken(REFRESH_TOKEN_KEY);
      return Promise.reject(refreshError);
    }
  }
);