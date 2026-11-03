import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreHero } from '../src/components/store/StoreHero';
import { storesService, Store } from '../src/services/stores';

jest.mock('../src/services/stores', () => ({
  storesService: {
    toggleFollow: jest.fn(),
  },
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

const mockStore: Store = {
  id: 5,
  name: 'Perfumaria Elegance',
  slug: 'perfumaria-elegance',
  is_active: true,
  vacation_mode: false,
  is_following: false,
  followers_count: 10,
};

describe('FollowStoreButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('alterna o estado de Seguir para Seguindo e incrementa o contador', async () => {
    (storesService.toggleFollow as jest.Mock).mockResolvedValueOnce({
      is_following: true,
      followers_count: 11,
    });

    const screen = await render(<StoreHero store={mockStore} />);

    const followBtn = screen.getByText('Seguir');
    expect(followBtn).toBeTruthy();

    fireEvent.press(followBtn);

    await waitFor(() => {
      expect(storesService.toggleFollow).toHaveBeenCalledWith(5);
      expect(screen.getByText('Seguindo')).toBeTruthy();
    });
  });

  it('alterna de Seguindo para Seguir quando já está seguindo', async () => {
    (storesService.toggleFollow as jest.Mock).mockResolvedValueOnce({
      is_following: false,
      followers_count: 10,
    });

    const followingStore: Store = {
      ...mockStore,
      is_following: true,
      followers_count: 11,
    };

    const screen = await render(<StoreHero store={followingStore} />);

    const followingBtn = screen.getByText('Seguindo');
    expect(followingBtn).toBeTruthy();

    fireEvent.press(followingBtn);

    await waitFor(() => {
      expect(storesService.toggleFollow).toHaveBeenCalledWith(5);
      expect(screen.getByText('Seguir')).toBeTruthy();
    });
  });
});
