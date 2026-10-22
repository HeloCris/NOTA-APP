import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCart, CartItem } from '@/context/CartContext';

interface StoreGroup {
  storeId: number;
  storeName: string;
  storeIsOfficial?: boolean;
  storeCity?: string;
  storeState?: string;
  items: CartItem[];
  subtotal: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 480);

  const { items, updateQuantity, removeItem, clearCart, totalItemsCount, subtotal } = useCart();

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Agrupamento de itens por loja (estilo Shopee)
  const storeGroups = useMemo<StoreGroup[]>(() => {
    const groupsMap = new Map<string, StoreGroup>();

    items.forEach((item) => {
      const storeKey = item.storeId ? item.storeId.toString() : (item.storeName || item.brandName || 'Loja Parceira');
      if (!groupsMap.has(storeKey)) {
        groupsMap.set(storeKey, {
          storeId: item.storeId || 0,
          storeName: item.storeName || item.brandName || 'Loja Parceira',
          storeIsOfficial: item.storeIsOfficial,
          storeCity: item.storeCity,
          storeState: item.storeState,
          items: [],
          subtotal: 0,
        });
      }
      const group = groupsMap.get(storeKey)!;
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
    });

    return Array.from(groupsMap.values());
  }, [items]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push('/(shop)/checkout/bag' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Meu Carrinho</Text>
              <Text style={styles.subtitle}>
                {totalItemsCount} {totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'}
                {storeGroups.length > 0 ? ` • ${storeGroups.length} ${storeGroups.length === 1 ? 'loja' : 'lojas'}` : ''}
              </Text>
            </View>
            {items.length > 0 ? (
              <TouchableOpacity onPress={clearCart} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.clearCartText}>Limpar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* --- LISTA DE ITENS OU ESTADO VAZIO --- */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="shopping-bag" size={72} color="#8C827A" />
              </View>
              <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
              <Text style={styles.emptySubtitle}>
                Explore perfumes e decants de lojas oficiais e adicione os seus favoritos.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(shop)' as never)}
              >
                <Text style={styles.exploreBtnText}>Explorar perfumes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* --- LISTA AGRUPADA POR LOJA (ESTILO SHOPEE) --- */}
              <View style={styles.storeGroupsList}>
                {storeGroups.map((group, groupIdx) => (
                  <View key={`store-group-${group.storeId}-${groupIdx}`} style={styles.storeCardWrapper}>
                    {/* Cabeçalho da Loja */}
                    <TouchableOpacity
                      style={styles.storeHeaderRow}
                      activeOpacity={group.storeId ? 0.7 : 1}
                      onPress={() => {
                        if (group.storeId) {
                          router.push({
                            pathname: '/store/[id]' as never,
                            params: { id: group.storeId.toString() },
                          });
                        }
                      }}
                    >
                      <View style={styles.storeHeaderLeft}>
                        <Ionicons name="storefront" size={16} color="#2C4659" />
                        <Text style={styles.storeHeaderName} numberOfLines={1}>
                          {group.storeName}
                        </Text>
                        {group.storeIsOfficial ? (
                          <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" style={{ marginLeft: 2 }} />
                        ) : null}
                      </View>

                      {group.storeCity && group.storeState ? (
                        <View style={styles.storeLocationBadge}>
                          <Ionicons name="location-outline" size={11} color="#6B7280" />
                          <Text style={styles.storeLocationText}>
                            {group.storeCity}, {group.storeState}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>

                    {/* Linha separadora discreta */}
                    <View style={styles.storeHeaderDivider} />

                    {/* Produtos desta Loja */}
                    <View style={styles.storeProductsList}>
                      {group.items.map((item, itemIdx) => (
                        <View
                          key={item.id}
                          style={[
                            styles.productItemRow,
                            itemIdx !== group.items.length - 1 && styles.productItemDivider,
                          ]}
                        >
                          {/* Imagem do Produto */}
                          <View style={styles.bottleBox}>
                            {item.imageUrl ? (
                              <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.productImage}
                                contentFit="contain"
                                transition={200}
                              />
                            ) : (
                              <MaterialIcons name="local-florist" size={26} color="#A85A38" />
                            )}
                          </View>

                          {/* Informações */}
                          <View style={styles.infoCol}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() =>
                                router.push({
                                  pathname: '/product/[id]' as never,
                                  params: { id: item.productId.toString() },
                                })
                              }
                            >
                              <Text style={styles.productName} numberOfLines={2}>
                                {item.productName}
                              </Text>
                            </TouchableOpacity>

                            <View style={styles.volumeBadge}>
                              <Text style={styles.volumeText}>{item.volume}</Text>
                            </View>

                            {/* Seletor de Quantidade */}
                            <View style={styles.qtyControl}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => updateQuantity(item.id, -1)}
                                activeOpacity={0.6}
                              >
                                <Text style={styles.qtyBtnText}>−</Text>
                              </TouchableOpacity>

                              <Text style={styles.qtyValue}>{item.quantity}</Text>

                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => updateQuantity(item.id, 1)}
                                activeOpacity={0.6}
                              >
                                <Text style={styles.qtyBtnText}>+</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Preço e Remover */}
                          <View style={styles.priceCol}>
                            <Text style={styles.priceText}>
                              R$ {formatBRL(item.price * item.quantity)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeItem(item.id)}
                              activeOpacity={0.6}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Text style={styles.removeText}>Remover</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Subtotal desta Loja */}
                    <View style={styles.storeFooterRow}>
                      <Text style={styles.storeFooterLabel}>
                        Subtotal da Loja ({group.items.reduce((acc, i) => acc + i.quantity, 0)} {group.items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? 'item' : 'itens'}):
                      </Text>
                      <Text style={styles.storeFooterValue}>R$ {formatBRL(group.subtotal)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* --- DIVISÓRIA --- */}
              <View style={styles.dashedDivider} />

              {/* --- RESUMO DO PEDIDO --- */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal dos produtos</Text>
                  <Text style={styles.summaryValue}>R$ {formatBRL(subtotal)}</Text>
                </View>

                <View style={styles.summaryNoticeRow}>
                  <Ionicons name="information-circle-outline" size={15} color="#78716C" />
                  <Text style={styles.summaryNoticeText}>
                    O frete e os cupons por loja são calculados na etapa seguinte.
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>R$ {formatBRL(subtotal)}</Text>
                </View>
              </View>

              {/* --- BOTÃO FINALIZAR COMPRA --- */}
              <TouchableOpacity
                style={styles.checkoutBtn}
                activeOpacity={0.88}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutBtnText}>Finalizar Compra</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 28,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C252E',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
    fontWeight: '500',
  },
  clearCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    paddingTop: 4,
  },

  // --- Estado Vazio ---
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E6E1D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 34,
    maxWidth: 320,
    fontWeight: '400',
  },
  exploreBtn: {
    backgroundColor: '#1E2C3A',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  // --- Agrupamento por Loja (Shopee Style) ---
  storeGroupsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storeCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAF8F4',
  },
  storeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  storeHeaderName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1C252E',
  },
  storeLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFECE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storeLocationText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#524B43',
  },
  storeHeaderDivider: {
    height: 1,
    backgroundColor: '#EFECE4',
  },
  storeProductsList: {
    paddingHorizontal: 14,
  },
  productItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  bottleBox: {
    width: 64,
    height: 74,
    backgroundColor: '#F9F8F5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C252E',
    lineHeight: 18,
  },
  volumeBadge: {
    backgroundColor: '#F3EFE6',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  volumeText: {
    fontSize: 11,
    color: '#524B43',
    fontWeight: '700',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0ECE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C252E',
    lineHeight: 16,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
    minWidth: 16,
    textAlign: 'center',
  },
  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingVertical: 2,
    marginLeft: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1C252E',
  },
  removeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  storeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FCFAF6',
    borderTopWidth: 1,
    borderTopColor: '#EFECE4',
  },
  storeFooterLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  storeFooterValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#2C4659',
  },

  // --- Divisória ---
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E0D4',
    borderStyle: 'dashed',
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 16,
  },

  // --- Resumo ---
  summaryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1C252E',
    fontWeight: '600',
  },
  summaryNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBE7DE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  summaryNoticeText: {
    fontSize: 12,
    color: '#524B43',
    fontWeight: '500',
    flex: 1,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBE7DE',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C252E',
  },

  // --- Botão Finalizar Compra ---
  checkoutBtn: {
    backgroundColor: '#273847',
    marginHorizontal: 20,
    marginTop: 24,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
