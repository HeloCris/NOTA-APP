import axios from 'axios';

// Substitua pela URL base da sua API Django / backend
const API_URL = 'http://localhost:8000/api/v1'; 

export interface CreateOrderPayload {
  store_id: string | string[];
  total_amount: string;
  shipping_cost: number;
  shipping_address: any;
  items: any[];
}

export interface ProcessPaymentPayload {
  order_id: number;
  payment_method: 'CREDIT_CARD' | 'PIX';
  payment_token?: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  const response = await axios.post(`${API_URL}/orders/`, payload);
  return response.data;
}

export async function processPayment(payload: ProcessPaymentPayload) {
  const response = await axios.post(`${API_URL}/payments/process/`, payload);
  return response.data;
}