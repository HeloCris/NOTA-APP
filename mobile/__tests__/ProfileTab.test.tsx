import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ProfileScreen from '@/app/(shop)/account/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/hooks/use-unread-notifications', () => ({
  useUnreadNotifications: () => ({
    unreadCount: 0,
    refresh: jest.fn(),
  }),
}));

let mockUser: any = null;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: jest.fn(),
    updateProfile: mockUpdateProfile,
  }),
}));

describe('Aba Minha Conta - RF-07', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockUpdateProfile.mockResolvedValue(undefined);
  });

  it('sem perfil olfativo → CTA de preenchimento renderizado', async () => {
    mockUser = {
      first_name: 'Ana',
      last_name: 'Ferreira',
      email: 'ana@email.com',
      olfactory_families: [],
      preferred_notes: [],
    };

    const { getByText, queryByText } = await render(<ProfileScreen />);

    expect(getByText('Ana Ferreira')).toBeTruthy();
    expect(getByText(/Complete seu perfil olfativo/)).toBeTruthy();
    expect(getByText('Completar agora')).toBeTruthy();
    expect(queryByText('Famílias')).toBeNull();
    expect(queryByText('Notas favoritas')).toBeNull();
  });

  it('perfil olfativo preenchido → chips de famílias e notas renderizados', async () => {
    mockUser = {
      first_name: 'Ana',
      last_name: 'Ferreira',
      email: 'ana@email.com',
      olfactory_families: ['Amadeirado', 'Floral'],
      preferred_notes: ['Sândalo', 'Jasmim'],
    };

    const { getByText, queryByText } = await render(<ProfileScreen />);

    expect(getByText('Famílias')).toBeTruthy();
    expect(getByText('Amadeirado')).toBeTruthy();
    expect(getByText('Floral')).toBeTruthy();
    expect(getByText('Notas favoritas')).toBeTruthy();
    expect(getByText('Sândalo')).toBeTruthy();
    expect(getByText('Jasmim')).toBeTruthy();
    expect(queryByText('Completar agora')).toBeNull();
  });

  it('renderiza dados pessoais e botão Sair', async () => {
    mockUser = {
      first_name: 'Ana',
      last_name: 'Ferreira',
      email: 'ana@email.com',
      phone: '11 99999-0000',
      olfactory_families: [],
      preferred_notes: [],
    };

    const { getAllByText, getByText } = await render(<ProfileScreen />);

    expect(getByText('Dados Pessoais')).toBeTruthy();
    expect(getByText('Editar')).toBeTruthy();
    expect(getAllByText('ana@email.com').length).toBeGreaterThan(0);
    expect(getByText('Sair')).toBeTruthy();
  });

  it('edita nome completo e telefone em modal e persiste via updateProfile', async () => {
    mockUser = {
      first_name: 'Ana',
      last_name: 'Ferreira',
      email: 'ana@email.com',
      phone: '11999990000',
      olfactory_families: [],
      preferred_notes: [],
    };

    const renderResult = await render(<ProfileScreen />);
    const { getByText, getByPlaceholderText, queryByText, getByLabelText } = renderResult;

    expect(queryByText('Configurações')).toBeNull();

    await fireEvent.press(getByLabelText('Editar dados pessoais'));
    expect(getByText('Editar dados pessoais')).toBeTruthy();
    expect(getByPlaceholderText('Ana Ferreira').props.value).toBe('Ana Ferreira');
    expect(getByPlaceholderText('(11) 99999-0000').props.value).toBe('(11) 99999-0000');

    await fireEvent.changeText(getByPlaceholderText('Ana Ferreira'), 'Ana Beatriz Souza');
    await fireEvent.changeText(getByPlaceholderText('(11) 99999-0000'), '11988887777');
    await fireEvent.press(getByLabelText('Salvar dados pessoais'));

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        first_name: 'Ana',
        last_name: 'Beatriz Souza',
        phone: '(11) 98888-7777',
      })
    );
    await waitFor(() =>
      expect(getByText('Dados pessoais atualizados com sucesso.')).toBeTruthy()
    );
  });

  it('exibe erro quando o salvamento do perfil falha', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Network Error'));
    mockUser = {
      first_name: 'Ana',
      last_name: 'Ferreira',
      email: 'ana@email.com',
      phone: '11999990000',
      olfactory_families: [],
      preferred_notes: [],
    };

    const { getByText, getByLabelText } = await render(<ProfileScreen />);
    await fireEvent.press(getByLabelText('Editar dados pessoais'));
    await fireEvent.press(getByLabelText('Salvar dados pessoais'));

    await waitFor(() =>
      expect(getByText('Não foi possível salvar seus dados. Tente novamente.')).toBeTruthy()
    );
  });
});