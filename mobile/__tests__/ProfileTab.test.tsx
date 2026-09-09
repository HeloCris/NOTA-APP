import React from 'react';
import { render } from '@testing-library/react-native';

import ProfileScreen from '@/app/(shop)/account/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),

  Link: ({ children }: { children: React.ReactNode }) => children,
}));

let mockUser: any = null;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  }),
}));

describe('Aba Minha Conta - RF-07', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockUser = null;
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
});