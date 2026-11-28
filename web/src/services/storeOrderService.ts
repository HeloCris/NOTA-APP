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
  brand_name?: string;
  volume_ml?: number;
  product_image?: string | null;
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
  subtotal_amount?: string | number;
  discount_amount?: string | number;
  coupon_code?: string | null;
  total_amount: string | number;
  shipping_cost: string | number;
  shipping_service: string | null;
  shipping_address: StoreOrderShippingAddress | Record<string, unknown> | null;
  payment_method?: "PIX" | "CREDIT_CARD" | "PENDING" | string;
  payment_method_label?: string;
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
  customer_email?: string;
  customer_phone?: string | null;
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

export const ORDER_STATUS_LABELS: Record<StoreOrderStatus, string> = {
  PENDING: "Aguardando Pagto.",
  PAID: "Pagamento Aprovado",
  PROCESSING: "Em Separação",
  CANCEL_REQUESTED: "Cancel. Solicitado",
  SHIPPED: "Em Trânsito",
  DELIVERY_DISPUTED: "Entrega Contestada",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const ORDER_STATUS_STYLES: Record<
  StoreOrderStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    bg: "bg-[#FBF3E4]",
    text: "text-[#8B6220]",
    border: "border-[#E8D5B0]",
    dot: "bg-[#C4882A]",
  },
  PAID: {
    bg: "bg-[#EEF3F7]",
    text: "text-[#354B5E]",
    border: "border-[#CBD8E3]",
    dot: "bg-[#354B5E]",
  },
  PROCESSING: {
    bg: "bg-[#EEF3F7]",
    text: "text-[#354B5E]",
    border: "border-[#CBD8E3]",
    dot: "bg-[#354B5E]",
  },
  CANCEL_REQUESTED: {
    bg: "bg-[#FDF0EC]",
    text: "text-[#A24726]",
    border: "border-[#ECC8BC]",
    dot: "bg-[#A24726]",
  },
  SHIPPED: {
    bg: "bg-[#F0F4EC]",
    text: "text-[#4A583E]",
    border: "border-[#CED9C4]",
    dot: "bg-[#5C6B4E]",
  },
  DELIVERY_DISPUTED: {
    bg: "bg-[#FCECEC]",
    text: "text-[#9E2A2B]",
    border: "border-[#E8B8B8]",
    dot: "bg-[#9E2A2B]",
  },
  DELIVERED: {
    bg: "bg-[#EAF3E6]",
    text: "text-[#2E5425]",
    border: "border-[#B8D4AE]",
    dot: "bg-[#3A6B2E]",
  },
  CANCELLED: {
    bg: "bg-[#F4F1EA]",
    text: "text-[#6E685F]",
    border: "border-[#DCD6C8]",
    dot: "bg-[#8C857B]",
  },
  REFUNDED: {
    bg: "bg-[#F4F1EA]",
    text: "text-[#5A554E]",
    border: "border-[#DCD6C8]",
    dot: "bg-[#7A746C]",
  },
};

export function formatCurrencyBRL(value: string | number | undefined | null): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const apiBase = apiClient.defaults.baseURL ?? "http://127.0.0.1:8000/api/v1";
  const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, "");
  if (url.startsWith("/")) {
    return `${backendOrigin}${url}`;
  }
  return `${backendOrigin}/media/${url.replace(/^media\//, "")}`;
}

export function formatShippingAddress(
  addr: StoreOrderShippingAddress | Record<string, unknown> | string | null | undefined,
): string {
  if (!addr) return "Endereço de entrega não informado.";
  if (typeof addr === "string") return addr;
  const a = addr as StoreOrderShippingAddress;
  const street = a.street || a.shipping_street || "";
  const number = a.number || a.shipping_number || "";
  const complement = a.complement ? ` (${a.complement})` : "";
  const neighborhood = a.neighborhood || a.shipping_neighborhood || "";
  const city = a.city || a.shipping_city || "";
  const state = a.state || a.shipping_state || "";
  const zip = a.cep || a.zip_code || a.shipping_zip_code || "";

  const parts = [
    street ? `${street}${number ? `, ${number}` : ""}${complement}` : "",
    neighborhood,
    city && state ? `${city} - ${state}` : city || state,
    zip ? `CEP ${zip}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Endereço registrado no pedido.";
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
