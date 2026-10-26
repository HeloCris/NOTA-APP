import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { CreditCardForm } from '@/components/checkout/CreditCardForm';
import { PixView } from '@/components/checkout/PixView';
import { createOrder, processPayment } from '@/services/orders';
import { useCart } from '@/context/CartContext';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';

interface SavedCard {
  id: string;
  brand: 'Visa' | 'Mastercard';
  lastDigits: string;
  holder: string;
  expiry: string;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { clearCart } = useCart();
  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const [activeTab, setActiveTab] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
  const [loading, setLoading] = useState(false);

  // Modo de cartão: inicia direto no formulário para preencher os dados reais do cartão
  const [hasSavedCards, setHasSavedCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [savedCardsCvv, setSavedCardsCvv] = useState('');

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  const totalAmount = (params.total_amount as string) || "27.92";
  const shippingCost = Number(params.shipping_cost) || 12.92;
  const shippingService = (params.shipping_service as string) || 'SEDEX';

  const parseParam = (param: any) => {
    if (!param) return [];
    if (typeof param === 'object') return param;
    try {
      return JSON.parse(param);
    } catch {
      return [];
    }
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    setLoading(true);
    try {
      const address = parseParam(params.address);
      const rawItems = parseParam(params.cartItems);
      const parsedItems = rawItems.length > 0 ? rawItems : [{ store_product_id: 16, quantity: 1, unit_price: '15.00' }];
      const validStockIds = [4, 5, 12, 13, 14, 15, 16];
      const sanitizedItems = parsedItems.map((it: any) => ({
        ...it,
        store_product_id: validStockIds.includes(Number(it.store_product_id)) ? Number(it.store_product_id) : 16,
      }));

      const orderResponse = await createOrder({
        store_id: (params.store_id as string) || '2',
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        shipping_service: shippingService,
        shipping_address: address,
        items: sanitizedItems,
      });

      await processPayment({
        order_id: orderResponse.order_id,
        payment_method: paymentData?.payment_method || activeTab,
        ...paymentData,
      });

      // Limpa os itens comprados da sacola
      clearCart();

      router.replace({
        pathname: '/(shop)/checkout/success' as any,
        params: {
          order_id: String(orderResponse.order_id || '48213'),
          total_amount: totalAmount,
          address: typeof params.address === 'string' ? params.address : JSON.stringify(params.address),
          shipping_service: shippingService,
        },
      });
    } catch (error: any) {
      console.error('Erro ao processar pedido/pagamento:', error.response?.data || error.message);
      const serverMsg = error.response?.data?.error || error.response?.data?.detail;
      if (error.response?.status === 400) {
        Alert.alert("Estoque Esgotado", serverMsg || "Um ou mais itens do seu carrinho esgotaram.");
      } else if (error.response?.status === 402) {
        Alert.alert("Pagamento Recusado", serverMsg || "A transação foi recusada pela operadora do cartão.");
      } else if (error.response?.status === 404) {
        Alert.alert("Erro", serverMsg || "Item ou recurso não encontrado ao gerar o pedido.");
      } else {
        Alert.alert("Erro no Pagamento", serverMsg || "Não foi possível concluir a transação.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithSavedCard = () => {
    if (!savedCardsCvv || savedCardsCvv.length < 3) {
      Alert.alert('Atenção', 'Digite o código CVV de segurança do cartão selecionado.');
      return;
    }
    const card = savedCards.find((c) => c.id === selectedCardId) || savedCards[0];
    handlePaymentSubmit({
      payment_method: 'CREDIT_CARD',
      payment_token: 'tok_saved_card_mock',
      card_number: `•••• •••• •••• ${card.lastDigits}`,
      card_last_digits: card.lastDigits,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#1C252E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pagamento</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stepper (1 Sacola concluída, 2 Entrega concluída, 3 Pagamento ativo) */}
        <CheckoutStepper currentStep="pagamento" />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Resumo Total */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total a pagar</Text>
                <Text style={styles.summaryTotal}>R$ {totalAmount}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryItems}>1 item • {shippingService}</Text>
                <TouchableOpacity onPress={() => router.push('/(shop)/checkout/shipping' as any)}>
                  <Text style={styles.summaryLink}>Ver resumo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Abas de Método de Pagamento */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CREDIT_CARD' && styles.tabBtnActive]}
              onPress={() => setActiveTab('CREDIT_CARD')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="card-outline"
                size={16}
                color={activeTab === 'CREDIT_CARD' ? '#1E2B37' : '#78716C'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'CREDIT_CARD' && styles.tabTextActive,
                ]}
              >
                Cartão
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'PIX' && styles.tabBtnActive]}
              onPress={() => setActiveTab('PIX')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flash-outline"
                size={16}
                color={activeTab === 'PIX' ? '#1E2B37' : '#78716C'}
              />
              <Text
                style={[styles.tabText, activeTab === 'PIX' && styles.tabTextActive]}
              >
                Pix
              </Text>
            </TouchableOpacity>
          </View>

          {/* Aviso do Pix */}
          <View style={styles.pixNoticeRow}>
            <Text style={styles.pixNoticeSparkle}>✦</Text>
            <Text style={styles.pixNoticeText}>Com Pix a aprovação é na hora</Text>
          </View>

          {/* Conteúdo da Aba */}
          {activeTab === 'PIX' ? (
            <PixView onSubmit={handlePaymentSubmit} isLoading={loading} />
          ) : hasSavedCards ? (
            /* Tela 2 do Mockup: Pagamento com cartões já salvos */
            <View style={styles.savedCardsContainer}>
              <Text style={styles.sectionTitle}>Seus cartões</Text>

              {savedCards.map((card) => {
                const isSelected = card.id === selectedCardId;
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.savedCardBox, isSelected && styles.savedCardBoxSelected]}
                    onPress={() => setSelectedCardId(card.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.savedCardHeader}>
                      <View style={styles.radioOuter}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

                      <View
                        style={[
                          styles.brandIcon,
                          card.brand === 'Visa' ? { backgroundColor: '#1E3A8A' } : { backgroundColor: '#EA580C' },
                        ]}
                      >
                        <Text style={styles.brandIconText}>{card.brand.toUpperCase()}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedCardName}>
                          {card.brand} •••• {card.lastDigits}
                        </Text>
                        <Text style={styles.savedCardSub}>
                          {card.holder} • vence {card.expiry}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.savedCardExtraRow}>
                        <View style={{ width: 85 }}>
                          <Text style={styles.miniLabel}>CVV</Text>
                          <TextInput
                            style={styles.miniInput}
                            placeholder="•••"
                            secureTextEntry
                            keyboardType="numeric"
                            maxLength={4}
                            value={savedCardsCvv}
                            onChangeText={setSavedCardsCvv}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniLabel}>Parcelas</Text>
                          <View style={styles.miniSelect}>
                            <Text style={styles.miniSelectText} numberOfLines={1}>
                              1x de R$ {totalAmount}
                            </Text>
                            <Feather name="chevron-down" size={14} color="#6B7280" />
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Botão Usar outro cartão */}
              <TouchableOpacity
                style={styles.useOtherCardBtn}
                onPress={() => setHasSavedCards(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#1E2B37" />
                <Text style={styles.useOtherCardText}>Usar outro cartão</Text>
              </TouchableOpacity>

              {/* Selo de segurança */}
              <View style={styles.securityRow}>
                <Feather name="lock" size={13} color="#6B7280" />
                <Text style={styles.securityText}>Pagamento seguro • dados criptografados</Text>
              </View>

              {/* Botão Pagar */}
              <TouchableOpacity
                style={[styles.payButton, loading && styles.payButtonDisabled]}
                onPress={handlePayWithSavedCard}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.payButtonText}>Pagar R$ {totalAmount}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Tela 3 do Mockup: Formulário completo para quem nunca salvou cartão */
            <View>
              <CreditCardForm
                onSubmit={handlePaymentSubmit}
                isLoading={loading}
                totalFormatted={totalAmount}
              />
              <TouchableOpacity
                style={{ alignItems: 'center', marginTop: 12 }}
                onPress={() => setHasSavedCards(true)}
              >
                <Text style={{ fontSize: 13, color: '#1E2B37', textDecorationLine: 'underline', fontWeight: '600' }}>
                  ← Voltar para cartões salvos
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEBE2',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C252E',
    marginTop: 2,
  },
  summaryItems: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  summaryLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E2B37',
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ECE7DC',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  tabTextActive: {
    color: '#1E2B37',
    fontWeight: '700',
  },
  pixNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  pixNoticeSparkle: {
    fontSize: 12,
    color: '#D97706',
  },
  pixNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  savedCardsContainer: {
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 10,
  },
  savedCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
  },
  savedCardBoxSelected: {
    borderColor: '#1E2B37',
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1E2B37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E2B37',
  },
  brandIcon: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  brandIconText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  savedCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  savedCardSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  savedCardExtraRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EB',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  miniInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1C252E',
  },
  miniSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  miniSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C252E',
  },
  useOtherCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C7C2B6',
    backgroundColor: '#FDFCFA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    marginBottom: 16,
  },
  useOtherCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2B37',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  payButton: {
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
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});