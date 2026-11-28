import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { listNotifications } from '../services/communication';

const DEFAULT_POLL_INTERVAL_MS = 15000;

export function useUnreadNotifications(
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (AppState.currentState !== 'active') return;
    try {
      const data = await listNotifications({ page_size: 1 });
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error('Erro ao carregar contador de notificações:', error);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refresh();
      }
    }, pollIntervalMs);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [pollIntervalMs, refresh]);

  return { unreadCount, refresh };
}