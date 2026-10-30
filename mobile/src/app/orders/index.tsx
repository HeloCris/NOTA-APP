import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import {
  listCustomerOrders,
  type CustomerOrder,
  type CustomerOrderStatus,
} from '@/services/customerOrders';
import { formatProductVolume } from '@/utils/productUtils';

export const ORDER_STATUS_CONFIG: Record<
  CustomerOrderStatus,
  {
    label: string;
    bg: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
  }
> = {
  PAID: {
    label: 'Pago',
    bg: '#E3ECF8',
    color: '#2A5AA8',
    icon: 'card-outline',
    description: 'Pagamento confirmado. A loja vai começar a separar seu pedido.',
  },
  PROCESSING: {
    label: 'Em separação',
    bg: '#FBF0D9',
    color: '#8A5A0B',
    icon: 'cube-outline',
    description: 'A loja está preparando seus itens.',
  },
  CANCEL_REQUESTED: {
    label: 'Cancelamento solicitado',
    bg: '#FBF0D9',
    color: '#8A5A0B',
    icon: 'time-outline',
    description: 'Você pediu o cancelamento deste pedido.',
  },
  SHIPPED: {
    label: 'Enviado',
    bg: '#FBE6D8',
    color: '#B4521A',
    icon: 'bus-outline',
    description: 'Sua encomenda está a caminho.',
  },
  DELIVERED: {
    label: 'Entregue',
    bg: '#E1F0E7',
    color: '#2F7D4F',
    icon: 'checkmark-circle-outline',
    description: 'Seu pedido foi entregue.',
  },
  DELIVERY_DISPUTED: {
    label: 'Entrega contestada',
    bg: '#FBF0D9',
    color: '#8A5A0B',
    icon: 'alert-circle-outline',
    description: 'Você informou que não recebeu este pedido.',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: '#ECE8DF',
    color: '#6B6F78',
    icon: 'close-outline',
    description: 'Pedido cancelado. O estorno foi iniciado.',
  },
  REFUNDED: {
    label: 'Reembolsado',
    bg: '#EEE6FA',
    color: '#6B46C1',
    icon: 'cash-outline',
    description: 'O valor foi reembolsado.',
  },
  PENDING: {
    label: 'Pendente',
    bg: '#F4EFE6',
    color: '#8A5A0B',
    icon: 'hourglass-outline',
    description: 'Aguardando confirmação do pagamento.',
  },
};

type TabFilter = {
  id: string;
  label: string;
  statuses: CustomerOrderStatus[] | null;
};

const TABS: TabFilter[] = [
  { id: 'all', label: 'Todos', statuses: null },
  { id: 'PAID', label: 'Pago', statuses: ['PAID'] },
  { id: 'PROC', label: 'Em separação', statuses: ['PROCESSING', 'CANCEL_REQUESTED'] },
  { id: 'SHIP', label: 'Enviado', statuses: ['SHIPPED', 'DELIVERY_DISPUTED'] },
  { id: 'DEL', label: 'Entregue', statuses: ['DELIVERED'] },
  { id: 'CAN', label: 'Cancelado', statuses: ['CANCELLED'] },
  { id: 'RET', label: 'Devolução/Reembolso', statuses: ['REFUNDED'] },
];

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

