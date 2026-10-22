import { api } from './api';

export interface CreateOrderPayload {
  store_id: string | number;
  total_amount: string;
  shipping_cost: number;
  shipping_service?: string;
  shipping_address: any;
  items: any[];
}

export interface ProcessPaymentPayload {
  order_id: number;
  payment_method: 'CREDIT_CARD' | 'PIX';
  payment_token?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  const response = await api.post('/orders/', payload);
  return response.data;
}

export async function processPayment(payload: ProcessPaymentPayload) {
  const response = await api.post('/payments/process/', payload);
  return response.data;
}