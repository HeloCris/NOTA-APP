import { fireEvent, render } from '@testing-library/react-native';
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

const mockSetStringAsync = jest.mocked(Clipboard.setStringAsync);

describe('Tela de detalhe do pedido - RF-14', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetStringAsync.mockResolvedValue(true);
  });

  it('renderiza o rastreio e a timeline no status enviado', async () => {
    const { getByText } = await render(<OrderDetailScreen />);

    expect(getByText('Enviado')).toBeTruthy();
    expect(getByText('BR123456789X')).toBeTruthy();
    expect(getByText('Histórico do pedido')).toBeTruthy();
    expect(getByText('Enviado pela transportadora')).toBeTruthy();
    expect(getByText('Entregue')).toBeTruthy();
  });

  it('copia o código de rastreio', async () => {
    const { getByLabelText } = await render(<OrderDetailScreen />);

    fireEvent.press(getByLabelText('Copiar código de rastreio'));

    expect(mockSetStringAsync).toHaveBeenCalledWith('BR123456789X');
  });
});