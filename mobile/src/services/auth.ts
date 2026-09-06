import { api } from './api';

export const authService = {
  register: async (data: any) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/auth/token/', data);
    return response.data;
  },
  googleAuth: async (idToken: string) => {
    const response = await api.post('/auth/google/', { id_token: idToken });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  updateOlfactoryProfile: async (data: { olfactory_families: string[], preferred_notes: string[] }) => {
    const response = await api.patch('/auth/me/olfactory-profile/', data);
    return response.data;
  }
};