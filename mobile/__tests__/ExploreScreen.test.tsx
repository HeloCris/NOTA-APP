import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExploreScreen from '../src/app/(shop)/explore';
import { storesService } from '../src/services/stores';

const mockPush = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('../src/services/stores', () => ({
  storesService: {
    getStores: jest.fn(),
  },
}));

const mockStores = [
  {
    id: 1,
    name: 'Maison Noire',
    slug: 'maison-noire',
    city: 'São Paulo',
    state: 'SP',
    is_official: true,
    followers_count: 50,
    rating: 4.8,
    reviews_count: 12,
    is_active: true,
    vacation_mode: false,
  },
  {
    id: 2,
    name: 'Parfum Atelier',
    slug: 'parfum-atelier',
    city: 'Rio de Janeiro',
    state: 'RJ',
    is_official: false,
    followers_count: 20,
    rating: null,
    reviews_count: 0,
    is_active: true,
    vacation_mode: false,
  },
];

describe('ExploreScreen (Integração com Parâmetros de URL - RF-21)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    (storesService.getStores as jest.Mock).mockResolvedValue(mockStores);
  });

  it('aplica filtro de família olfativa quando family é fornecido via URL (RN-05, CA-03)', async () => {
    mockSearchParams = { family: 'Oriental' };

    const screen = await render(<ExploreScreen />);

    // Deve exibir o badge do filtro ativo de família
    expect(screen.getByTestId('active-family-filter')).toBeTruthy();
    expect(screen.getByText('Família: Oriental')).toBeTruthy();

    // Deve exibir o perfume da família Oriental (Grand Soir) e não exibir perfumes de outras famílias (ex: Essência do Brasil - Floral)
    expect(screen.getByText('Grand Soir')).toBeTruthy();
    expect(screen.queryByText('Essência do Brasil')).toBeNull();
  });

  it('aplica filtro de decants quando type=decant é fornecido via URL (RN-06, CA-04)', async () => {
    mockSearchParams = { type: 'decant' };

    const screen = await render(<ExploreScreen />);

    // Deve exibir o badge do filtro ativo de tipo
    expect(screen.getByTestId('active-type-filter')).toBeTruthy();
    expect(screen.getByText('Tipo: Decants')).toBeTruthy();

    // Perfume com decant deve aparecer (Oud Wood)
    expect(screen.getByText('Oud Wood')).toBeTruthy();
    // Perfume sem decant NÃO deve aparecer (Essência do Brasil)
    expect(screen.queryByText('Essência do Brasil')).toBeNull();
  });

  it('abre automaticamente o modal de notas olfativas quando openNotes="1" (RN-06, CA-04)', async () => {
    mockSearchParams = { openNotes: '1' };

    const screen = await render(<ExploreScreen />);

    // O modal de notas deve estar visível
    const modal = screen.getByTestId('notes-modal');
    expect(modal).toBeTruthy();
    expect(screen.getByText('Descoberta por Notas')).toBeTruthy();

    // Permite fechar o modal
    const closeBtn = screen.getByTestId('close-notes-modal-btn');
    fireEvent.press(closeBtn);
  });

  it('alterna para a aba de Lojas quando tab="stores" (RN-07)', async () => {
    mockSearchParams = { tab: 'stores' };

    const screen = await render(<ExploreScreen />);

    // O container da aba de lojas deve estar ativo
    expect(screen.getByTestId('stores-tab-content')).toBeTruthy();
    expect(screen.getByText('Todas as Lojas')).toBeTruthy();

    // Carrega e exibe as lojas da API
    await waitFor(() => {
      expect(screen.getByText('Maison Noire')).toBeTruthy();
      expect(screen.getByText('Parfum Atelier')).toBeTruthy();
      expect(screen.getByText('Novo')).toBeTruthy(); // Loja sem avaliações
    });

    // Toque no card da loja navega para a rota de detalhe da loja
    const storeItem = screen.getByTestId('store-list-item-1');
    fireEvent.press(storeItem);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/store/[id]',
      params: { id: '1' },
    });
  });

  it('permite alternar manualmente entre abas Perfumes e Lojas', async () => {
    mockSearchParams = {};

    const screen = await render(<ExploreScreen />);

    // Inicialmente na aba de perfumes
    expect(screen.getByTestId('products-tab-content')).toBeTruthy();

    // Toca na aba de lojas
    const storesTabBtn = screen.getByTestId('tab-stores');
    fireEvent.press(storesTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('stores-tab-content')).toBeTruthy();
    });

    // Toca de volta na aba de perfumes
    const perfumesTabBtn = screen.getByTestId('tab-perfumes');
    fireEvent.press(perfumesTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('products-tab-content')).toBeTruthy();
    });
  });
});
