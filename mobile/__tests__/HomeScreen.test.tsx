import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ShopIndex from '../src/app/(shop)/index';
import { storesService, HomeFeedResponse } from '../src/services/stores';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUser = {
  id: 1,
  first_name: 'Letícia',
  email: 'leticia@nota.com',
};

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

jest.mock('../src/hooks/use-unread-notifications', () => ({
  useUnreadNotifications: () => ({
    unreadCount: 2,
  }),
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('../src/services/stores', () => ({
  storesService: {
    getHomeFeed: jest.fn(),
  },
}));

const mockFeedData: HomeFeedResponse = {
  has_olfactory_profile: true,
  user_summary: {
    olfactory_families: ['Amadeirado'],
    preferred_notes: ['Sândalo'],
  },
  featured_stores: [
    {
      id: 10,
      name: 'Maison Noire',
      slug: 'maison-noire',
      logo_url: 'https://cdn.test/logo.jpg',
      city: 'São Paulo',
      state: 'SP',
      is_official: true,
      followers_count: 50,
      rating: 4.9,
      reviews_count: 28,
    },
  ],
  recommended_products: [
    {
      id: 101,
      name: 'Santal Blanc',
      brand_name: 'Niche Parfums',
      brand_id: 2,
      olfactory_family: 'Amadeirado',
      min_price: 45.0,
      has_decant: true,
      match_percentage: 92,
      sold_count: 20,
    },
  ],
  decant_highlights: [
    {
      id: 101,
      name: 'Santal Blanc',
      brand_name: 'Niche Parfums',
      olfactory_family: 'Amadeirado',
      min_price: 45.0,
      has_decant: true,
      match_percentage: 92,
      sold_count: 20,
    },
  ],
};

describe('ShopIndex (Home Dinâmica - RF-21)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza saudação com nome real, inicial e dados do feed', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce(mockFeedData);

    const screen = await render(<ShopIndex />);

    // Header dinâmico
    expect(screen.getByText(/Olá, Letícia/)).toBeTruthy();
    expect(screen.getByText('L')).toBeTruthy();

    // Loja em destaque
    await waitFor(() => {
      expect(screen.getByText('Maison Noire')).toBeTruthy();
      expect(screen.getByText(/4\.9/)).toBeTruthy();
    });

    // Produto da seção "Para Você"
    await waitFor(() => {
      expect(screen.getAllByText('Santal Blanc').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/✨ 92% Match/)).toBeTruthy();
      expect(screen.getAllByText(/A partir de R\$ 45,00/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('navega para a loja ao tocar no card da loja em destaque', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce(mockFeedData);

    const screen = await render(<ShopIndex />);

    await waitFor(() => {
      expect(screen.getByTestId('store-card-10')).toBeTruthy();
    });

    const storeCard = screen.getByTestId('store-card-10');
    fireEvent.press(storeCard);

    expect(mockPush).toHaveBeenCalledWith('/store/10');
  });

  it('navega para o produto ao tocar no card de produto', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce(mockFeedData);

    const screen = await render(<ShopIndex />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-101')).toBeTruthy();
    });

    const productCard = screen.getByTestId('product-card-101');
    fireEvent.press(productCard);

    expect(mockPush).toHaveBeenCalledWith('/product/101');
  });

  it('navega para a aba de busca ao tocar em uma família olfativa das 7 categorias', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce(mockFeedData);

    const screen = await render(<ShopIndex />);

    const woodyCategory = screen.getByTestId('category-Amadeirado');
    fireEvent.press(woodyCategory);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(shop)/explore',
      params: { family: 'Amadeirado' },
    });
  });

  it('navega para busca por decants ao tocar no banner de decants', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce(mockFeedData);

    const screen = await render(<ShopIndex />);

    const decantBanner = screen.getByTestId('banner-decants');
    fireEvent.press(decantBanner);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(shop)/explore',
      params: { type: 'decant' },
    });
  });

  it('exibe card de convite para preencher perfil olfativo quando has_olfactory_profile=false', async () => {
    (storesService.getHomeFeed as jest.Mock).mockResolvedValueOnce({
      ...mockFeedData,
      has_olfactory_profile: false,
    });

    const screen = await render(<ShopIndex />);

    await waitFor(() => {
      expect(screen.getByTestId('olfactory-invite-card')).toBeTruthy();
      expect(screen.getByText('Descubra seu Match Olfativo')).toBeTruthy();
    });

    const setupBtn = screen.getByTestId('setup-profile-btn');
    fireEvent.press(setupBtn);

    expect(mockPush).toHaveBeenCalledWith('/(shop)/account/edit-olfactory-profile');
  });
});
