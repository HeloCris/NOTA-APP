import { api, REFRESH_TOKEN_KEY } from './api';
import { getToken } from '../utils/storage';

export const authService = {
  register: async (data: any) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/auth/token/', data);
    return response.data;
  },
  loginWithGoogle: async (idToken: string) => {
    const response = await api.post('/auth/google/', { id_token: idToken });
    return response.data;
  },
  googleAuth: async (idToken: string) => {
    const response = await api.post('/auth/google/', { id_token: idToken });
    return response.data;
  },
  refreshToken: async (refresh: string) => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
  logout: async () => {
    const refreshToken = await getToken(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await api.post('/auth/token/blacklist/', { refresh: refreshToken });
      } catch {
        // Invalidação no servidor é best-effort; o logout local sempre ocorre.
      }
    }
  },
  me: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }) => {
    const response = await api.patch('/auth/me/', data);
    return response.data;
  },
  updateOlfactoryProfile: async (data: { olfactory_families: string[], preferred_notes: string[] }) => {
    const response = await api.patch('/auth/me/olfactory-profile/', data);
    return response.data;
  }
};