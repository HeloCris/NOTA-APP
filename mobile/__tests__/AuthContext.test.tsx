import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';

import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  authService: {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
    updateProfile: jest.fn(),
    updateOlfactoryProfile: jest.fn(),
  },
}));

function SessionProbe() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Text>{`authenticated:${user?.email}`}</Text>;
  }

  return <Text>unauthenticated</Text>;
}

describe('AuthContext - sessão persistida', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('token válido no SecureStore → usuário autenticado, sem redirecionar para login', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'nota_access_token') {
        return 'token-valido';
      }
      return null;
    });

    (authService.me as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'joao@email.com',
      first_name: 'João',
      last_name: 'Silva',
      phone: '11999990000',
      role: 'CUSTOMER',
      olfactory_families: [],
      preferred_notes: [],
    });

    const { getByText } = await render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('authenticated:joao@email.com')).toBeTruthy();
    });
  });

  it('sem token no SecureStore → usuário desautenticado', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { getByText } = await render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('unauthenticated')).toBeTruthy();
    });
  });
});