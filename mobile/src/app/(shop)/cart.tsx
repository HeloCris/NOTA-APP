import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

// --- Vector Perfume Bottle: Libre EDP (Lavender) ---
function LavenderBottle() {
  return (
    <Svg width={46} height={68} viewBox="0 0 50 74">
      <Defs>
        <LinearGradient id="cartLavGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#DDD6FE" />
          <Stop offset="40%" stopColor="#C4B5FD" />
          <Stop offset="80%" stopColor="#A78BFA" />
          <Stop offset="100%" stopColor="#8B5CF6" />
        </LinearGradient>
        <LinearGradient id="cartGoldCap" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#CA8A04" />
          <Stop offset="100%" stopColor="#854D0E" />
        </LinearGradient>
      </Defs>
      {/* Golden Cap */}
      <Rect x="20" y="4" width="10" height="9" rx="1.5" fill="url(#cartGoldCap)" />
      {/* Neck */}
      <Rect x="22" y="13" width="6" height="4" fill="#CA8A04" />
      {/* Body */}
      <Rect x="10" y="17" width="30" height="50" rx="5" fill="url(#cartLavGrad)" />
      {/* Label Box */}
      <Rect
        x="16"
        y="30"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeOpacity="0.8"
      />
    </Svg>
  );
}

// --- Vector Perfume Bottle: Baccarat Rouge 540 (Amber Cylinder) ---
function AmberBottle() {
  return (
    <Svg width={46} height={68} viewBox="0 0 50 74">
      <Defs>
        <LinearGradient id="cartAmberGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="40%" stopColor="#F59E0B" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>
        <LinearGradient id="cartSphereCap" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="60%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
      </Defs>
      {/* Spherical Cap */}
      <Circle cx="25" cy="8" r="6" fill="url(#cartSphereCap)" />
      {/* Neck */}
      <Rect x="22" y="14" width="6" height="4" fill="#B45309" />
      {/* Cylinder Body */}
      <Rect x="15" y="18" width="20" height="50" rx="3.5" fill="url(#cartAmberGrad)" />
    </Svg>
  );
}

interface CartItem {
  id: string;
  brand: string;
  name: string;
  volume: string;
  price: number;
  quantity: number;
  renderBottle: () => React.ReactNode;
}

export default function CartScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [items, setItems] = useState<CartItem[]>([
    {
      id: '1',
      brand: 'YVES SAINT LAURENT',
      name: 'Libre EDP',
      volume: '50ml',
      price: 620,
      quantity: 1,
      renderBottle: () => <LavenderBottle />,
    },
    {
      id: '2',
      brand: 'MAISON F. KURKDJIAN',
      name: 'Baccarat Rouge 540',
      volume: '70ml',
      price: 1890,
      quantity: 1,
      renderBottle: () => <AmberBottle />,
    },
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQtd = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQtd };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping = items.length > 0 ? 24.9 : 0;
  const total = subtotal + shipping;

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCheckout = () => {
    // Navigates to static RF-10 Checkout & Shipping Address prototype
    router.push('/rf10-checkout' as any);
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
            <Text style={styles.title}>Meu Carrinho</Text>
            <Text style={styles.subtitle}>
              {totalItemsCount} {totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'}
            </Text>
          </View>

          {/* --- LISTA DE ITENS --- */}
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                {/* Bottle Illustration */}
                <View style={styles.bottleBox}>{item.renderBottle()}</View>

                {/* Details */}
                <View style={styles.infoCol}>
                  <Text style={styles.brandText}>{item.brand}</Text>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.volumeText}>{item.volume}</Text>

                  {/* Quantity Selector */}
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

                {/* Price & Remove */}
                <View style={styles.priceCol}>
                  <Text style={styles.priceText}>
                    R$ {item.price * item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.removeText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* --- DIVISÓRIA --- */}
          <View style={styles.dashedDivider} />

          {/* --- RESUMO DO PEDIDO --- */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {formatBRL(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete estimado</Text>
              <Text style={styles.summaryValue}>R$ {formatBRL(shipping)}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {formatBRL(total)}</Text>
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
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F4F1EA',
  },
  contentContainer: {
    paddingBottom: 24,
  },

  // --- Header ---
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 18 : 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#78716C',
    fontWeight: '400',
  },

  // --- Cards ---
  itemsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bottleBox: {
    width: 54,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 2,
  },
  volumeText: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 8,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E4D8',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    height: 28,
  },
  qtyBtn: {
    width: 24,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
    paddingHorizontal: 8,
  },
  priceCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 72,
    paddingVertical: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  removeText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
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
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
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
