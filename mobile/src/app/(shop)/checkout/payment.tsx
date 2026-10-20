import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CreditCardForm } from '@/components/checkout/CreditCardForm';
import { PixView } from '@/components/checkout/PixView';
import { createOrder, processPayment } from '@/services/orders';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
  const [loading, setLoading] = useState(false);

  const totalAmount = "374.90";

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
      const items = parseParam(params.cartItems);

      const orderResponse = await createOrder({
        store_id: params.store_id || '1',
        total_amount: totalAmount,
        shipping_cost: 15.00,
        shipping_address: address,
        items: items,
      });

      await processPayment({
        order_id: orderResponse.order_id,
        payment_method: paymentData?.payment_method || activeTab,
        ...paymentData
      });

      Alert.alert("Sucesso", "Pedido pago e confirmado!");
      router.replace('/(shop)/checkout/success' as any);

    } catch (error: any) {
      if (error.response?.status === 400) {
        Alert.alert("Estoque Esgotado", "Um ou mais itens do seu carrinho esgotaram.");
      } else if (error.response?.status === 402) {
        Alert.alert("Pagamento Recusado", "A transação foi recusada pela operadora do cartão.");
      } else {
        Alert.alert("Erro no Pagamento", "Não foi possível concluir a transação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pagamento</Text>
      
      <View style={styles.amountCard}>
        <Text style={styles.amountText}>
          Total a pagar: R$ {totalAmount}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CREDIT_CARD' && styles.activeTab]} 
          onPress={() => setActiveTab('CREDIT_CARD')}
          activeOpacity={0.7}
          testID="tab-credit-card"
        >
          <Text style={[styles.tabText, activeTab === 'CREDIT_CARD' && styles.activeTabText]}>
            💳 Cartão de Crédito
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PIX' && styles.activeTab]} 
          onPress={() => setActiveTab('PIX')}
          activeOpacity={0.7}
          testID="tab-pix"
        >
          <Text style={[styles.tabText, activeTab === 'PIX' && styles.activeTabText]}>
            ⚡ PIX
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'CREDIT_CARD' ? (
        <CreditCardForm onSubmit={handlePaymentSubmit} isLoading={loading} />
      ) : (
        <PixView onSubmit={handlePaymentSubmit} isLoading={loading} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  amountCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
});