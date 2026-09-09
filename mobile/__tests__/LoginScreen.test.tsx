import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';

const mockReplace = jest.fn();
const mockSignIn = jest.fn();


jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
  }),

  Link: ({ children }: { children: React.ReactNode }) => children,
}));


jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

describe('LoginScreen - RF-07', () => {
  const user = {
    id: 1,
    email: 'joao@email.com',
    first_name: 'João',
    last_name: 'Silva',
    phone: '11999990000',
    role: 'CUSTOMER',
    olfactory_families: [],
    preferred_notes: [],
  };

  it('renderiza campos e botões corretamente', async () => {
    const { getByPlaceholderText, getByText } = await render(<LoginScreen />);

    expect(getByPlaceholderText('ana@email.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Esqueci minha senha')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
    expect(getByText('Entrar com Google')).toBeTruthy();
    expect(getByText('Não tem conta? Cadastre-se')).toBeTruthy();
  });

  it('credenciais inválidas → erro exibido, sem navegação', async () => {
    mockSignIn.mockRejectedValueOnce({ response: { status: 401 } });

    const { getByPlaceholderText, getByText } = await render(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('ana@email.com'), 'joao@email.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'senha_errada');

    await fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(getByText(/Credenciais inválidas/)).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('credenciais válidas → navega para (shop)', async () => {
    mockSignIn.mockResolvedValueOnce(user);

    const { getByPlaceholderText, getByText } = await render(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('ana@email.com'), 'joao@email.com');
    await fireEvent.changeText(getByPlaceholderText('••••••••'), 'senha_segura_123');

    await fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(shop)');
    });
  });
});
