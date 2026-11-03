import { api } from './api';

export type NotificationType =
  | 'NEW_ORDER'
  | 'NEW_MESSAGE'
  | 'CANCEL_REQUEST'
  | 'RETURN_REQUEST'
  | 'NEW_REVIEW'
  | 'LOW_STOCK'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_UPDATE';

export interface AppNotification {
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
  results: AppNotification[];
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

interface NotificationQuery {
  is_read?: boolean;
  page?: number;
  page_size?: number;
}

export async function listNotifications(
  params: NotificationQuery = {},
): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>('/notifications/', {
    params,
  });
  return response.data;
}

export async function markNotificationRead(
  notificationId: number,
): Promise<AppNotification> {
  const response = await api.patch<AppNotification>(
    `/notifications/${notificationId}/read/`,
  );
  return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all/');
}

export async function listConversations(): Promise<ChatConversation[]> {
  const response = await api.get<ChatConversation[]>('/chats/');
  return response.data;
}

export async function startConversation(
  storeId: number,
  orderId?: number,
): Promise<ChatConversation> {
  const response = await api.post<ChatConversation>('/chats/', {
    store_id: storeId,
    order_id: orderId,
  });
  return response.data;
}

export async function listMessages(
  conversationId: number,
  params: { since_id?: number; page?: number; page_size?: number } = {},
): Promise<PaginatedMessages> {
  const response = await api.get<PaginatedMessages>(
    `/chats/${conversationId}/messages/`,
    { params },
  );
  return response.data;
}

export async function sendChatMessage(
  conversationId: number,
  payload: { text?: string; imageUri?: string | null },
): Promise<ChatMessage> {
  const formData = new FormData();

  if (payload.text) {
    formData.append('text', payload.text);
  }

  if (payload.imageUri) {
    formData.append('attachment_image', {
      uri: payload.imageUri,
      name: `chat-${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  const response = await api.post<ChatMessage>(
    `/chats/${conversationId}/messages/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data;
}

export async function markConversationRead(
  conversationId: number,
): Promise<void> {
  await api.post(`/chats/${conversationId}/read/`);
}

export function resolveMediaUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = api.defaults.baseURL ?? '';
  const origin = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}
