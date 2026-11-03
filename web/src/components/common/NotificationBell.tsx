import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { communicationService } from "../../services/communicationService";
import type {
  NotificationItem,
  NotificationType,
} from "../../types/communication";

const POLL_INTERVAL_MS = 5000;

function iconForType(type: NotificationType): string {
  switch (type) {
    case "NEW_MESSAGE":
      return "#ic-mail-nav";
    case "NEW_REVIEW":
      return "#ic-check-badge";
    case "LOW_STOCK":
      return "#ic-arrow-down";
    case "CANCEL_REQUEST":
    case "RETURN_REQUEST":
      return "#ic-inbox";
    default:
      return "#ic-box";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationBell() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await communicationService.listNotifications({
        page_size: 8,
      });
      setNotifications(data.results ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);

    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (
    notification: NotificationItem,
  ) => {
    if (!notification.is_read) {
      try {
        await communicationService.markNotificationRead(notification.id);
      } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    setIsOpen(false);

    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await communicationService.markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar notificações como lidas:", error);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notificações"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="relative w-[46px] h-[46px] rounded-full border border-[#E6E1D2] bg-white flex items-center justify-center text-[#5A6067] cursor-pointer"
      >
        <svg className="w-[22px] h-[22px]">
          <use href="#ic-bell" />
        </svg>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-[2px] -right-[2px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#A85A38] text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Central de notificações"
          className="absolute right-0 top-[56px] w-[360px] bg-white border border-[#E6E1D2] rounded-2xl shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFEBDD]">
            <strong className="text-[14px] text-[#263847]">
              Notificações ({unreadCount})
            </strong>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="text-[12px] font-bold text-[#354B5E] hover:underline cursor-pointer"
            >
              Marcar lidas
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#93927F]">
                Nenhuma notificação por aqui.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-[#F3F0E8] last:border-b-0 hover:bg-[#F8F6F0] transition-colors cursor-pointer ${
                    notification.is_read ? "bg-white" : "bg-[#FDF8F4]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#E9EDF0] text-[#354B5E] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4">
                        <use href={iconForType(notification.type)} />
                      </svg>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-bold text-[#263847]">
                        {notification.title}
                      </span>
                      <span className="block text-[12px] text-[#5A6067] mt-0.5 line-clamp-2">
                        {notification.message}
                      </span>
                      <span className="block text-[10px] text-[#93927F] mt-1">
                        {formatDate(notification.created_at)}
                      </span>
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#A85A38] flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