function formatCurrency(val: string | number) {
  const num = typeof val === 'number' ? val : parseFloat(val || '0');
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getOrderHint(order: CustomerOrder) {
  if (order.status === 'CANCEL_REQUESTED') return 'Aguardando resposta da loja';
  if (order.status === 'SHIPPED') return 'Sua encomenda está em trânsito';
  if (order.status === 'DELIVERED' && order.delivery_confirmed_by === 'SELLER') {
    return 'Você pode contestar até 7 dias após a entrega';
  }
  if (order.status === 'DELIVERED') return 'Devolução e avaliação disponíveis até 7 dias';
  if (order.status === 'DELIVERY_DISPUTED') return 'Aguardando reenvio ou reembolso da loja';
  return '';
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await listCustomerOrders();
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
          setError(false);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await listCustomerOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError(false);
    } catch {
      setError(true);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Contagem para as abas baseada nos dados reais retornados da API
  const getTabCount = (tab: TabFilter) => {
    if (!tab.statuses) return orders.length;
    return orders.filter((o) => tab.statuses!.includes(o.status)).length;
  };

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const filteredOrders = orders.filter((o) => {
    if (!currentTab.statuses) return true;
    return currentTab.statuses.includes(o.status);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header do Protótipo */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          style={styles.iconBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(shop)' as never);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#1E2430" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus pedidos</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Abas de Filtros Horizontais */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((tab) => {
            const count = getTabCount(tab);
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
                <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Pedidos */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B2A41']}
            tintColor="#1B2A41"
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#1B2A41" />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={36} color="#C62828" />
            <Text style={styles.errorText}>Não foi possível carregar seus pedidos da API.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={44} color="#9A8F7A" />
            <Text style={styles.emptyTitle}>Nenhum pedido nesta aba</Text>
            <Text style={styles.emptySubtitle}>
              Seus pedidos realizados aparecerão aqui conforme forem atualizados.
            </Text>
          </View>
        ) : null}

        {!loading &&
          !error &&
          filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PROCESSING;
            const firstItem = order.items?.[0];
            const extraItemsCount = (order.items?.length || 0) - 1;
            const hint = getOrderHint(order);
            const orderCode = order.code || `#ORD-${String(order.id).padStart(4, '0')}`;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/orders/[id]',
                    params: { id: order.id },
                  } as never)
                }
              >
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderCode}>Pedido {orderCode}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Ionicons name={statusConfig.icon} size={13} color={statusConfig.color} />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Linha do Produto Principal */}
                <View style={styles.productRow}>
                  <View style={styles.productThumb}>
                    {firstItem?.product_image ? (
                      <Image
                        source={{ uri: firstItem.product_image }}
                        style={styles.productImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <Ionicons name="beaker-outline" size={20} color="#9A8F7A" />
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {firstItem?.product_name ?? 'Produto do pedido'}
                      {extraItemsCount > 0 ? ` +${extraItemsCount}` : ''}
                    </Text>
                    <Text style={styles.productMeta} numberOfLines={1}>
                      {formatProductVolume(firstItem?.volume_ml, 'Produto')}
                      {firstItem?.quantity && firstItem.quantity > 1
                        ? ` · ${firstItem.quantity} un.`
                        : ''}
                      {order.store_name ? ` · ${order.store_name}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Dica / Alerta Contextual do Card */}
                {hint ? (
                  <View style={styles.hintContainer}>
                    <Ionicons name="information-circle-outline" size={14} color={statusConfig.color} />
                    <Text style={[styles.hintText, { color: statusConfig.color }]}>{hint}</Text>
                  </View>
                ) : null}

                {/* Rodapé do Card */}
                <View style={styles.cardFooter}>
                  <Text style={styles.totalPrice}>{formatCurrency(order.total_amount)}</Text>
                  <View style={styles.footerActions}>
                    {order.status === 'DELIVERED' && (() => {
                      const totalItems = order.items?.length || 0;
                      const hasReviewable = order.items?.some((i) => i.can_review);
                      const hasReviewed = order.items?.some((i) => i.review_id);

                      if (!hasReviewable && !hasReviewed) return null;

                      // Se tiver mais de 1 item no pedido, abre a telinha de seleção dos itens
                      if (totalItems > 1) {
                        return (
                          <TouchableOpacity
                            style={hasReviewable ? styles.reviewBtn : styles.viewReviewBtn}
                            activeOpacity={0.8}
                            onPress={() => setSelectedOrderForReview(order)}
                          >
                            <Ionicons name="star" size={12} color="#D97706" />
                            <Text style={hasReviewable ? styles.reviewBtnText : styles.viewReviewBtnText}>
                              {hasReviewable ? 'Avaliar itens' : 'Ver avaliações'}
                            </Text>
                          </TouchableOpacity>
                        );
                      }

                      // Caso tenha apenas 1 item no pedido, vai direto para a tela de avaliação
                      const singleItem = order.items?.[0];
                      if (!singleItem) return null;

                      if (singleItem.can_review) {
                        return (
                          <TouchableOpacity
                            style={styles.reviewBtn}
                            activeOpacity={0.8}
                            onPress={() =>
                              router.push({
                                pathname: '/reviews/new',
                                params: {
                                  order_item_id: singleItem.id,
                                  product_name: singleItem.product_name,
                                  product_image: singleItem.product_image || '',
                                },
                              } as never)
                            }
                          >
                            <Ionicons name="star" size={12} color="#D97706" />
                            <Text style={styles.reviewBtnText}>Avaliar</Text>
                          </TouchableOpacity>
                        );
                      }

                      if (singleItem.review_id) {
                        return (
                          <TouchableOpacity
                            style={styles.viewReviewBtn}
                            activeOpacity={0.8}
                            onPress={() =>
                              router.push({
                                pathname: '/reviews/new',
                                params: {
                                  review_id: singleItem.review_id,
                                  product_name: singleItem.product_name,
                                  product_image: singleItem.product_image || '',
                                  can_edit: singleItem.can_edit_review ? 'true' : 'false',
                                },
                              } as never)
                            }
                          >
                            <Ionicons name="star" size={12} color="#D97706" />
                            <Text style={styles.viewReviewBtnText}>Ver avaliação</Text>
                          </TouchableOpacity>
                        );
                      }

                      return null;
                    })()}

                    <View style={styles.detailsAction}>
                      <Text style={styles.detailsActionText}>Ver detalhes</Text>
                      <Ionicons name="chevron-forward" size={15} color="#1B2A41" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      {/* Modal / Telinha de Seleção de Itens para Avaliar ou Visualizar Avaliação */}
      <Modal
        visible={Boolean(selectedOrderForReview)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrderForReview(null)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Avaliar Produtos</Text>
                <Text style={styles.sheetSubtitle}>
                  Pedido {selectedOrderForReview?.code || `#ORD-${selectedOrderForReview?.id}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setSelectedOrderForReview(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#1C252E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {selectedOrderForReview?.items?.map((item) => (
                <View key={item.id} style={styles.sheetItemCard}>
                  <View style={styles.sheetItemThumb}>
                    {item.product_image ? (
                      <Image
                        source={{ uri: item.product_image }}
                        style={styles.sheetItemImg}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="beaker-outline" size={20} color="#9A8F7A" />
                    )}
                  </View>
                  <View style={styles.sheetItemInfo}>
                    <Text style={styles.sheetItemName} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.sheetItemMeta}>
                      {formatProductVolume(item.volume_ml, 'Produto')}
                      {item.quantity > 1 ? ` · ${item.quantity} un.` : ''}
                    </Text>
                  </View>

                  {item.can_review ? (
                    <TouchableOpacity
                      style={styles.sheetActionBtnReview}
                      activeOpacity={0.8}
                      onPress={() => {
                        const targetItem = item;
                        setSelectedOrderForReview(null);
                        router.push({
                          pathname: '/reviews/new',
                          params: {
                            order_item_id: targetItem.id,
                            product_name: targetItem.product_name,
                            product_image: targetItem.product_image || '',
                          },
                        } as never);
                      }}
                    >
                      <Ionicons name="star" size={13} color="#92400E" />
                      <Text style={styles.sheetActionBtnReviewText}>Avaliar</Text>
                    </TouchableOpacity>
                  ) : item.review_id ? (
                    <TouchableOpacity
                      style={[
                        styles.sheetActionBtnView,
                        item.review_reply ? { backgroundColor: '#EBF5FF', borderColor: '#BAE6FD' } : undefined,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        const targetItem = item;
                        setSelectedOrderForReview(null);
                        router.push({
                          pathname: '/reviews/new',
                          params: {
                            review_id: targetItem.review_id,
                            product_name: targetItem.product_name,
                            product_image: targetItem.product_image || '',
                            can_edit: targetItem.can_edit_review ? 'true' : 'false',
                          },
                        } as never);
                      }}
                    >
                      <Ionicons
                        name={item.review_reply ? "chatbubble-ellipses-outline" : "star"}
                        size={13}
                        color={item.review_reply ? "#0284C7" : "#D97706"}
                      />
                      <Text
                        style={[
                          styles.sheetActionBtnViewText,
                          item.review_reply ? { color: '#0369A1' } : undefined,
                        ]}
                      >
                        {item.review_reply ? 'Loja respondeu' : 'Ver avaliação'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.sheetActionDisabled}>
                      <Text style={styles.sheetActionDisabledText}>Indisponível</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F4F0E8',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2430',
  },
  headerSpacer: {
    flex: 1,
  },
  tabsWrapper: {
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4DDD0',
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
  },
  tabButtonActive: {
    backgroundColor: '#1B2A41',
    borderColor: '#1B2A41',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#6B6F78',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBadgeText: {
    fontSize: 11,
    color: '#6B6F78',
    marginLeft: 4,
    opacity: 0.7,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1B2A41',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2430',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  productThumb: {
    width: 40,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#EFE8DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2430',
  },
  productMeta: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 2,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E4DDD0',
    paddingTop: 10,
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2430',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  viewReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewReviewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  detailsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B2A41',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B6F78',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1B2A41',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2430',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B6F78',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4DDD0',
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetList: {
    marginBottom: 10,
  },
  sheetItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0ECE1',
  },
  sheetItemThumb: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFE8DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheetItemImg: {
    width: '100%',
    height: '100%',
  },
  sheetItemInfo: {
    flex: 1,
  },
  sheetItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E2430',
  },
  sheetItemMeta: {
    fontSize: 11.5,
    color: '#6B6F78',
    marginTop: 2,
  },
  sheetActionBtnReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetActionBtnReviewText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  sheetActionBtnView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheetActionBtnViewText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  sheetActionDisabled: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  sheetActionDisabledText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});