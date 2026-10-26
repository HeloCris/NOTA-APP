import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import OrderDetailScreen from '@/app/(shop)/orders/[id]';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '105' }),
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-clipboard', () => ({
  __esModule: true,
  setStringAsync: jest.fn(),
}));

jest.mock('@/services/customerOrders', () => ({
  getCustomerOrder: jest.fn().mockResolvedValue({
    id: 105,
    status: 'SHIPPED',
    total_amount: '358.00',
    shipping_cost: '0.00',
    shipping_service: 'PAC',
    shipping_address: {},
    tracking_code: 'BR123456789X',
    carrier: 'Correios',
    created_at: '2026-09-22T09:12:00Z',
    updated_at: '2026-09-22T16:42:00Z',
    items: [],
    timeline: [
      { status: 'PENDING', label: 'Pedido criado', description: 'Seu pedido foi recebido.', date: '22 set. 2026, 09:12', completed: true, current: false },
      { status: 'PAID', label: 'Pagamento aprovado', description: 'Pagamento confirmado com sucesso.', date: '22 set. 2026, 09:14', completed: true, current: false },
      { status: 'PROCESSING', label: 'Em separação na loja', description: 'A loja preparou seus itens.', date: '22 set. 2026, 10:05', completed: true, current: false },
      { status: 'SHIPPED', label: 'Enviado pela transportadora', description: 'Sua encomenda está a caminho.', date: '22 set. 2026, 16:42', completed: true, current: true },
      { status: 'DELIVERED', label: 'Entregue', description: 'Aguardando a confirmação de entrega.', date: null, completed: false, current: false },
    ],
  }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = require('react-native');

  function MockIonicons({ name }: { name: string }) {
    return <Text>{name}</Text>;
  }

  return MockIonicons;
});

const mockSetStringAsync = jest.mocked(Clipboard.setStringAsync);

describe('Tela de detalhe do pedido - RF-14', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetStringAsync.mockResolvedValue(true);
  });

  it('renderiza o rastreio e a timeline no status enviado', async () => {
    const { getByText } = await render(<OrderDetailScreen />);

    await waitFor(() => {
      expect(getByText('Enviado')).toBeTruthy();
      expect(getByText('BR123456789X')).toBeTruthy();
      expect(getByText('Histórico do pedido')).toBeTruthy();
      expect(getByText('Enviado pela transportadora')).toBeTruthy();
      expect(getByText('Entregue')).toBeTruthy();
    });
  });

  it('copia o código de rastreio', async () => {
    const { getByLabelText } = await render(<OrderDetailScreen />);

    fireEvent.press(getByLabelText('Copiar código de rastreio'));

    expect(mockSetStringAsync).toHaveBeenCalledWith('BR123456789X');
  });
});