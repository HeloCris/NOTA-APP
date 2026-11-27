import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import NotificationsScreen from '@/app/notifications';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/communication';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, canGoBack: () => true, replace: jest.fn() }),
  useFocusEffect: (cb: any) => {
    const React = require('react');
    const ran = React.useRef(false);
    React.useEffect(() => {
      if (!ran.current) {
        ran.current = true;
        return cb();
      }
    }, []);
  },
}));

jest.mock('@/services/communication', () => ({
  listNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  markAllNotificationsRead: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

const mockListNotifications = jest.mocked(listNotifications);
const mockMarkNotificationRead = jest.mocked(markNotificationRead);
const mockMarkAllNotificationsRead = jest.mocked(
  markAllNotificationsRead,
);

describe('NotificationsScreen - RF-18.8', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = 'active';

    mockListNotifications.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      unread_count: 1,
      results: [
        {
          id: 1,
          user: 10,
          store: null,
          title: 'Pedido despachado',
          message: 'Seu pedido #105 foi enviado.',
          type: 'ORDER_SHIPPED',
          target_url: '/(shop)/orders/105',
          is_read: false,
          created_at: '2026-11-02T10:00:00Z',
        },
      ],
    });

    mockMarkNotificationRead.mockResolvedValue({
      id: 1,
      user: 10,
      store: null,
      title: 'Pedido despachado',
      message: 'Seu pedido #105 foi enviado.',
      type: 'ORDER_SHIPPED',
      target_url: '/(shop)/orders/105',
      is_read: true,
      created_at: '2026-11-02T10:00:00Z',
    });

    mockMarkAllNotificationsRead.mockResolvedValue();
  });

  it('lista, marca como lida e navega ao tocar na notificação', async () => {
    const { getByText, getByLabelText } = await render(
      <NotificationsScreen />,
    );

    await waitFor(() => {
      expect(getByText('Pedido despachado')).toBeTruthy();
      expect(getByText('Seu pedido #105 foi enviado.')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(
        getByLabelText('Notificação: Pedido despachado'),
      );
    });

    await waitFor(() => {
      expect(mockMarkNotificationRead).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalledWith('/(shop)/orders/105');
    });
  });

  it('marca todas as notificações como lidas', async () => {
    const { getByLabelText, queryByText } = await render(
      <NotificationsScreen />,
    );

    await waitFor(() => {
      expect(getByLabelText('Marcar todas como lidas')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByLabelText('Marcar todas como lidas'));
    });

    await waitFor(() => {
      expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
      expect(queryByText('Marcar lidas')).toBeNull();
    });
  });
});