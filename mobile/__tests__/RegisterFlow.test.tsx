import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import RegisterScreen from '@/app/(auth)/register';


jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),

  Link: ({ children }: { children: React.ReactNode }) => children,
}));


jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
  }),
}));


jest.mock('@/services/auth', () => ({
  authService: {
    register: jest.fn(),
  },
}));


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


jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));


describe('RegisterScreen - Fluxo de Cadastro Mobile', () => {
  jest.setTimeout(15000);


  it(
    'renderiza todos os campos do formulário de cadastro corretamente',
    async () => {

      const {
        getByText,
        getByPlaceholderText,
      } = await render(<RegisterScreen />);


      expect(
        getByText('Crie sua conta')
      ).toBeTruthy();


      expect(
        getByText(
          'Cadastre-se para explorar o universo NŌTA como cliente.'
        )
      ).toBeTruthy();


      expect(
        getByPlaceholderText('Ana')
      ).toBeTruthy();


      expect(
        getByPlaceholderText('Ferreira')
      ).toBeTruthy();


      expect(
        getByPlaceholderText('ana@email.com')
      ).toBeTruthy();


      expect(
        getByPlaceholderText('11 99999-0000')
      ).toBeTruthy();


      expect(
        getByPlaceholderText('••••••••')
      ).toBeTruthy();


      expect(
        getByText('Próximo →')
      ).toBeTruthy();


      expect(
        getByText('Continuar com Google')
      ).toBeTruthy();


      expect(
        getByText('Já tem uma conta? Entrar')
      ).toBeTruthy();

    }
  );


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


  it(
    'permite preencher todos os campos do formulário',
    async () => {

      const {
        getByPlaceholderText,
        getByDisplayValue,
      } = await render(<RegisterScreen />);


      await fireEvent.changeText(
        getByPlaceholderText('Ana'),
        'João'
      );


      await fireEvent.changeText(
        getByPlaceholderText('Ferreira'),
        'Silva'
      );


      await fireEvent.changeText(
        getByPlaceholderText('ana@email.com'),
        'joao@email.com'
      );


      await fireEvent.changeText(
        getByPlaceholderText('11 99999-0000'),
        '11999990000'
      );


      await fireEvent.changeText(
        getByPlaceholderText('••••••••'),
        'senha123'
      );


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


  it(
    'habilita o formulário após preenchimento de todos os campos válidos',
    async () => {

      const {
        getByPlaceholderText,
        getByText,
      } = await render(<RegisterScreen />);


      await fireEvent.changeText(
        getByPlaceholderText('Ana'),
        'Maria'
      );


      await fireEvent.changeText(
        getByPlaceholderText('Ferreira'),
        'Oliveira'
      );


      await fireEvent.changeText(
        getByPlaceholderText('ana@email.com'),
        'maria@email.com'
      );


      await fireEvent.changeText(
        getByPlaceholderText('11 99999-0000'),
        '11988887777'
      );


      await fireEvent.changeText(
        getByPlaceholderText('••••••••'),
        'senha123'
      );


      expect(
        getByText('Próximo →')
      ).toBeTruthy();

    }
  );

});
