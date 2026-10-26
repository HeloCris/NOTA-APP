import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { getCustomerOrder, type CustomerOrderDetail, type CustomerOrderStatus } from '@/services/customerOrders';

const statusLabels: Record<CustomerOrderStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Em separação',
  SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado',
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCustomerOrder(id)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function copyTrackingCode() {
    if (!order?.tracking_code) return;
    await Clipboard.setStringAsync(order.tracking_code);
    setCopied(true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Voltar" style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#273847" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido #{id ?? '105'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator accessibilityLabel="Carregando pedido" color="#A85A38" /> : null}
        {error ? <Text style={styles.feedback}>Não foi possível carregar este pedido.</Text> : null}
        {order ? <View style={styles.statusCard}>
          <View style={styles.statusIcon}><Ionicons name="bus" size={21} color="#A85A38" /></View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusLabel}>STATUS ATUAL</Text>
            <Text style={styles.statusTitle}>{statusLabels[order.status]}</Text>
            <Text style={styles.statusDescription}>{order.timeline.find((step) => step.current)?.description}</Text>
          </View>
        </View> : null}

        {order?.tracking_code ? <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}><Text style={styles.sectionEyebrow}>RASTREIO</Text><Text style={styles.carrier}>{order.carrier ?? 'Transportadora'}</Text></View>
          <View style={styles.trackingRow}>
            <View><Text style={styles.trackingCode}>{order.tracking_code}</Text><Text style={styles.trackingHint}>Código da transportadora</Text></View>
            <TouchableOpacity accessibilityLabel="Copiar código de rastreio" style={[styles.copyButton, copied && styles.copyButtonDone]} activeOpacity={0.75} onPress={copyTrackingCode}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={19} color={copied ? '#4C663F' : '#354B5E'} />
            </TouchableOpacity>
          </View>
          {copied ? <Text style={styles.copiedText}>Código copiado para a área de transferência.</Text> : null}
        </View> : null}

        {order ? <View style={styles.historySection}>
          <View style={styles.historyHeading}><Ionicons name="time-outline" size={19} color="#354B5E" /><Text style={styles.historyTitle}>Histórico do pedido</Text></View>
          <OrderTimeline steps={order.timeline.map(({ date, ...step }) => ({ ...step, date: date ?? undefined }))} />
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F4F1EA', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', height: 58, justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  headerSpacer: { width: 40 },
  headerTitle: { color: '#273847', fontSize: 17, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  statusCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E8E3D8', borderRadius: 12, borderWidth: 1, flexDirection: 'row', padding: 18 },
  statusIcon: { alignItems: 'center', backgroundColor: '#F7E8E1', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  statusCopy: { marginLeft: 13 },
  statusLabel: { color: '#A85A38', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  statusTitle: { color: '#273847', fontSize: 19, fontWeight: '800', marginTop: 2 },
  statusDescription: { color: '#78716C', fontSize: 12, marginTop: 3 },
  trackingCard: { backgroundColor: '#FFFFFF', borderColor: '#E8E3D8', borderRadius: 12, borderWidth: 1, marginTop: 14, padding: 18 },
  trackingHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionEyebrow: { color: '#78716C', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  carrier: { color: '#4C663F', fontSize: 12, fontWeight: '700' },
  trackingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  trackingCode: { color: '#273847', fontSize: 17, fontWeight: '800', letterSpacing: 0.4 },
  trackingHint: { color: '#9A9488', fontSize: 11, marginTop: 4 },
  copyButton: { alignItems: 'center', backgroundColor: '#EEF1F2', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  copyButtonDone: { backgroundColor: '#EDF2E9' },
  copiedText: { color: '#4C663F', fontSize: 11, fontWeight: '600', marginTop: 12 },
  historySection: { marginTop: 26 },
  historyHeading: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 17 },
  historyTitle: { color: '#273847', fontSize: 17, fontWeight: '800' },
  feedback: { color: '#78716C', fontSize: 14, paddingVertical: 28, textAlign: 'center' },
});