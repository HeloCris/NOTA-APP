import { api } from './api';

export type CustomerOrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'CANCEL_REQUESTED'
  | 'SHIPPED'
  | 'DELIVERY_DISPUTED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type DeliveryConfirmedBy = 'CUSTOMER' | 'SELLER' | 'SYSTEM';

export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'REJECTED';

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
  total_price?: string;
};

export type OrderStatusHistoryItem = {
  id: number;
  from_status: CustomerOrderStatus;
  to_status: CustomerOrderStatus;
  actor_name?: string;
  reason?: string;
  created_at: string;
};

export type ReturnPhoto = {
  id: number;
  image: string;
};

export type ReturnItem = {
  id: number;
  order_item: number;
  product_name: string;
  quantity: number;
  unit_price: string;
};

export type ReturnRequest = {
  id: number;
  order: number;
  status: ReturnStatus;
  reason: string;
  description?: string;
  return_tracking_code?: string;
  resellable?: boolean | null;
  refund_amount: string;
  items: ReturnItem[];
  photos?: ReturnPhoto[];
  created_at: string;
  updated_at: string;
};

export type CustomerOrderAddress = {
  shipping_street?: string;
  shipping_number?: string;
  shipping_neighborhood?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip_code?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
};

export type CustomerOrder = {
  id: number;
  code?: string;
  status: CustomerOrderStatus;
  total_amount: string;
  shipping_cost: string;
  shipping_service: string | null;
  shipping_address: CustomerOrderAddress | Record<string, any>;
  tracking_code: string | null;
  carrier: string | null;
  carrier_url?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  delivery_confirmed_by?: DeliveryConfirmedBy | null;
  address_changed?: boolean;
  cancel_reason?: string;
  cancel_requested_at?: string | null;
  created_at: string;
  updated_at: string;
  items: CustomerOrderItem[];
};

export type CustomerOrderDetail = CustomerOrder & {
  timeline?: OrderTimelineStep[];
  status_history?: OrderStatusHistoryItem[];
  return_requests?: ReturnRequest[];
};

type CustomerOrdersResponse =
  | CustomerOrder[]
  | {
      results?: CustomerOrder[];
    };

/**
 * Busca a lista de pedidos do cliente autenticado.
 * Trata retornos tanto em Array direto quanto paginado do DRF ({ results: [...] }).
 */
export async function listCustomerOrders(): Promise<CustomerOrder[]> {
  const response = await api.get<CustomerOrdersResponse>('/orders/');
  const data = response.data;

  return Array.isArray(data) ? data : data.results ?? [];
}

// Alias para compatibilidade de nomeação
export const getCustomerOrders = listCustomerOrders;

/**
 * Busca os detalhes de um pedido específico com linha do tempo e histórico.
 */
export async function getCustomerOrder(
  id: string | number
): Promise<CustomerOrderDetail> {
  const response = await api.get<CustomerOrderDetail>(`/orders/${id}/`);
  return response.data;
}

// Alias para compatibilidade de nomeação
export const getCustomerOrderById = getCustomerOrder;

/**
 * Cancela o pedido (PENDING/PAID) ou solicita cancelamento à loja (PROCESSING).
 */
export async function cancelCustomerOrder(
  id: string | number,
  reason: string
): Promise<{ status: CustomerOrderStatus; message?: string }> {
  const response = await api.post(`/orders/${id}/cancel/`, { reason });
  return response.data;
}

/**
 * Altera o endereço de entrega do pedido (somente mesma Cidade/UF, até PROCESSING).
 */
export async function updateCustomerAddress(
  id: string | number,
  address: CustomerOrderAddress | Record<string, any>
): Promise<{ address_changed: boolean; shipping_address: any; message?: string }> {
  const response = await api.patch(`/orders/${id}/address/`, address);
  return response.data;
}

/**
 * Confirma o recebimento do pedido ("Recebi meu pedido", SHIPPED -> DELIVERED).
 */
export async function confirmCustomerDelivery(
  id: string | number
): Promise<{ status: CustomerOrderStatus; delivered_at: string; message?: string }> {
  const response = await api.post(`/orders/${id}/confirm-delivery/`);
  return response.data;
}

/**
 * Contesta a entrega realizada pelo lojista ("Não recebi meu pedido").
 */
export async function disputeCustomerDelivery(
  id: string | number,
  reason?: string
): Promise<{ status: CustomerOrderStatus; message?: string }> {
  const response = await api.post(`/orders/${id}/dispute-delivery/`, { reason });
  return response.data;
}

/**
 * Solicita devolução parcial ou total do pedido (até 7 dias após entrega).
 * Envia FormData com motivo, descrição, itens e fotos.
 */
export async function requestCustomerReturn(orderId: string, formData: FormData) {
  const response = await api.post(`/orders/${orderId}/return/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}