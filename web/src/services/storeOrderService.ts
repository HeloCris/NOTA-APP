import { apiClient } from "../lib/apiClient";

export type StoreOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type UrgencyStatus = "ON_TIME" | "DUE_TODAY" | "DELAYED";

export interface StoreOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
}

export interface StoreOrderShippingAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

export interface StoreOrder {
  id: number;
  status: StoreOrderStatus;
  total_amount: string;
  shipping_cost: string;
  shipping_service: string | null;
  shipping_address: StoreOrderShippingAddress | null;
  tracking_code: string | null;
  carrier: string | null;
  created_at: string;
  customer_name: string;
  items: StoreOrderItem[];
  dispatch_deadline: string;
  urgency_status: UrgencyStatus | null;
  is_delayed: boolean;
}

export const storeOrderService = {
  getOrders: async (
    status?: StoreOrderStatus | "ALL",
  ): Promise<StoreOrder[]> => {
    const params =
      status && status !== "ALL" ? { status } : undefined;
    const response = await apiClient.get<StoreOrder[]>(
      "/store/orders/",
      { params },
    );
    return response.data;
  },

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
};
