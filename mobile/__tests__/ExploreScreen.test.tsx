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
  useGlobalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('../src/services/stores', () => ({
  storesService: {
    getStores: jest.fn(),
    getProducts: jest.fn(),
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

const mockApiProducts = [
  {
    id: 101,
    name: 'Santal Majestueux',
    brand: { id: 1, name: 'Maison Luxe' },
    olfactory_family: 'Amadeirado',
    available_volumes: [10, 50, 100],
    min_price: 60.0,
    top_notes: ['Cardamomo'],
    heart_notes: ['Íris'],
    base_notes: ['Sândalo'],
  },
  {
    id: 102,
    name: 'Rose Éternelle',
    brand: { id: 2, name: 'Fleuriste Paris' },
    olfactory_family: 'Floral',
    available_volumes: [100],
    min_price: 350.0,
    top_notes: ['Lichia'],
    heart_notes: ['Rosa'],
    base_notes: ['Almíscar'],
  },
  {
    id: 103,
    name: 'Ambre Nocturne',
    brand: { id: 3, name: 'Atelier Oriental' },
    olfactory_family: 'Oriental',
    available_volumes: [5, 10, 50],
    min_price: 85.0,
    top_notes: ['Canela'],
    heart_notes: ['Âmbar'],
    base_notes: ['Baunilha'],
  },
];

describe('ExploreScreen (Integração com Parâmetros de URL e Dados Reais - RF-21 / Médio 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    (storesService.getStores as jest.Mock).mockResolvedValue(mockStores);
    (storesService.getProducts as jest.Mock).mockImplementation((params) => {
      if (params?.olfactory_family) {
        return Promise.resolve(
          mockApiProducts.filter(
            (p) => p.olfactory_family.toLowerCase() === params.olfactory_family.toLowerCase()
          )
        );
      }
      return Promise.resolve(mockApiProducts);
    });
  });

  it('aplica filtro de família olfativa consultando a API e navegando com ID real (RN-05, CA-03)', async () => {
    mockSearchParams = { family: 'Oriental' };

    const screen = await render(<ExploreScreen />);

    // Deve exibir o badge do filtro ativo de família
    expect(screen.getByTestId('active-family-filter')).toBeTruthy();
    expect(screen.getByText('Família: Oriental')).toBeTruthy();

    // Consulta na API com o filtro de família
    expect(storesService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ olfactory_family: 'Oriental' })
    );

    // Deve exibir o perfume retornado pela API para Oriental (Ambre Nocturne) e não exibir Floral
    await waitFor(() => {
      expect(screen.getByText('Ambre Nocturne')).toBeTruthy();
      expect(screen.queryByText('Rose Éternelle')).toBeNull();
    });

    // Toque no botão de detalhes navega para o ID real do produto (/product/103)
    const detailsBtn = screen.getByTestId('product-btn-103');
    fireEvent.press(detailsBtn);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/product/[id]',
      params: { id: '103' },
    });
  });

  it('aplica filtro de decants exibindo apenas produtos com volumetria <= 15ml (RN-06, CA-04)', async () => {
    mockSearchParams = { type: 'decant' };

    const screen = await render(<ExploreScreen />);

    // Deve exibir o badge do filtro ativo de tipo
    expect(screen.getByTestId('active-type-filter')).toBeTruthy();
    expect(screen.getByText('Tipo: Decants')).toBeTruthy();

    await waitFor(() => {
      // Perfumes com decants disponíveis (<= 15ml) devem ser exibidos
      expect(screen.getByText('Santal Majestueux')).toBeTruthy();
      expect(screen.getByText('Ambre Nocturne')).toBeTruthy();
      // Perfume com apenas 100ml NÃO deve aparecer
      expect(screen.queryByText('Rose Éternelle')).toBeNull();
    });
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
