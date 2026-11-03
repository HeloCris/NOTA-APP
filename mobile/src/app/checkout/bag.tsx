import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useCart, CartItem } from '@/context/CartContext';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { formatProductVolume } from '@/utils/productUtils';

export default function CheckoutBagScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const { items, updateQuantity, removeItem, subtotal, totalItemsCount } = useCart();

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Agrupa os itens por loja
  const storeGroups = useMemo(() => {
    const map = new Map<string, { storeName: string; storeIsOfficial?: boolean; items: CartItem[]; subtotal: number }>();

    items.forEach((item) => {
      const key = item.storeName || item.brandName || 'Loja Parceira';
      if (!map.has(key)) {
        map.set(key, {
          storeName: key,
          storeIsOfficial: item.storeIsOfficial,
          items: [],
          subtotal: 0,
        });
      }
      const g = map.get(key)!;
      g.items.push(item);
      g.subtotal += item.price * item.quantity;
    });

    return Array.from(map.values());
  }, [items]);

  const handleContinue = () => {
    router.push('/checkout/shipping' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* Header com botão voltar e título */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1C252E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sacola</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stepper (1 Sacola, 2 Entrega, 3 Pagamento) */}
        <CheckoutStepper currentStep="sacola" />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Seção Seu Pedido */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seu pedido</Text>
            <Text style={styles.itemCountText}>
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
            </Text>
          </View>

          {/* Cards agrupados por loja */}
          {storeGroups.map((group, groupIdx) => (
            <View key={groupIdx} style={styles.card}>
              <View style={styles.storeHeader}>
                <Ionicons name="storefront-outline" size={16} color="#1C252E" />
                <Text style={styles.storeName}>{group.storeName}</Text>
                {group.storeIsOfficial && (
                  <Ionicons name="checkmark-circle" size={15} color="#1B8754" />
                )}
              </View>

              {group.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.imageBox}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="contain" />
                    ) : (
                      <Ionicons name="flask-outline" size={24} color="#A8A29E" />
                    )}
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemVolumeTag}>
                      {(item.volume || formatProductVolume(item.volumeMl)).toUpperCase()}
                    </Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.productName}
                    </Text>

                    <View style={styles.itemControlsRow}>
                      <View style={styles.qtySelector}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.id, 1)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeItem(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#8A867E" />
                        <Text style={styles.removeText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.itemPrice}>
                    R$ {formatBRL(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* Botão tracejado Adicionar cupom */}
          <TouchableOpacity style={styles.couponButton} activeOpacity={0.7}>
            <Feather name="tag" size={16} color="#1E2B37" />
            <Text style={styles.couponButtonText}>Adicionar cupom</Text>
          </TouchableOpacity>

          {/* Card Resumo */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
              </Text>
              <Text style={styles.summaryValue}>R$ {formatBRL(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={styles.summaryMuted}>Calculado na próxima etapa</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {formatBRL(subtotal)}</Text>
            </View>
          </View>

          {/* Botão de ação inferior */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.88}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar para a entrega</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={{ height: 28 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  itemCountText: {
    fontSize: 13,
    color: '#78716C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  imageBox: {
    width: 58,
    height: 68,
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 48,
    height: 58,
  },
  itemInfo: {
    flex: 1,
  },
  itemVolumeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A867E',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginTop: 2,
  },
  itemControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5F0',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 10,
  },
  qtyBtn: {
    paddingHorizontal: 4,
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C4659',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#8A867E',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginTop: 16,
  },
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C7C2B6',
    backgroundColor: '#FDFCFA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  couponButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2B37',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1C252E',
    fontWeight: '700',
  },
  summaryMuted: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F0E6',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  continueButton: {
    backgroundColor: '#1E2B37',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
