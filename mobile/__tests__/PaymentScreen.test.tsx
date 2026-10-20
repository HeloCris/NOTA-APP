import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaymentScreen from '../src/app/(shop)/checkout/payment';
import * as ordersService from '../src/services/orders';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => ({
    store_id: '1',
    address: JSON.stringify({ street: 'Rua Teste', number: '123' }),
    cartItems: JSON.stringify([{ store_product_id: 1, quantity: 1, unit_price: 100 }]),
  }),
}));

jest.mock('../src/services/orders');

describe('PaymentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('alterna entre as abas PIX e Cartão corretamente', async () => {
    const screen = render(<PaymentScreen />);

    expect((await screen).getByText('Número do Cartão')).toBeTruthy();

    fireEvent.press((await screen).getByText('⚡ PIX'));

    const pixButton = await (await screen).findByText('Simular Pagamento PIX Aprovado');
    expect(pixButton).toBeTruthy();
  });

  it('dispara a criação de pedido e pagamento ao submeter cartão', async () => {
    (ordersService.createOrder as jest.Mock).mockResolvedValue({ order_id: 123 });
    (ordersService.processPayment as jest.Mock).mockResolvedValue({ status: 'PAID' });

    const screen = render(<PaymentScreen />);

    const cardInput = (await screen).getByPlaceholderText('0000 0000 0000 0000');
    const nameInput = (await screen).getByPlaceholderText('NOME COMO NO CARTÃO');
    const expInput = (await screen).getByPlaceholderText('MM/AA');
    const cvvInput = (await screen).getByPlaceholderText('123');

    fireEvent.changeText(cardInput, '4532123456781234');
    fireEvent.changeText(nameInput, 'JOAO DA SILVA');
    fireEvent.changeText(expInput, '12/28');
    fireEvent.changeText(cvvInput, '321');

    await waitFor(() => {
      expect(cardInput.props.value).toBe('4532 1234 5678 1234');
      expect(nameInput.props.value).toBe('JOAO DA SILVA');
      expect(expInput.props.value).toBe('12/28');
      expect(cvvInput.props.value).toBe('321');
    });

    fireEvent.press((await screen).getByText('Finalizar Pagamento ✓'));

    await waitFor(() => {
      expect(ordersService.createOrder).toHaveBeenCalledTimes(1);
      expect(ordersService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ order_id: 123, payment_method: 'CREDIT_CARD' })
      );
    });
  });
});