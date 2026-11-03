import { apiClient } from "../lib/apiClient";
import type {
  ChatConversation,
  ChatMessage,
  NotificationItem,
  NotificationListResponse,
  NotificationQuery,
  PaginatedMessages,
} from "../types/communication";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export const communicationService = {
  listNotifications: async (
    params: NotificationQuery = {},
  ): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>(
      "/notifications/",
      { params },
    );
    return response.data;
  },

  markNotificationRead: async (
    notificationId: number,
  ): Promise<NotificationItem> => {
    const response = await apiClient.patch<NotificationItem>(
      `/notifications/${notificationId}/read/`,
    );
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.post("/notifications/read-all/");
  },

  listConversations: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get<ChatConversation[]>("/chats/");
    return response.data;
  },

  startConversation: async (
    storeId: number,
    orderId?: number,
  ): Promise<ChatConversation> => {
    const response = await apiClient.post<ChatConversation>("/chats/", {
      store_id: storeId,
      order_id: orderId,
    });
    return response.data;
  },

  listMessages: async (
    conversationId: number,
    params: { since_id?: number; page?: number; page_size?: number } = {},
  ): Promise<PaginatedMessages> => {
    const response = await apiClient.get<PaginatedMessages>(
      `/chats/${conversationId}/messages/`,
      { params },
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: number,
    payload: { text?: string; image?: File | null },
  ): Promise<ChatMessage> => {
    const formData = new FormData();

    if (payload.text) {
      formData.append("text", payload.text);
    }

    if (payload.image) {
      formData.append("attachment_image", payload.image);
    }

    const response = await apiClient.post<ChatMessage>(
      `/chats/${conversationId}/messages/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  markConversationRead: async (conversationId: number): Promise<void> => {
    await apiClient.post(`/chats/${conversationId}/read/`);
  },
};
