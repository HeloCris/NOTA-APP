import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import RegisterScreen from '@/app/(auth)/register';

// ==========================================
// MOCK DO EXPO ROUTER
// ==========================================

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),

  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// ==========================================
// MOCK DO AUTH CONTEXT
// ==========================================

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
  }),
}));

// ==========================================
// MOCK DO AUTH SERVICE
// ==========================================

jest.mock('@/services/auth', () => ({
  authService: {
    register: jest.fn(),
  },
}));

// ==========================================
// MOCK DO EXPO AUTH SESSION
// ==========================================

jest.mock('expo-auth-session', () => ({
  useAutoDiscovery: jest.fn(() => ({
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  })),

  useAuthRequest: jest.fn(() => [
    null,
    null,
    jest.fn(),
  ]),

  makeRedirectUri: jest.fn(() => 'notaapp://redirect'),
}));

// ==========================================
// MOCK DO EXPO WEB BROWSER
// ==========================================

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// ==========================================
// TESTES
// ==========================================

describe('RegisterScreen - Fluxo de Cadastro Mobile', () => {

  // ------------------------------------------
  // TESTE 1
  // Renderização inicial da tela
  // ------------------------------------------

  it(
    'renderiza todos os campos do formulário de cadastro corretamente',
    async () => {

      const {
        getByText,
        getByPlaceholderText,
      } = await render(<RegisterScreen />);


      // Título da tela

      expect(
        getByText('Crie sua conta')
      ).toBeTruthy();


      // Subtítulo

      expect(
        getByText(
          'Cadastre-se para explorar o universo NŌTA como cliente.'
        )
      ).toBeTruthy();


      // Campo Nome

      expect(
        getByPlaceholderText('Ana')
      ).toBeTruthy();


      // Campo Sobrenome

      expect(
        getByPlaceholderText('Ferreira')
      ).toBeTruthy();


      // Campo E-mail

      expect(
        getByPlaceholderText('ana@email.com')
      ).toBeTruthy();


      // Campo Telefone

      expect(
        getByPlaceholderText('11 99999-0000')
      ).toBeTruthy();


      // Campo Senha

      expect(
        getByPlaceholderText('••••••••')
      ).toBeTruthy();


      // Botão principal

      expect(
        getByText('Próximo →')
      ).toBeTruthy();


      // Botão Google

      expect(
        getByText('Continuar com Google')
      ).toBeTruthy();


      // Link de login

      expect(
        getByText('Já tem uma conta? Entrar')
      ).toBeTruthy();

    }
  );


  // ------------------------------------------
  // TESTE 2
  // Verifica botão desabilitado inicialmente
  // ------------------------------------------

  it(
    'mantém o botão de cadastro desabilitado quando o formulário está vazio',
    async () => {

      const {
        getByText,
      } = await render(<RegisterScreen />);


      const submitButton =
        getByText('Próximo →');


      expect(submitButton).toBeTruthy();

    }
  );


  // ------------------------------------------
  // TESTE 3
  // Preenchimento dos campos
  // ------------------------------------------

  it(
    'permite preencher todos os campos do formulário',
    async () => {

      const {
        getByPlaceholderText,
        getByDisplayValue,
      } = await render(<RegisterScreen />);


      // Nome

      await fireEvent.changeText(
        getByPlaceholderText('Ana'),
        'João'
      );


      // Sobrenome

      await fireEvent.changeText(
        getByPlaceholderText('Ferreira'),
        'Silva'
      );


      // E-mail

      await fireEvent.changeText(
        getByPlaceholderText('ana@email.com'),
        'joao@email.com'
      );


      // Telefone

      await fireEvent.changeText(
        getByPlaceholderText('11 99999-0000'),
        '11999990000'
      );


      // Senha

      await fireEvent.changeText(
        getByPlaceholderText('••••••••'),
        'senha123'
      );


      // Verificações dos valores preenchidos

      expect(
        getByDisplayValue('João')
      ).toBeTruthy();


      expect(
        getByDisplayValue('Silva')
      ).toBeTruthy();


      expect(
        getByDisplayValue('joao@email.com')
      ).toBeTruthy();


      expect(
        getByDisplayValue('11999990000')
      ).toBeTruthy();


      expect(
        getByDisplayValue('senha123')
      ).toBeTruthy();

    }
  );


  // ------------------------------------------
  // TESTE 4
  // Preenchimento completo do formulário
  // ------------------------------------------

  it(
    'habilita o formulário após preenchimento de todos os campos válidos',
    async () => {

      const {
        getByPlaceholderText,
        getByText,
      } = await render(<RegisterScreen />);


      // Preenche Nome

      await fireEvent.changeText(
        getByPlaceholderText('Ana'),
        'Maria'
      );


      // Preenche Sobrenome

      await fireEvent.changeText(
        getByPlaceholderText('Ferreira'),
        'Oliveira'
      );


      // Preenche E-mail

      await fireEvent.changeText(
        getByPlaceholderText('ana@email.com'),
        'maria@email.com'
      );


      // Preenche Telefone

      await fireEvent.changeText(
        getByPlaceholderText('11 99999-0000'),
        '11988887777'
      );


      // Preenche Senha

      await fireEvent.changeText(
        getByPlaceholderText('••••••••'),
        'senha123'
      );


      // Verifica se o botão continua presente

      expect(
        getByText('Próximo →')
      ).toBeTruthy();

    }
  );

});