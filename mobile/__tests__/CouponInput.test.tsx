import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CouponInput } from '../src/components/checkout/CouponInput';
import { storesService } from '../src/services/stores';

jest.mock('../src/services/stores', () => ({
  storesService: {
    validateCoupon: jest.fn(),
  },
}));

describe('CouponInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite digitar código e aplicar cupom com sucesso', async () => {
    const onCouponApplied = jest.fn();
    (storesService.validateCoupon as jest.Mock).mockResolvedValueOnce({
      valid: true,
      coupon_id: 1,
      code: 'VERAO10',
      discount_type: 'PERCENTAGE',
      discount_value: '10.00',
      applied_discount: '15.00',
      new_subtotal: '135.00',
    });

    const screen = await render(
      <CouponInput
        storeId={10}
        storeName="Maison D'Essence"
        subtotal={150}
        onCouponApplied={onCouponApplied}
      />
    );

    const input = screen.getByPlaceholderText('Digite seu cupom');
    fireEvent.changeText(input, 'VERAO10');

    await waitFor(() => {
      expect(input.props.value).toBe('VERAO10');
    });

    const applyBtn = screen.getByTestId('apply-coupon-btn');
    fireEvent.press(applyBtn);

    await waitFor(() => {
      expect(storesService.validateCoupon).toHaveBeenCalledWith({
        store_id: 10,
        code: 'VERAO10',
        subtotal: 150,
      });
      expect(onCouponApplied).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          code: 'VERAO10',
          applied_discount: '15.00',
        })
      );
      expect(screen.getByText('VERAO10')).toBeTruthy();
      expect(screen.getByText(/10% OFF/)).toBeTruthy();
    });
  });

  it('exibe mensagem de erro quando o cupom for inválido', async () => {
    const onCouponApplied = jest.fn();
    (storesService.validateCoupon as jest.Mock).mockResolvedValueOnce({
      valid: false,
      error: 'Este cupom já expirou.',
    });

    const screen = await render(
      <CouponInput
        storeId={10}
        subtotal={150}
        onCouponApplied={onCouponApplied}
      />
    );

    const input = screen.getByPlaceholderText('Digite seu cupom');
    fireEvent.changeText(input, 'EXPIRADO');

    await waitFor(() => {
      expect(input.props.value).toBe('EXPIRADO');
    });

    const applyBtn = screen.getByTestId('apply-coupon-btn');
    fireEvent.press(applyBtn);

    await waitFor(() => {
      expect(screen.getByText('Este cupom já expirou.')).toBeTruthy();
      expect(onCouponApplied).toHaveBeenCalledWith(null);
    });
  });
});
