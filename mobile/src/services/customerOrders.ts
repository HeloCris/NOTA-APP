import { api } from './api';

export type CustomerOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderTimelineStep = {
  status: CustomerOrderStatus;
  label: string;
  description: string;
  date: string | null;
  completed: boolean;
  current: boolean;
};

export type CustomerOrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
};

export type CustomerOrder = {
  id: number;
  status: CustomerOrderStatus;
  total_amount: string;
  shipping_cost: string;
  shipping_service: string | null;
  shipping_address: Record<string, string>;
  tracking_code: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
  items: CustomerOrderItem[];
};

export type CustomerOrderDetail = CustomerOrder & {
  timeline: OrderTimelineStep[];
};

export async function listCustomerOrders(): Promise<CustomerOrder[]> {
  const response = await api.get<CustomerOrder[]>('/orders/');
  return response.data;
}

export async function getCustomerOrder(id: string | number): Promise<CustomerOrderDetail> {
  const response = await api.get<CustomerOrderDetail>(`/orders/${id}/`);
  return response.data;
}
