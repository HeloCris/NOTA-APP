import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const orderId = (params.order_id as string) || '48213';
  const totalAmount = (params.total_amount as string) || '27,92';
  const shippingService = (params.shipping_service as string) || 'SEDEX';

  let addressStreet = 'Rua Presidente Epitácio Pessoa, 98';
  try {
    if (params.address) {
      const parsed = typeof params.address === 'string' ? JSON.parse(params.address) : params.address;
      if (parsed?.street && parsed?.number) {
        addressStreet = `${parsed.street}, ${parsed.number}`;
      }
    }
  } catch {
    // fallback
  }

  const handleGoHome = () => {
    router.replace('/(shop)' as any);
  };

  const handleTrackOrder = () => {
    router.replace('/(shop)/orders' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* Header com botão fechar (X) e título Confirmação */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleGoHome}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#1C252E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmação</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stepper com todos os 3 passos concluídos */}
        <CheckoutStepper currentStep="confirmacao" />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Círculo com checkmark verde */}
          <View style={styles.badgeWrapper}>
            <View style={styles.checkCircle}>
              <Feather name="check" size={32} color="#15803D" />
            </View>
          </View>

          {/* Título & Mensagem */}
          <Text style={styles.mainTitle}>Pedido confirmado</Text>
          <Text style={styles.mainSubtitle}>
            Enviamos os detalhes para o seu e-mail. A loja já foi avisada.
          </Text>

          {/* Card Detalhes do Pedido */}
          <View style={styles.card}>
            {/* Linha Pedido */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pedido</Text>
              <Text style={styles.orderNumberText}>#NOTA-{orderId}</Text>
            </View>

            <View style={styles.divider} />

            {/* Linha Endereço */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Endereço</Text>
              <Text style={styles.addressValueText} numberOfLines={2}>
                {addressStreet}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Linha Previsão */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previsão ({shippingService})</Text>
              <Text style={styles.infoValueBold}>23 a 26 out</Text>
            </View>

            <View style={styles.divider} />

            {/* Linha Total pago */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total pago</Text>
              <Text style={styles.totalValueText}>R$ {totalAmount}</Text>
            </View>
          </View>

          <View style={{ flex: 1, minHeight: 24 }} />

          {/* Botões de Ação */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleTrackOrder}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Acompanhar pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryButtonText}>Continuar comprando</Text>
          </TouchableOpacity>
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
  closeBtn: {
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
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#EFEBE2',
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C252E',
  },
  addressValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  totalValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F0E6',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E2B37',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1E2B37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E2B37',
  },
  secondaryButtonText: {
    color: '#1E2B37',
    fontSize: 14,
    fontWeight: '700',
  },
});