import { useCallback, useEffect, useState } from 'react';

import { listNotifications } from '../services/communication';

const DEFAULT_POLL_INTERVAL_MS = 5000;

export function useUnreadNotifications(
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await listNotifications({ page_size: 1 });
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void refresh();
    }, 0);

    const intervalId = setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [pollIntervalMs, refresh]);

  return { unreadCount, refresh };
}
