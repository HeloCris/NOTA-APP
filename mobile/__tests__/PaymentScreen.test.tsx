import React from 'react';
import { render, fireEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import PaymentScreen from '../src/app/checkout/payment';
import * as ordersService from '../src/services/orders';
import * as cardStorage from '../src/utils/cardStorage';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({
    store_id: '1',
    address: JSON.stringify({ street: 'Rua Teste', number: '123' }),
    cartItems: JSON.stringify([{ store_product_id: 1, quantity: 1, unit_price: 100 }]),
  }),
}));

jest.mock('../src/services/orders');
jest.mock('../src/utils/cardStorage', () => ({
  getSavedCards: jest.fn(() => Promise.resolve([])),
  addOrUpdateCard: jest.fn(() => Promise.resolve([])),
  saveCards: jest.fn(() => Promise.resolve()),
}));

describe('PaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cardStorage.getSavedCards as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('alterna entre as abas PIX e Cartão corretamente', async () => {
    const screen = await render(<PaymentScreen />);

    expect(screen.getByText('Número do cartão')).toBeTruthy();

    fireEvent.press(screen.getByText('Pix'));

    const pixButton = await screen.findByText('Já realizei o pagamento');
    expect(pixButton).toBeTruthy();
  });

  it('dispara a criação de pedido e pagamento ao submeter cartão', async () => {
    (ordersService.createOrder as jest.Mock).mockResolvedValue({ order_id: 123 });
    (ordersService.processPayment as jest.Mock).mockResolvedValue({ status: 'PAID' });

    const screen = await render(<PaymentScreen />);

    const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    const nameInput = screen.getByPlaceholderText('COMO IMPRESSO NO CARTÃO');
    const expInput = screen.getByPlaceholderText('MM/AA');
    const cvvInput = screen.getByPlaceholderText('•••');
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');

    await act(async () => {
      fireEvent.changeText(cardInput, '4532123456781234');
    });
    await act(async () => {
      fireEvent.changeText(nameInput, 'JOAO DA SILVA');
    });
    await act(async () => {
      fireEvent.changeText(expInput, '12/28');
    });
    await act(async () => {
      fireEvent.changeText(cvvInput, '321');
    });
    await act(async () => {
      fireEvent.changeText(cpfInput, '12345678909');
    });

    expect(cardInput.props.value).toBe('4532 1234 5678 1234');
    expect(nameInput.props.value).toBe('JOAO DA SILVA');
    expect(expInput.props.value).toBe('12/28');
    expect(cvvInput.props.value).toBe('321');
    expect(cpfInput.props.value).toBe('123.456.789-09');

    fireEvent.press(screen.getByText(/Pagar R\$/));

    await waitFor(() => {
      expect(ordersService.createOrder).toHaveBeenCalledTimes(1);
      expect(ordersService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ order_id: 123, payment_method: 'CREDIT_CARD' })
      );
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it('não dispara a criação de pedido ao submeter formulário com campos vazios', async () => {
    const screen = await render(<PaymentScreen />);

    const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    expect(cardInput).toBeTruthy();

    const payBtn = screen.getByText(/Pagar R\$/);
    fireEvent.press(payBtn);

    expect(ordersService.createOrder).not.toHaveBeenCalled();
  });

  it('permite preencher dados de teste com um clique e submeter o pagamento', async () => {
    (ordersService.createOrder as jest.Mock).mockResolvedValue({ order_id: 456 });
    (ordersService.processPayment as jest.Mock).mockResolvedValue({ status: 'PAID' });

    const screen = await render(<PaymentScreen />);

    const cardInput = screen.getByPlaceholderText('0000 0000 0000 0000');
    expect(cardInput).toBeTruthy();

    const fillTestBtn = screen.getByText('Preencher dados de teste');
    fireEvent.press(fillTestBtn);

    await waitFor(() => {
      expect(cardInput.props.value).toBe('4532 1234 5678 1234');
    });

    const payBtn = screen.getByText(/Pagar R\$/);
    fireEvent.press(payBtn);

    await waitFor(() => {
      expect(ordersService.createOrder).toHaveBeenCalledTimes(1);
      expect(ordersService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ order_id: 456, payment_method: 'CREDIT_CARD' })
      );
      expect(mockReplace).toHaveBeenCalled();
    });
  });
});