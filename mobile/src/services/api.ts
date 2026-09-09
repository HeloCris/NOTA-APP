import { create, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { getToken, saveToken, deleteToken } from '../utils/storage';

const debuggerHost = Constants.expoConfig?.hostUri;
const machineIP = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const API_URL = `http://${machineIP}:8000/api/v1`;

export const ACCESS_TOKEN_KEY = 'nota_access_token';
export const REFRESH_TOKEN_KEY = 'nota_refresh_token';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = create({
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

type RefreshFailureListener = () => void;
const refreshFailureListeners: RefreshFailureListener[] = [];

export function onRefreshFailure(listener: RefreshFailureListener): () => void {
  refreshFailureListeners.push(listener);
  return () => {
    const index = refreshFailureListeners.indexOf(listener);
    if (index >= 0) {
      refreshFailureListeners.splice(index, 1);
    }
  };
}

function notifyRefreshFailure() {
  refreshFailureListeners.forEach((listener) => listener());
}

async function requestRefresh(): Promise<string> {
  const refreshToken = await getToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('Refresh token não disponível.');
  }

  const { data } = await refreshClient.post(
    '/auth/token/refresh/',
    { refresh: refreshToken },
  );

  await saveToken(ACCESS_TOKEN_KEY, data.access);

  if (data.refresh) {
    await saveToken(REFRESH_TOKEN_KEY, data.refresh);
  }

  return data.access as string;
}

let refreshPromise: Promise<string> | null = null;

function getRefreshPromise(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function handleUnauthorized(error: AxiosError) {
  const originalRequest = error.config as RetryableRequestConfig;

  if (!originalRequest || originalRequest._retry) {
    return Promise.reject(error);
  }

  if (!(await getToken(REFRESH_TOKEN_KEY))) {
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    const accessToken = await getRefreshPromise();
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return api(originalRequest);
  } catch (refreshError) {
    await deleteToken(ACCESS_TOKEN_KEY);
    await deleteToken(REFRESH_TOKEN_KEY);
    notifyRefreshFailure();
    return Promise.reject(refreshError);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      return handleUnauthorized(error);
    }
    return Promise.reject(error);
  }
);