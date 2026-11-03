import { apiClient } from "../lib/apiClient";

export type StoreOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "CANCEL_REQUESTED"
  | "SHIPPED"
  | "DELIVERY_DISPUTED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type DeliveryConfirmedBy = "CUSTOMER" | "SELLER" | "SYSTEM";

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "RECEIVED"
  | "REFUNDED"
  | "REJECTED";

export type UrgencyStatus = "ON_TIME" | "DUE_TODAY" | "DELAYED";

export interface StoreOrderItem {
  id: number;
  store_product?: number;
  product_name: string;
  quantity: number;
  unit_price: string | number;
  total_price?: string | number;
}

export interface StoreOrderShippingAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  zip_code?: string;
  shipping_street?: string;
  shipping_number?: string;
  shipping_neighborhood?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip_code?: string;
}

export interface OrderStatusHistoryItem {
  id: number;
  from_status: StoreOrderStatus;
  to_status: StoreOrderStatus;
  actor?: number | null;
  actor_name?: string;
  reason?: string;
  created_at: string;
}

export interface ReturnPhoto {
  id: number;
  image: string;
}

export interface ReturnItem {
  id: number;
  order_item: number;
  product_name: string;
  quantity: number;
  unit_price: string | number;
}

export interface ReturnRequest {
  id: number;
  order: number;
  status: ReturnStatus;
  reason: string;
  description?: string;
  return_tracking_code?: string;
  resellable?: boolean | null;
  refund_amount: string | number;
  items: ReturnItem[];
  photos?: ReturnPhoto[];
  created_at: string;
  updated_at: string;
}

export interface StoreOrder {
  id: number;
  code?: string;
  status: StoreOrderStatus;
  total_amount: string | number;
  shipping_cost: string | number;
  shipping_service: string | null;
  shipping_address: StoreOrderShippingAddress | Record<string, any> | null;
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
  updated_at?: string;
  customer_name: string;
  items: StoreOrderItem[];
  dispatch_deadline?: string;
  urgency_status?: UrgencyStatus | null;
  is_delayed?: boolean;
  status_history?: OrderStatusHistoryItem[];
  return_requests?: ReturnRequest[];
}

export interface ShipOrderData {
  carrier: string;
  tracking_code: string;
  carrier_url?: string;
}

export const storeOrderService = {
  /**
   * Lista os pedidos da loja com filtro opcional por status.
   */
  getOrders: async (
    status?: StoreOrderStatus | "ALL",
  ): Promise<StoreOrder[]> => {
    const params = status && status !== "ALL" ? { status } : undefined;
    const response = await apiClient.get<StoreOrder[]>("/store/orders/", {
      params,
    });
    return response.data;
  },

  /**
   * Obtém os detalhes completos de um pedido da loja (itens, histórico, devoluções).
   */
  getOrderDetail: async (orderId: number | string): Promise<StoreOrder> => {
    const response = await apiClient.get<StoreOrder>(
      `/store/orders/${orderId}/`,
    );
    return response.data;
  },

  /**
   * Atualiza o status do pedido (ex: PAID -> PROCESSING).
   */
  updateOrderStatus: async (
    orderId: number,
    status: StoreOrderStatus,
  ): Promise<StoreOrder> => {
    const response = await apiClient.patch<StoreOrder>(
      `/store/orders/${orderId}/status/`,
      { status },
    );
    return response.data;
  },

  /**
   * Despacha o pedido informando transportadora e código de rastreio.
   */
  shipOrder: async (
    orderId: number,
    data: ShipOrderData,
  ): Promise<StoreOrder> => {
    const response = await apiClient.patch<StoreOrder>(
      `/store/orders/${orderId}/ship/`,
      data,
    );
    return response.data;
  },

  /**
   * Lojista cancela diretamente o pedido em PAID ou PROCESSING com motivo obrigatório.
   */
  cancelOrder: async (
    orderId: number,
    reason: string,
  ): Promise<{ status: StoreOrderStatus; message?: string }> => {
    const response = await apiClient.post(
      `/store/orders/${orderId}/cancel/`,
      { reason },
    );
    return response.data;
  },

  /**
   * Lojista aprova ou recusa a solicitação de cancelamento feita pelo cliente (CANCEL_REQUESTED).
   */
  respondCancelRequest: async (
    orderId: number,
    approve: boolean,
    reason?: string,
  ): Promise<{ status: StoreOrderStatus; message?: string }> => {
    const action = approve ? "approve" : "reject";
    const response = await apiClient.post(
      `/store/orders/${orderId}/cancel-request/${action}/`,
      { reason },
    );
    return response.data;
  },

  /**
   * Lojista marca o pedido despachado como entregue (DELIVERED).
   */
  markDelivered: async (
    orderId: number,
  ): Promise<{
    status: StoreOrderStatus;
    delivered_at?: string;
    message?: string;
  }> => {
    const response = await apiClient.post(
      `/store/orders/${orderId}/mark-delivered/`,
    );
    return response.data;
  },

  /**
   * Lojista resolve a contestação do cliente ("Não recebi") via Reenvio ou Reembolso.
   */
  resolveDispute: async (
    orderId: number,
    action: "reship" | "refund",
    trackingCode?: string,
  ): Promise<{ status: StoreOrderStatus; message?: string }> => {
    const response = await apiClient.post(
      `/store/orders/${orderId}/dispute/${action}/`,
      { tracking_code: trackingCode },
    );
    return response.data;
  },

  /**
   * Lojista aprova, recusa ou confirma o recebimento de uma devolução parcial/total.
   */
  processReturn: async (
    returnId: number,
    action: "approve" | "reject" | "receive",
    payload?: { reason?: string; resellable?: boolean },
  ): Promise<ReturnRequest> => {
    const response = await apiClient.post<ReturnRequest>(
      `/store/returns/${returnId}/${action}/`,
      payload,
    );
    return response.data;
  },
};