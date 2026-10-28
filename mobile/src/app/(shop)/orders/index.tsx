import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  listCustomerOrders,
  type CustomerOrder,
  type CustomerOrderStatus,
} from '@/services/customerOrders';

const statusLabels: Record<CustomerOrderStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  PROCESSING: 'Em separação',
  CANCEL_REQUESTED: 'Cancelamento solicitado',
  SHIPPED: 'Enviado',
  DELIVERY_DISPUTED: 'Entrega contestada',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

function formatDate(value: string) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusAppearance(status: CustomerOrderStatus) {
  switch (status) {
    case 'DELIVERED':
      return {
        icon: 'checkmark-circle-outline' as const,
        color: '#4C663F',
        background: '#EDF2E9',
      };
    case 'SHIPPED':
      return {
        icon: 'bus-outline' as const,
        color: '#A85A38',
        background: '#F7E8E1',
      };
    case 'CANCEL_REQUESTED':
      return {
        icon: 'time-outline' as const,
        color: '#B45309',
        background: '#FEF3C7',
      };
    case 'DELIVERY_DISPUTED':
      return {
        icon: 'alert-circle-outline' as const,
        color: '#DC2626',
        background: '#FEE2E2',
      };
    case 'CANCELLED':
      return {
        icon: 'close-circle-outline' as const,
        color: '#6B7280',
        background: '#F3F4F6',
      };
    case 'REFUNDED':
      return {
        icon: 'return-down-back-outline' as const,
        color: '#7E22CE',
        background: '#F3E8FF',
      };
    default:
      return {
        icon: 'time-outline' as const,
        color: '#4A6072',
        background: '#EEF1F2',
      };
  }
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    listCustomerOrders()
      .then(setOrders)
      .catch(() => {
        setError(true);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color="#273847" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Pedidos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>ACOMPANHAMENTO</Text>
          <Text style={styles.heading}>
            Suas compras, do jeito que você gosta de acompanhar.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator accessibilityLabel="Carregando pedidos" color="#A85A38" />
        ) : null}
        {error ? (
          <Text style={styles.feedback}>Não foi possível carregar seus pedidos.</Text>
        ) : null}
        {!loading && !error && orders.length === 0 ? (
          <Text style={styles.feedback}>Você ainda não fez nenhum pedido.</Text>
        ) : null}
        {Array.isArray(orders) &&
          orders.map((order) => {
            const appearance = getStatusAppearance(order.status);
            const itemNames = (order.items || [])
              .map((item) => item.product_name)
              .filter(Boolean);
            const itemSummary =
              itemNames.length > 1
                ? `${itemNames[0]} e mais ${itemNames.length - 1} item(ns)`
                : itemNames[0] ?? 'Pedido sem itens';

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/(shop)/orders/[id]',
                    params: { id: order.id },
                  } as never)
                }
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      Pedido #{order.code || order.id}
                    </Text>
                    <Text style={styles.date}>{formatDate(order.created_at)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: appearance.background },
                    ]}
                  >
                    <Ionicons
                      name={appearance.icon}
                      size={14}
                      color={appearance.color}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: appearance.color },
                      ]}
                    >
                      {statusLabels[order.status] || order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.item}>{itemSummary}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.total}>
                    R$ {Number(order.total_amount || 0).toFixed(2).replace('.', ',')}
                  </Text>
                  <View style={styles.detailsAction}>
                    <Text style={styles.detailsText}>Ver detalhes</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4A6072" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F4F1EA', flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerSpacer: { width: 40 },
  title: { color: '#273847', fontSize: 17, fontWeight: '800' },
  content: { paddingBottom: 36, paddingHorizontal: 20 },
  intro: { paddingBottom: 22, paddingTop: 14 },
  eyebrow: {
    color: '#A85A38',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  heading: {
    color: '#273847',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 31,
    maxWidth: 340,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3D8',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 13,
    padding: 17,
    shadowColor: '#273847',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: { color: '#273847', fontSize: 15, fontWeight: '800' },
  date: { color: '#9A9488', fontSize: 12, marginTop: 4 },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { backgroundColor: '#EEEAE1', height: 1, marginVertical: 15 },
  item: { color: '#57534E', fontSize: 13 },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
  },
  total: { color: '#273847', fontSize: 14, fontWeight: '800' },
  detailsAction: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  detailsText: { color: '#4A6072', fontSize: 12, fontWeight: '700' },
  feedback: {
    color: '#78716C',
    fontSize: 14,
    paddingVertical: 28,
    textAlign: 'center',
  },
});