import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
} from '@/services/communication';

const POLL_INTERVAL_MS = 5000;

function iconForType(
  type: NotificationType,
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'NEW_MESSAGE':
      return 'chatbubble-ellipses-outline';
    case 'NEW_REVIEW':
      return 'star-outline';
    case 'LOW_STOCK':
      return 'alert-circle-outline';
    case 'CANCEL_REQUEST':
    case 'RETURN_REQUEST':
      return 'arrow-undo-outline';
    case 'ORDER_SHIPPED':
      return 'bus-outline';
    case 'ORDER_DELIVERED':
      return 'checkmark-circle-outline';
    default:
      return 'bag-handle-outline';
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await listNotifications({ page_size: 50 });
      setNotifications(data.results ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadNotifications();
    }, 0);

    const intervalId = setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [loadNotifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadNotifications();
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    if (notification.target_url) {
      router.push(notification.target_url as never);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#1C252E" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Notificações</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`
              : 'Tudo em dia'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => void handleMarkAllRead()}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como lidas"
            activeOpacity={0.7}
          >
            <Text style={styles.markAllText}>Marcar lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C4659" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#2C4659"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color="#C4BDB2"
              />
              <Text style={styles.emptyText}>
                Nenhuma notificação por aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => void handleNotificationPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`Notificação: ${item.title}`}
              activeOpacity={0.8}
              style={[
                styles.notificationCard,
                !item.is_read && styles.notificationCardUnread,
              ]}
            >
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={iconForType(item.type)}
                  size={19}
                  color="#2C4659"
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>
                  {item.message}
                </Text>
                <Text style={styles.notificationDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E1D2',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E1D2',
    padding: 14,
  },
  notificationCardUnread: {
    backgroundColor: '#FDF8F4',
    borderColor: '#F0DCCF',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E9EDF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A85A38',
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5D514A',
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
});
