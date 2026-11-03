export type NotificationType =
  | "NEW_ORDER"
  | "NEW_MESSAGE"
  | "CANCEL_REQUEST"
  | "RETURN_REQUEST"
  | "NEW_REVIEW"
  | "LOW_STOCK"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_UPDATE";

export interface NotificationItem {
  id: number;
  user: number | null;
  store: number | null;
  title: string;
  message: string;
  type: NotificationType;
  target_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
  unread_count: number;
}

export interface ChatOrderSummary {
  id: number;
  number: string;
  status: string;
  total_amount: string | number;
}

export interface ChatConversation {
  id: number;
  customer: number;
  store: number;
  customer_name: string;
  store_name: string;
  order: ChatOrderSummary | null;
  updated_at: string;
  created_at: string;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  conversation: number;
  sender_id: number;
  sender_name: string;
  text: string;
  attachment_image: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export interface NotificationQuery {
  is_read?: boolean;
  page?: number;
  page_size?: number;
}
