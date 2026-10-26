import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderTimeline } from '@/components/orders/OrderTimeline';
import {
  cancelCustomerOrder,
  confirmCustomerDelivery,
  disputeCustomerDelivery,
  getCustomerOrder,
  updateCustomerAddress,
  type CustomerOrderDetail,
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

const CANCEL_REASONS = [
  'Desisti da compra',
  'Comprei errado',
  'Endereço errado',
  'Produto avariado',
  'Produto diferente do anunciado',
  'Outro',
];

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal Cancelamento
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Modal Endereço
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [zipCode, setZipCode] = useState('');

  const loadOrder = async () => {
    if (!id) return;
    try {
      setError(false);
      const data = await getCustomerOrder(id);
      setOrder(data);

      if (data?.shipping_address) {
        const addr = data.shipping_address as Record<string, any>;
        setStreet(addr.shipping_street || addr.street || '');
        setNumber(addr.shipping_number || addr.number || '');
        setNeighborhood(addr.shipping_neighborhood || addr.neighborhood || '');
        setCity(addr.shipping_city || addr.city || '');
        setStateUF(addr.shipping_state || addr.state || '');
        setZipCode(addr.shipping_zip_code || addr.cep || addr.zip_code || '');
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function copyTrackingCode() {
    if (!order?.tracking_code) return;
    await Clipboard.setStringAsync(order.tracking_code);
    setCopied(true);
  }

  function openTrackingUrl() {
    if (order?.carrier_url && order?.tracking_code) {
      Linking.openURL(`${order.carrier_url}${order.tracking_code}`).catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o link da transportadora.');
      });
    }
  }

  async function handleConfirmCancel() {
    if (!id || !order) return;
    const reason = selectedReason === 'Outro' ? customReason.trim() : selectedReason;
    if (!reason) {
      Alert.alert('Atenção', 'Selecione ou informe o motivo do cancelamento.');
      return;
    }

    try {
      setActionLoading(true);
      await cancelCustomerOrder(id, reason);
      setCancelModalVisible(false);
      setSelectedReason('');
      setCustomReason('');
      Alert.alert('Sucesso', 'Solicitação de cancelamento enviada.');
      await loadOrder();
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.error || err?.response?.data?.reason || 'Erro ao cancelar o pedido.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveAddress() {
    if (!id || !order) return;
    if (!street || !number || !neighborhood || !city || !stateUF || !zipCode) {
      Alert.alert('Atenção', 'Preencha todos os campos do endereço.');
      return;
    }

    try {
      setActionLoading(true);
      await updateCustomerAddress(id, {
        shipping_street: street,
        shipping_number: number,
        shipping_neighborhood: neighborhood,
        shipping_city: city,
        shipping_state: stateUF,
        shipping_zip_code: zipCode,
      });
      setAddressModalVisible(false);
      Alert.alert('Sucesso', 'Endereço atualizado com sucesso.');
      await loadOrder();
    } catch (err: any) {
      Alert.alert(
        'Erro ao alterar endereço',
        err?.response?.data?.error || 'A alteração só é permitida para a mesma cidade/UF.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmDelivery() {
    if (!id) return;
    Alert.alert(
      'Confirmar Entrega',
      'Você confirma que recebeu todos os produtos deste pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, recebi',
          onPress: async () => {
            try {
              setActionLoading(true);
              await confirmCustomerDelivery(id);
              Alert.alert('Sucesso', 'Entrega confirmada com sucesso!');
              await loadOrder();
            } catch (err: any) {
              Alert.alert(
                'Erro',
                err?.response?.data?.error || 'Não foi possível confirmar a entrega.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleDisputeDelivery() {
    if (!id) return;
    Alert.alert(
      'Contestar Entrega',
      'Informa que não recebeu o pedido? A loja será notificada para resolução.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Contestar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await disputeCustomerDelivery(id, 'Cliente informou que não recebeu o pedido.');
              Alert.alert('Contestação Registrada', 'Entraremos em contato via chat.');
              await loadOrder();
            } catch (err: any) {
              Alert.alert(
                'Erro',
                err?.response?.data?.error || 'Não foi possível registrar a contestação.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  const isWithin7DaysOfDelivery = () => {
    if (!order?.delivered_at) return false;
    const deliveredDate = new Date(order.delivered_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deliveredDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

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
        <Text style={styles.headerTitle}>Pedido #{order?.code || id || '105'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator accessibilityLabel="Carregando pedido" color="#A85A38" /> : null}
        {error ? <Text style={styles.feedback}>Não foi possível carregar este pedido.</Text> : null}

        {order ? (
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusIcon}>
                <Ionicons name="bus" size={21} color="#A85A38" />
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusLabel}>STATUS ATUAL</Text>
                <Text style={styles.statusTitle}>{statusLabels[order.status] || order.status}</Text>
                <Text style={styles.statusDescription}>
                  {order.timeline?.find((step) => step.current)?.description ||
                    'Acompanhe o andamento do seu pedido.'}
                </Text>
              </View>
            </View>

            {/* Aviso de Pedido com Endereço Alterado */}
            {order.address_changed ? (
              <View style={styles.warningCard}>
                <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                <Text style={styles.warningText}>Endereço alterado com sucesso para este pedido.</Text>
              </View>
            ) : null}

            {/* Ações do Cliente por Status */}
            <View style={styles.actionsSection}>
              {['PENDING', 'PAID', 'PROCESSING'].includes(order.status) ? (
                <View style={styles.actionButtonGroup}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    activeOpacity={0.8}
                    onPress={() => setAddressModalVisible(true)}
                  >
                    <Ionicons name="location-outline" size={18} color="#273847" />
                    <Text style={styles.btnSecondaryText}>Alterar endereço</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnDanger}
                    activeOpacity={0.8}
                    onPress={() => setCancelModalVisible(true)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnDangerText}>
                      {order.status === 'PROCESSING' ? 'Solicitar cancelamento' : 'Cancelar pedido'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {order.status === 'CANCEL_REQUESTED' ? (
                <View style={styles.infoBox}>
                  <Ionicons name="time-outline" size={20} color="#D97706" />
                  <Text style={styles.infoBoxText}>
                    Aguardando resposta da loja — até 48h.
                  </Text>
                </View>
              ) : null}

              {order.status === 'SHIPPED' ? (
                <View style={styles.actionButtonGroup}>
                  {order.carrier_url ? (
                    <TouchableOpacity
                      style={styles.btnPrimary}
                      activeOpacity={0.8}
                      onPress={openTrackingUrl}
                    >
                      <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.btnPrimaryText}>Rastrear no site da transportadora</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.btnSuccess}
                    activeOpacity={0.8}
                    onPress={handleConfirmDelivery}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.btnSuccessText}>Recebi meu pedido</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {order.status === 'DELIVERED' &&
              order.delivery_confirmed_by === 'SELLER' &&
              isWithin7DaysOfDelivery() ? (
                <TouchableOpacity
                  style={styles.btnWarning}
                  activeOpacity={0.8}
                  onPress={handleDisputeDelivery}
                >
                  <Ionicons name="help-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnWarningText}>Não recebi meu pedido</Text>
                </TouchableOpacity>
              ) : null}

              {order.status === 'DELIVERED' && isWithin7DaysOfDelivery() ? (
                <TouchableOpacity
                  style={styles.btnOutline}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(shop)/orders/${id}/return` as any)}
                >
                  <Ionicons name="return-down-back-outline" size={18} color="#273847" />
                  <Text style={styles.btnOutlineText}>Solicitar devolução</Text>
                </TouchableOpacity>
              ) : null}

              {order.status === 'DELIVERY_DISPUTED' ? (
                <TouchableOpacity
                  style={styles.btnPrimary}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(shop)/chat?order_id=${id}` as any)}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Abrir chat com a loja</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Card de Rastreio */}
            {order.tracking_code ? (
              <View style={styles.trackingCard}>
                <View style={styles.trackingHeader}>
                  <Text style={styles.sectionEyebrow}>RASTREIO</Text>
                  <Text style={styles.carrier}>{order.carrier ?? 'Transportadora'}</Text>
                </View>
                <View style={styles.trackingRow}>
                  <View>
                    <Text style={styles.trackingCode}>{order.tracking_code}</Text>
                    <Text style={styles.trackingHint}>Código da transportadora</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityLabel="Copiar código de rastreio"
                    style={[styles.copyButton, copied && styles.copyButtonDone]}
                    activeOpacity={0.75}
                    onPress={copyTrackingCode}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={19}
                      color={copied ? '#4C663F' : '#354B5E'}
                    />
                  </TouchableOpacity>
                </View>
                {copied ? (
                  <Text style={styles.copiedText}>Código copiado para a área de transferência.</Text>
                ) : null}
              </View>
            ) : null}

            {/* Linha do Tempo / Histórico */}
            {order.timeline && order.timeline.length > 0 ? (
              <View style={styles.historySection}>
                <View style={styles.historyHeading}>
                  <Ionicons name="time-outline" size={19} color="#354B5E" />
                  <Text style={styles.historyTitle}>Histórico do pedido</Text>
                </View>
                <OrderTimeline
                  steps={order.timeline.map(({ date, ...step }) => ({
                    ...step,
                    date: date ?? undefined,
                  }))}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {/* Modal de Cancelamento */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Motivo do Cancelamento</Text>
            <Text style={styles.modalSubtitle}>
              Selecione o motivo para cancelar este pedido:
            </Text>

            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name={
                    selectedReason === reason
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={18}
                  color={selectedReason === reason ? '#A85A38' : '#78716C'}
                />
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedReason === 'Outro' ? (
              <TextInput
                style={styles.modalInput}
                placeholder="Descreva o motivo (obrigatório)"
                value={customReason}
                onChangeText={setCustomReason}
              />
            ) : null}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={actionLoading}
                onPress={handleConfirmCancel}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Alteração de Endereço */}
      <Modal visible={addressModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Endereço</Text>
            <Text style={styles.modalSubtitle}>
              Alteração permitida apenas para a mesma Cidade/UF.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Rua / Logradouro"
              value={street}
              onChangeText={setStreet}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Número"
              value={number}
              onChangeText={setNumber}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.modalInput, styles.flex2]}
                placeholder="Cidade"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.modalInput, styles.flex1]}
                placeholder="UF"
                value={stateUF}
                onChangeText={setStateUF}
                maxLength={2}
              />
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="CEP"
              value={zipCode}
              onChangeText={setZipCode}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddressModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={actionLoading}
                onPress={handleSaveAddress}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  headerTitle: { color: '#273847', fontSize: 17, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 40 },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3D8',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 18,
  },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: '#F7E8E1',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  statusCopy: { marginLeft: 13, flex: 1 },
  statusLabel: {
    color: '#A85A38',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  statusTitle: {
    color: '#273847',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  statusDescription: { color: '#78716C', fontSize: 12, marginTop: 3 },
  warningCard: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  warningText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  actionsSection: { marginTop: 16, gap: 10 },
  actionButtonGroup: { gap: 10 },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#273847',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnSecondaryText: { color: '#273847', fontSize: 14, fontWeight: '700' },
  btnDanger: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnDangerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnSuccess: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnSuccessText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnWarning: {
    alignItems: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnWarningText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnOutline: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3D8',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 13,
  },
  btnOutlineText: { color: '#273847', fontSize: 14, fontWeight: '700' },
  infoBox: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  infoBoxText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3D8',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  trackingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    color: '#78716C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  carrier: { color: '#4C663F', fontSize: 12, fontWeight: '700' },
  trackingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  trackingCode: {
    color: '#273847',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  trackingHint: { color: '#9A9488', fontSize: 11, marginTop: 4 },
  copyButton: {
    alignItems: 'center',
    backgroundColor: '#EEF1F2',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copyButtonDone: { backgroundColor: '#EDF2E9' },
  copiedText: {
    color: '#4C663F',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
  },
  historySection: { marginTop: 26 },
  historyHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 17,
  },
  historyTitle: { color: '#273847', fontSize: 17, fontWeight: '800' },
  feedback: {
    color: '#78716C',
    fontSize: 14,
    paddingVertical: 28,
    textAlign: 'center',
  },

  // Estilos de Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#273847',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#78716C',
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reasonOptionSelected: {
    backgroundColor: '#F7E8E1',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  reasonText: { fontSize: 14, color: '#273847' },
  reasonTextSelected: { fontWeight: '700', color: '#A85A38' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E8E3D8',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#273847',
    marginTop: 10,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: { color: '#64748B', fontWeight: '700' },
  modalConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#A85A38',
  },
  modalConfirmBtnText: { color: '#FFFFFF', fontWeight: '700' },
});