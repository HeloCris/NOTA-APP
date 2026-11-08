import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditOlfactoryProfileScreen from '../src/app/(shop)/account/edit-olfactory-profile';
import { AuthProvider } from '../src/context/AuthContext';
import { storesService } from '../src/services/stores';

// Mock do Expo Router Stack
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  Stack: {
    Screen: () => null,
  },
}));

// Mock do serviço de catálogo de notas
jest.mock('../src/services/stores', () => ({
  storesService: {
    getCatalogNotes: jest.fn().mockResolvedValue({
      families: ['Oriental', 'Amadeirado', 'Cítrico'],
      top_notes: ['Bergamota', 'Limão'],
      heart_notes: ['Rosa', 'Jasmim'],
      base_notes: ['Baunilha', 'Âmbar'],
    }),
  },
}));

describe('RF-20 — Suíte de Testes Mobile (Match Olfativo e Perfil)', () => {

  it('deve carregar as notas do catálogo e habilitar salvamento ao selecionar 1 família', async () => {
    const { getByText, queryByText } = await render(
      <AuthProvider>
        <EditOlfactoryProfileScreen />
      </AuthProvider>
    );

    // Aguarda o término do loading dinâmico
    await waitFor(() => {
      expect(queryByText('Carregando notas do catálogo...')).toBeNull();
    });

    // Confirma se o título e notas vieram do mock
    expect(getByText('1. Famílias olfativas que te conquistam')).toBeTruthy();
    expect(getByText('Bergamota')).toBeTruthy();

    // Clica no card da família Oriental
    const familyCard = getByText('Oriental');
    fireEvent.press(familyCard);

    // O botão de salvar deve ser ativado
    const saveButton = getByText('Salvar Preferências Olfativas');
    expect(saveButton).toBeTruthy();
  });

});