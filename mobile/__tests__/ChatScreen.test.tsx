import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import ChatScreen from '@/app/(shop)/chat/[id]';
import {
  listConversations,
  listMessages,
  markConversationRead,
  sendChatMessage,
} from '@/services/communication';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 10, first_name: 'Maria' } }),
}));

jest.mock('@/services/communication', () => ({
  listConversations: jest.fn(),
  listMessages: jest.fn(),
  markConversationRead: jest.fn(),
  sendChatMessage: jest.fn(),
  resolveMediaUrl: (url: string | null) => url,
}));

jest.mock(
  'expo-image-picker',
  () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images' },
  }),
  { virtual: true },
);

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
  };
});

const mockListConversations = jest.mocked(listConversations);
const mockListMessages = jest.mocked(listMessages);
const mockMarkConversationRead = jest.mocked(markConversationRead);
const mockSendChatMessage = jest.mocked(sendChatMessage);

describe('ChatScreen - RF-18.7', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockListConversations.mockResolvedValue([
      {
        id: 1,
        customer: 10,
        store: 7,
        customer_name: 'Maria Silva',
        store_name: 'Essência & Arte',
        order: {
          id: 105,
          number: '#105',
          status: 'PROCESSING',
          total_amount: '199.90',
        },
        updated_at: '2026-11-02T10:00:00Z',
        created_at: '2026-11-02T09:00:00Z',
        unread_count: 0,
      },
    ]);

    mockListMessages.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          conversation: 1,
          sender_id: 10,
          sender_name: 'Maria Silva',
          text: 'Olá, vocês têm previsão de despacho?',
          attachment_image: null,
          is_read: true,
          created_at: '2026-11-02T09:10:00Z',
        },
      ],
    });

    mockMarkConversationRead.mockResolvedValue();
    mockSendChatMessage.mockResolvedValue({
      id: 2,
      conversation: 1,
      sender_id: 10,
      sender_name: 'Maria Silva',
      text: 'Postamos amanhã!',
      attachment_image: null,
      is_read: false,
      created_at: '2026-11-02T10:00:00Z',
    });
  });

  it('renderiza o card do pedido e envia uma mensagem', async () => {
    const { getByText, getByPlaceholderText, getByLabelText } = await render(
      <ChatScreen />,
    );

    await waitFor(() => {
      expect(getByText('Referente ao Pedido #105')).toBeTruthy();
      expect(
        getByText('Olá, vocês têm previsão de despacho?'),
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(
        getByPlaceholderText('Escreva uma mensagem...'),
        'Postamos amanhã!',
      );
    });

    await act(async () => {
      fireEvent.press(getByLabelText('Enviar mensagem'));
    });

    await waitFor(() => {
      expect(mockSendChatMessage).toHaveBeenCalledWith(1, {
        text: 'Postamos amanhã!',
        imageUri: null,
      });
    });
  });
});
