import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import {
  cancelCustomerOrder,
  confirmCustomerDelivery,
  disputeCustomerDelivery,
  getCustomerOrder,
  updateCustomerAddress,
  type CustomerOrderDetail,
  type CustomerOrderStatus,
} from '@/services/customerOrders';
import { formatProductVolume } from '@/utils/productUtils';

const STATUS_CONFIG: Record<
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

const CANCEL_REASONS = [
  'Desisti da compra',
  'Comprei errado',
  'Encontrei preço melhor',
  'Demora na entrega',
  'Outro motivo',
];

function formatCurrency(val: string | number) {
  const num = typeof val === 'number' ? val : parseFloat(val || '0');
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value?: string | null) {
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

const showAlert = (title: string, message?: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? `: ${message}` : ''}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: onConfirm },
    ]);
  }
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modais de Pós-Compra
  const [activeSheet, setActiveSheet] = useState<
    'cancel' | 'address' | 'dispute' | null
  >(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Formulário de Alteração de Endereço (Padrão idêntico a Meus Endereços)
  const [tag, setTag] = useState('Casa');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [addressError, setAddressError] = useState(false);

  // Modal Customizado Bonito para Avisos / Confirmações
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDanger: false,
    onConfirm: () => {},
  });

  const showCustomConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      isDanger: !!options.isDanger,
      onConfirm: options.onConfirm,
    });
  };

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleCepSearch = async (text: string) => {
    const raw = text.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
    }
    setZipCode(formatted);

    if (raw.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateUF(data.uf || '');
        }
      } catch {
        // Fallback gracioso
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const syncAddress = (address: any) => {
    if (!address) return;
    setTag(address.tag || 'Casa');
    setStreet(address.shipping_street || address.street || '');
    setNumber(address.shipping_number || address.number || '');
    setComplement(address.shipping_complement || address.complement || '');
    setNeighborhood(address.shipping_neighborhood || address.neighborhood || '');
    setCity(address.shipping_city || address.city || '');
    setStateUF(
      address.shipping_state ||
        address.state ||
        address.stateUf ||
        address.state_uf ||
        ''
    );
    setZipCode(
      address.shipping_zip_code || address.cep || address.zip_code || ''
    );
  };

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(false);
      const data = await getCustomerOrder(id);
      setOrder(data);
      if (data?.shipping_address) {
        syncAddress(data.shipping_address);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setError(false);
        const data = await getCustomerOrder(id);
        if (isMounted) {
          setOrder(data);
          if (data?.shipping_address) {
            syncAddress(data.shipping_address);
          }
        }
      } catch {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const copyTracking = async () => {
    if (!order?.tracking_code) return;
    await Clipboard.setStringAsync(order.tracking_code);
    showToast('Código de rastreio copiado!');
  };

  const openCarrierTracking = () => {
    if (!order?.tracking_code) return;
    if (order.carrier_url) {
      Linking.openURL(`${order.carrier_url}${order.tracking_code}`).catch(() => {
        showAlert('Erro', 'Não foi possível abrir o site da transportadora.');
      });
    } else {
      Linking.openURL(
        `https://rastreamento.correios.com.br/app/index.php?objeto=${order.tracking_code}`
      ).catch(() => {
        showAlert('Erro', 'Não foi possível abrir o link de rastreio.');
      });
    }
  };

  // Ações do Pós-Compra (Consumindo a API)
  const handleConfirmCancel = async () => {
    if (!id || !order) return;
    const finalReason =
      cancelReason === 'Outro motivo' ? customReason.trim() : cancelReason;

    if (!finalReason) {
      showAlert('Atenção', 'Selecione ou informe o motivo do cancelamento.');
      return;
    }

    try {
      setActionLoading(true);
      await cancelCustomerOrder(id, finalReason);
      setActiveSheet(null);
      setCancelReason('');
      setCustomReason('');
      showToast(
        order.status === 'PROCESSING'
          ? 'Solicitação enviada à loja!'
          : 'Pedido cancelado. Estorno iniciado.'
      );
      await fetchOrderDetail();
    } catch (err: any) {
      showAlert(
        'Erro',
        err?.response?.data?.error ||
          err?.response?.data?.reason ||
          'Não foi possível concluir o cancelamento.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!id || !order) return;
    if (!street || !number || !neighborhood || !city || !stateUF || !zipCode) {
      showAlert('Atenção', 'Preencha todos os campos do endereço.');
      return;
    }

    // Validação de mesma Cidade/UF (RN-05)
    const originalAddr: any = order.shipping_address || {};
    const originalCity = (originalAddr.shipping_city || originalAddr.city || '')
      .trim()
      .toLowerCase();
    const originalUF = (
      originalAddr.shipping_state ||
      originalAddr.state ||
      originalAddr.stateUf ||
      ''
    )
      .trim()
      .toUpperCase();

    if (
      originalCity &&
      city.trim().toLowerCase() !== originalCity &&
      originalUF &&
      stateUF.trim().toUpperCase() !== originalUF
    ) {
      setAddressError(true);
      return;
    }

    setAddressError(false);

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

      setActiveSheet(null);
      showToast('Endereço de entrega atualizado!');
      await fetchOrderDetail();
    } catch (err: any) {
      setAddressError(true);
      showAlert(
        'Erro ao alterar endereço',
        err?.response?.data?.error ||
          'Não é possível mudar para outra cidade ou UF.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeliveryAction = () => {
    if (!id) return;
    showCustomConfirm({
      title: 'Confirmar entrega',
      message: 'Você confirma que recebeu seu pedido com sucesso?',
      confirmText: 'Sim, recebi',
      cancelText: 'Voltar',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await confirmCustomerDelivery(id);
          showToast('Que bom! Entrega confirmada.');
          await fetchOrderDetail();
        } catch (err: any) {
          showAlert(
            'Erro',
            err?.response?.data?.error ||
              'Não foi possível confirmar o recebimento.'
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleConfirmDispute = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await disputeCustomerDelivery(id, 'Cliente informou que não recebeu o pedido.');
      setActiveSheet(null);
      showToast('Contestação enviada à loja!');
      await fetchOrderDetail();
    } catch (err: any) {
      showAlert(
        'Erro',
        err?.response?.data?.error ||
          'Não foi possível registrar a contestação.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Timeline baseada nos dados do pedido (timeline vinda da API DRF ou construída)
  const getTimelineSteps = () => {
    if (order?.timeline && order.timeline.length > 0) {
      return order.timeline;
    }

    const base = [
      {
        status: 'PENDING' as CustomerOrderStatus,
        label: 'Pedido criado',
        description: 'Seu pedido foi recebido.',
        completed: true,
        current: order?.status === 'PENDING',
        date: formatDate(order?.created_at),
      },
      {
        status: 'PAID' as CustomerOrderStatus,
        label: 'Pagamento aprovado',
        description: 'Pagamento confirmado com sucesso.',
        completed: order ? order.status !== 'PENDING' : false,
        current: order?.status === 'PAID',
        date: null,
      },
      {
        status: 'PROCESSING' as CustomerOrderStatus,
        label: 'Em separação na loja',
        description: 'A loja está preparando seus itens.',
        completed: [
          'PROCESSING',
          'CANCEL_REQUESTED',
          'SHIPPED',
          'DELIVERED',
          'DELIVERY_DISPUTED',
          'REFUNDED',
        ].includes(order?.status || ''),
        current: ['PROCESSING', 'CANCEL_REQUESTED'].includes(
          order?.status || ''
        ),
        date: null,
      },
      {
        status: 'SHIPPED' as CustomerOrderStatus,
        label: 'Enviado pela transportadora',
        description: 'Sua encomenda está a caminho.',
        completed: [
          'SHIPPED',
          'DELIVERED',
          'DELIVERY_DISPUTED',
          'REFUNDED',
        ].includes(order?.status || ''),
        current: order?.status === 'SHIPPED',
        date: formatDate(order?.shipped_at),
      },
      {
        status: 'DELIVERED' as CustomerOrderStatus,
        label: 'Entregue',
        description: 'Seu pedido foi entregue.',
        completed: ['DELIVERED', 'REFUNDED'].includes(order?.status || ''),
        current: order?.status === 'DELIVERED',
        date: formatDate(order?.delivered_at),
      },
    ];

    if (order?.status === 'CANCEL_REQUESTED') {
      base.push({
        status: 'CANCEL_REQUESTED',
        label: 'Cancelamento solicitado',
        description: 'Aguardando resposta da loja.',
        completed: true,
        current: true,
        date: formatDate(order.cancel_requested_at),
      });
    } else if (order?.status === 'CANCELLED') {
      base.push({
        status: 'CANCELLED',
        label: 'Pedido cancelado',
        description: order.cancel_reason || 'Estorno iniciado.',
        completed: true,
        current: true,
        date: null,
      });
    } else if (order?.status === 'DELIVERY_DISPUTED') {
      base.push({
        status: 'DELIVERY_DISPUTED',
        label: 'Entrega contestada',
        description: 'A loja vai reenviar ou reembolsar.',
        completed: true,
        current: true,
        date: null,
      });
    } else if (order?.status === 'REFUNDED') {
      base.push({
        status: 'REFUNDED',
        label: 'Pedido reembolsado',
        description: 'O valor foi reembolsado.',
        completed: true,
        current: true,
        date: null,
      });
    }

    return base;
  };

  const formattedAddress = () => {
    if (!order?.shipping_address) return 'Endereço não informado';
    const a: any = order.shipping_address;
    const parts = [
      a.shipping_street || a.street,
      a.shipping_number || a.number,
      a.shipping_neighborhood || a.neighborhood,
      a.shipping_city || a.city,
      a.shipping_state || a.state || a.stateUf,
      a.shipping_zip_code || a.cep || a.zip_code,
    ].filter(Boolean);
    return parts.join(' · ');
  };

  const orderCode =
    order?.code || (id ? `#ORD-${String(id).padStart(4, '0')}` : 'Pedido');
  const statusCfg = order
    ? STATUS_CONFIG[order.status] || STATUS_CONFIG.PROCESSING
    : STATUS_CONFIG.PROCESSING;

  // Agrupamento dos itens por loja (sejam itens vindos de lojas distintas ou mesma loja)
  const storeGroups = useMemo(() => {
    if (!order?.items || order.items.length === 0) return [];

    const map = new Map<string, { storeName: string; items: typeof order.items }>();

    order.items.forEach((item) => {
      const storeName = item.store_name || order.store_name || 'Loja Parceira';
      if (!map.has(storeName)) {
        map.set(storeName, {
          storeName,
          items: [],
        });
      }
      map.get(storeName)!.items.push(item);
    });

    return Array.from(map.values());
  }, [order]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          style={styles.iconBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/orders' as never);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#1E2430" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedido {orderCode}</Text>
        <View style={styles.headerSpacer} />
      </View>

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
            <Text style={styles.loadingText}>Carregando detalhes do pedido...</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={36} color="#C62828" />
            <Text style={styles.errorText}>
              Não foi possível carregar as informações deste pedido da API.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchOrderDetail}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && order ? (
          <>
            {/* Card de Status Atual */}
            <View style={styles.card}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIconBox,
                    { backgroundColor: statusCfg.bg, borderColor: statusCfg.color },
                  ]}
                >
                  <Ionicons name={statusCfg.icon} size={22} color={statusCfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusEyebrow, { color: statusCfg.color }]}>
                    STATUS ATUAL
                  </Text>
                  <Text style={styles.statusMainTitle}>{statusCfg.label}</Text>
                  <Text style={styles.statusMainDescription}>
                    {statusCfg.description}
                  </Text>
                </View>
              </View>
            </View>

            {/* Alertas Contextuais Conforme Estado do Pedido */}
            {order.status === 'CANCEL_REQUESTED' ? (
              <View style={styles.alertBox}>
                <Ionicons name="time-outline" size={17} color="#6E4708" />
                <Text style={styles.alertBoxText}>
                  <Text style={{ fontWeight: '700' }}>
                    Aguardando resposta da loja
                  </Text>{' '}
                  — até 48h. Você será avisado quando a loja responder.
                </Text>
              </View>
            ) : null}

            {order.status === 'DELIVERED' &&
            order.delivery_confirmed_by === 'SELLER' ? (
              <View style={styles.alertBox}>
                <Ionicons name="alert-circle-outline" size={17} color="#6E4708" />
                <Text style={styles.alertBoxText}>
                  A loja marcou este pedido como entregue. Se não recebeu, você
                  tem até <Text style={{ fontWeight: '700' }}>7 dias</Text> para
                  contestar.
                </Text>
              </View>
            ) : null}

            {order.status === 'DELIVERY_DISPUTED' ? (
              <View style={styles.alertBox}>
                <Ionicons name="warning-outline" size={17} color="#6E4708" />
                <Text style={styles.alertBoxText}>
                  Contestação enviada. A loja vai{' '}
                  <Text style={{ fontWeight: '700' }}>reenviar o pedido</Text> ou{' '}
                  <Text style={{ fontWeight: '700' }}>reembolsar</Text> você.
                </Text>
              </View>
            ) : null}

            {order.status === 'SHIPPED' ? (
              <View style={[styles.alertBox, styles.alertInfo]}>
                <Ionicons name="calendar-outline" size={17} color="#1F4A8C" />
                <Text style={[styles.alertBoxText, { color: '#1F4A8C' }]}>
                  Sua encomenda está a caminho com a transportadora.
                </Text>
              </View>
            ) : null}

            {order.address_changed ? (
              <View style={[styles.alertBox, styles.alertInfo]}>
                <Ionicons name="location-outline" size={17} color="#1F4A8C" />
                <Text style={[styles.alertBoxText, { color: '#1F4A8C' }]}>
                  Endereço de entrega atualizado. A loja foi notificada.
                </Text>
              </View>
            ) : null}

            {/* BOTÕES DE AÇÃO POR STATUS */}
            <View style={styles.actionsContainer}>
              {/* Em PENDING ou PAID */}
              {['PENDING', 'PAID'].includes(order.status) ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={() => setActiveSheet('address')}
                  >
                    <Ionicons name="location-outline" size={17} color="#1B2A41" />
                    <Text style={styles.actionBtnText}>Alterar endereço</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCancelReason('');
                      setActiveSheet('cancel');
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" />
                    <Text
                      style={[styles.actionBtnText, { color: '#FFFFFF' }]}
                    >
                      Cancelar pedido
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {/* Em PROCESSING */}
              {order.status === 'PROCESSING' ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.8}
                    onPress={() => setActiveSheet('address')}
                  >
                    <Ionicons name="location-outline" size={17} color="#1B2A41" />
                    <Text style={styles.actionBtnText}>Alterar endereço</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDangerOutline]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCancelReason('');
                      setActiveSheet('cancel');
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={17} color="#C62828" />
                    <Text
                      style={[styles.actionBtnText, { color: '#C62828' }]}
                    >
                      Solicitar cancelamento
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {/* Em SHIPPED */}
              {order.status === 'SHIPPED' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSuccess]}
                  activeOpacity={0.8}
                  onPress={handleConfirmDeliveryAction}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                    Recebi meu pedido
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Em DELIVERED */}
              {order.status === 'DELIVERED' ? (
                <>
                  {order.delivery_confirmed_by === 'SELLER' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnSuccess]}
                        activeOpacity={0.8}
                        onPress={handleConfirmDeliveryAction}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text
                          style={[styles.actionBtnText, { color: '#FFFFFF' }]}
                        >
                          Recebi meu pedido
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDangerOutline]}
                        activeOpacity={0.8}
                        onPress={() => setActiveSheet('dispute')}
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={18}
                          color="#C62828"
                        />
                        <Text
                          style={[styles.actionBtnText, { color: '#C62828' }]}
                        >
                          Não recebi meu pedido
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {(() => {
                    const activeReturn = order.return_requests?.find((r) =>
                      ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED'].includes(r.status)
                    );

                    if (activeReturn) {
                      const returnLabels: Record<string, string> = {
                        REQUESTED: 'Devolução solicitada (em análise)',
                        APPROVED: 'Devolução aprovada (envie os itens)',
                        RECEIVED: 'Itens recebidos pela loja',
                        REFUNDED: 'Devolução concluída / reembolsada',
                      };
                      return (
                        <View style={[styles.alertBox, styles.alertInfo, { marginTop: 4, marginBottom: 8 }]}>
                          <Ionicons name="arrow-undo-outline" size={16} color="#1F4A8C" />
                          <Text style={[styles.alertBoxText, { color: '#1F4A8C', fontWeight: '600' }]}>
                            {returnLabels[activeReturn.status] || 'Devolução em andamento'}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/orders/${id}/return` as never)}
                      >
                        <Ionicons name="arrow-undo-outline" size={17} color="#1B2A41" />
                        <Text style={styles.actionBtnText}>Solicitar devolução</Text>
                      </TouchableOpacity>
                    );
                  })()}

                  <Text style={styles.policySubtext}>
                    Devolução e contestação disponíveis até 7 dias após a entrega
                  </Text>
                </>
              ) : null}

              {/* Em DELIVERY_DISPUTED */}
              {order.status === 'DELIVERY_DISPUTED' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnNavy]}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(shop)/chat',
                      params: { order_id: id },
                    } as never)
                  }
                >
                  <Ionicons name="chatbubbles-outline" size={17} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                    Conversar com a loja
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Card de Rastreio (se houver código) */}
            {order.tracking_code ? (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.sectionSmallTitle}>
                    RASTREIO · {(order.carrier || 'CORREIOS').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.cardRow, { marginTop: 6 }]}>
                  <Text style={styles.trackingNumber}>{order.tracking_code}</Text>
                  <TouchableOpacity
                    accessibilityLabel="Copiar código de rastreio"
                    style={styles.iconBtn}
                    onPress={copyTracking}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={16} color="#1E2430" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.externalTrackingBtn}
                  onPress={openCarrierTracking}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={14} color="#1B2A41" />
                  <Text style={styles.externalTrackingBtnText}>
                    Rastrear no site dos {order.carrier || 'Correios'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Resumo dos Itens e Valores */}
            <Text style={styles.sectionHeaderTitle}>Resumo</Text>
            <View style={styles.card}>
              {storeGroups.map((group, groupIdx) => (
                <View
                  key={group.storeName}
                  style={groupIdx > 0 ? styles.storeGroupSection : undefined}
                >
                  <View style={styles.storeNameRow}>
                    <Ionicons name="business-outline" size={14} color="#6B6F78" />
                    <Text style={styles.storeNameText}>{group.storeName}</Text>
                  </View>

                  {group.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemThumb}>
                        {item.product_image ? (
                          <Image
                            source={{ uri: item.product_image }}
                            style={styles.itemImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <Ionicons name="beaker-outline" size={18} color="#9A8F7A" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>{item.product_name}</Text>
                        <Text style={styles.itemMetaText}>
                          {formatProductVolume(item.volume_ml, 'Produto')} ·
                          Qtd {item.quantity}
                        </Text>

                        {/* Botão de Avaliar ou Ver Avaliação do item entregue (RF-16) */}
                        {order.status === 'DELIVERED' && item.can_review ? (
                          <TouchableOpacity
                            style={styles.reviewItemBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/reviews/new',
                                params: {
                                  order_item_id: item.id,
                                  product_name: item.product_name,
                                  product_image: item.product_image || '',
                                },
                              } as never)
                            }
                          >
                            <Ionicons name="star" size={12} color="#D97706" />
                            <Text style={styles.reviewItemBtnText}>Avaliar item</Text>
                          </TouchableOpacity>
                        ) : order.status === 'DELIVERED' && item.review_id ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            <TouchableOpacity
                              style={[styles.reviewItemBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', marginTop: 0 }]}
                              onPress={() =>
                                router.push({
                                  pathname: '/reviews/new',
                                  params: {
                                    review_id: item.review_id,
                                    product_name: item.product_name,
                                    product_image: item.product_image || '',
                                    can_edit: item.can_edit_review ? 'true' : 'false',
                                  },
                                } as never)
                              }
                            >
                              <Ionicons name="star" size={12} color="#F59E0B" />
                              <Text style={[styles.reviewItemBtnText, { color: '#374151' }]}>Ver avaliação</Text>
                            </TouchableOpacity>
                            {item.review_reply ? (
                              <TouchableOpacity
                                style={[styles.reviewItemBtn, { backgroundColor: '#EBF5FF', borderColor: '#BAE6FD', marginTop: 0 }]}
                                onPress={() =>
                                  router.push({
                                    pathname: '/reviews/new',
                                    params: {
                                      review_id: item.review_id,
                                      product_name: item.product_name,
                                      product_image: item.product_image || '',
                                      can_edit: item.can_edit_review ? 'true' : 'false',
                                    },
                                  } as never)
                                }
                              >
                                <Ionicons name="chatbubble-ellipses-outline" size={11} color="#0284C7" />
                                <Text style={[styles.reviewItemBtnText, { color: '#0369A1' }]}>Loja respondeu</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.itemPriceText}>
                        {formatCurrency(
                          item.total_price ||
                            Number(item.unit_price) * item.quantity
                        )}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={styles.summaryFooter}>
                <View style={styles.cardRow}>
                  <Text style={styles.metaLabel}>Frete</Text>
                  <Text style={styles.metaLabel}>
                    {formatCurrency(order.shipping_cost || 0)}
                  </Text>
                </View>
                <View style={[styles.cardRow, { marginTop: 6 }]}>
                  <Text style={styles.totalBoldLabel}>Total</Text>
                  <Text style={styles.totalBoldValue}>
                    {formatCurrency(order.total_amount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Endereço de Entrega */}
            <View style={styles.card}>
              <Text style={styles.sectionSmallTitle}>ENDEREÇO DE ENTREGA</Text>
              <Text style={styles.addressBodyText}>{formattedAddress()}</Text>
            </View>

            {/* Histórico do Pedido (Timeline) */}
            <Text style={styles.sectionHeaderTitle}>Histórico do pedido</Text>
            <View style={styles.card}>
              <View style={styles.timelineWrapper}>
                {getTimelineSteps().map((step, idx, arr) => {
                  const isDone = step.completed && !step.current;
                  const isCur = step.current;
                  const isLast = idx === arr.length - 1;

                  return (
                    <View key={step.label} style={styles.timelineStepRow}>
                      <View style={styles.timelineLeftCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone && styles.timelineDotDone,
                            isCur && [
                              styles.timelineDotCurrent,
                              { backgroundColor: statusCfg.color },
                            ],
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          ) : null}
                        </View>
                        {!isLast ? (
                          <View
                            style={[
                              styles.timelineLine,
                              isDone && styles.timelineLineDone,
                            ]}
                          />
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.timelineRightCol,
                          !isLast && { paddingBottom: 16 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timelineStepTitle,
                            isCur && { color: statusCfg.color },
                          ]}
                        >
                          {step.label}
                        </Text>
                        <Text style={styles.timelineStepDesc}>
                          {step.description}
                        </Text>
                        {step.date ? (
                          <Text style={styles.timelineStepDate}>
                            {step.date}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Toast flutuante */}
      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {/* MODAL BOTTOM-SHEET: CANCELAMENTO */}
      <Modal
        visible={activeSheet === 'cancel'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>
              {order?.status === 'PROCESSING'
                ? 'Solicitar cancelamento'
                : 'Cancelar pedido'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {order?.status === 'PROCESSING'
                ? 'A loja já está separando seu pedido. Ela tem até 48h para aprovar ou recusar.'
                : 'O valor será estornado e os itens voltam ao estoque da loja.'}
            </Text>

            {CANCEL_REASONS.map((reason) => {
              const isSelected = cancelReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.sheetOption, isSelected && styles.sheetOptionOn]}
                  onPress={() => setCancelReason(reason)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleOn]}>
                    {isSelected ? <View style={styles.radioInnerDot} /> : null}
                  </View>
                  <Text style={styles.sheetOptionText}>{reason}</Text>
                </TouchableOpacity>
              );
            })}

            {cancelReason === 'Outro motivo' ? (
              <TextInput
                style={styles.sheetInput}
                placeholder="Descreva o motivo (obrigatório)"
                value={customReason}
                onChangeText={setCustomReason}
              />
            ) : null}

            <TouchableOpacity
              style={[
                styles.actionBtn,
                order?.status === 'PROCESSING'
                  ? styles.actionBtnNavy
                  : styles.actionBtnDanger,
                (!cancelReason ||
                  (cancelReason === 'Outro motivo' && !customReason.trim())) &&
                  styles.actionBtnDisabled,
                { marginTop: 12 },
              ]}
              disabled={
                actionLoading ||
                !cancelReason ||
                (cancelReason === 'Outro motivo' && !customReason.trim())
              }
              onPress={handleConfirmCancel}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  {order?.status === 'PROCESSING'
                    ? 'Enviar solicitação'
                    : 'Confirmar cancelamento'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { marginBottom: 0 }]}
              onPress={() => setActiveSheet(null)}
            >
              <Text style={styles.actionBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PADRÃO: ALTERAR ENDEREÇO (IGUAL A MEUS ENDEREÇOS) */}
      <Modal
        visible={activeSheet === 'address'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSheet(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.addressModalOverlay}
        >
          <View style={styles.addressModalCard}>
            <View style={styles.addressModalHeader}>
              <View>
                <Text style={styles.addressModalTitle}>Alterar Endereço</Text>
                <Text style={styles.addressModalSubtitle}>
                  Entrega na mesma cidade/UF do pedido
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveSheet(null)}
                activeOpacity={0.6}
              >
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Identificador (Casa, Trabalho...) */}
              <View style={styles.addressInputGroup}>
                <Text style={styles.addressInputLabel}>Identificador</Text>
                <View style={styles.addressTagRow}>
                  {['Casa', 'Trabalho', 'Outro'].map((tagOption) => (
                    <TouchableOpacity
                      key={tagOption}
                      style={[
                        styles.addressTagBtn,
                        tag === tagOption && styles.addressTagBtnActive,
                      ]}
                      onPress={() => setTag(tagOption)}
                    >
                      <Text
                        style={[
                          styles.addressTagText,
                          tag === tagOption && styles.addressTagTextActive,
                        ]}
                      >
                        {tagOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* CEP com busca automática */}
              <View style={styles.addressInputGroup}>
                <Text style={styles.addressInputLabel}>CEP</Text>
                <View style={styles.addressInputWithIcon}>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="00000-000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={zipCode}
                    onChangeText={handleCepSearch}
                    maxLength={9}
                  />
                  {isSearchingCep && (
                    <ActivityIndicator
                      size="small"
                      color="#273847"
                      style={styles.addressInputSpinner}
                    />
                  )}
                </View>
              </View>

              {/* Rua */}
              <View style={styles.addressInputGroup}>
                <Text style={styles.addressInputLabel}>Rua / Logradouro</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Ex: Av. Paulista"
                  placeholderTextColor="#9CA3AF"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>

              {/* Número & Complemento */}
              <View style={styles.addressRowTwoCols}>
                <View style={[styles.addressInputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.addressInputLabel}>Número</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="123"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={number}
                    onChangeText={setNumber}
                  />
                </View>

                <View style={[styles.addressInputGroup, { flex: 1.4, marginLeft: 8 }]}>
                  <Text style={styles.addressInputLabel}>Complemento</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="Apto, Bloco..."
                    placeholderTextColor="#9CA3AF"
                    value={complement}
                    onChangeText={setComplement}
                  />
                </View>
              </View>

              {/* Bairro */}
              <View style={styles.addressInputGroup}>
                <Text style={styles.addressInputLabel}>Bairro</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Bairro"
                  placeholderTextColor="#9CA3AF"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
              </View>

              {/* Cidade & UF */}
              <View style={styles.addressRowTwoCols}>
                <View style={[styles.addressInputGroup, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.addressInputLabel}>Cidade</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="Cidade"
                    placeholderTextColor="#9CA3AF"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={[styles.addressInputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.addressInputLabel}>UF</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="SP"
                    placeholderTextColor="#9CA3AF"
                    maxLength={2}
                    autoCapitalize="characters"
                    value={stateUF}
                    onChangeText={setStateUF}
                  />
                </View>
              </View>

              {addressError ? (
                <View style={styles.addressErrorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#8E1B14" />
                  <Text style={styles.addressErrorText}>
                    Não é possível mudar para outra cidade ou estado. Para isso, cancele e refaça o pedido.
                  </Text>
                </View>
              ) : null}

              {/* Botões do Modal */}
              <View style={styles.addressModalActions}>
                <TouchableOpacity
                  style={styles.addressModalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setActiveSheet(null)}
                >
                  <Text style={styles.addressModalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addressModalSaveBtn}
                  activeOpacity={0.88}
                  disabled={actionLoading}
                  onPress={handleSaveAddress}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addressModalSaveText}>Salvar Endereço</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL BOTTOM-SHEET: CONTESTAÇÃO DE ENTREGA */}
      <Modal
        visible={activeSheet === 'dispute'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveSheet(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Não recebi meu pedido</Text>
            <Text style={styles.sheetSubtitle}>
              A loja será avisada e vai reenviar o pedido com novo rastreio ou
              reembolsar você.
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger, { marginTop: 12 }]}
              disabled={actionLoading}
              onPress={handleConfirmDispute}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  Confirmar contestação
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { marginBottom: 0 }]}
              onPress={() => setActiveSheet(null)}
            >
              <Text style={styles.actionBtnText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ELEGANTE DE AVISOS E CONFIRMAÇÕES (PADRÃO APP) */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalBox}>
            <View style={[styles.confirmModalIconCircle, confirmModal.isDanger && styles.confirmModalIconDanger]}>
              <Ionicons
                name={confirmModal.isDanger ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={28}
                color={confirmModal.isDanger ? '#BA1A1A' : '#2C4659'}
              />
            </View>
            <Text style={styles.confirmModalTitle}>{confirmModal.title}</Text>
            <Text style={styles.confirmModalMessage}>{confirmModal.message}</Text>

            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmModalCancelBtn}
                activeOpacity={0.7}
                onPress={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={styles.confirmModalCancelText}>{confirmModal.cancelText || 'Cancelar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmModalConfirmBtn, confirmModal.isDanger && styles.confirmModalConfirmBtnDanger]}
                activeOpacity={0.88}
                onPress={() => {
                  setConfirmModal((prev) => ({ ...prev, visible: false }));
                  confirmModal.onConfirm();
                }}
              >
                <Text style={styles.confirmModalConfirmText}>{confirmModal.confirmText || 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statusMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E2430',
    marginTop: 1,
  },
  statusMainDescription: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 2,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#FBF0D9',
  },
  alertInfo: {
    backgroundColor: '#E3ECF8',
  },
  alertBoxText: {
    fontSize: 12,
    color: '#6E4708',
    flex: 1,
    lineHeight: 17,
  },
  actionsContainer: {
    marginBottom: 10,
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1B2A41',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B2A41',
  },
  actionBtnSuccess: {
    backgroundColor: '#2F7D4F',
    borderColor: '#2F7D4F',
  },
  actionBtnNavy: {
    backgroundColor: '#1B2A41',
    borderColor: '#1B2A41',
  },
  actionBtnDanger: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  actionBtnDangerOutline: {
    borderColor: '#C62828',
    backgroundColor: '#FFFFFF',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  policySubtext: {
    fontSize: 11,
    color: '#6B6F78',
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 8,
  },
  sectionSmallTitle: {
    fontSize: 10,
    color: '#6B6F78',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#1E2430',
  },
  externalTrackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  externalTrackingBtnText: {
    fontSize: 12,
    color: '#1B2A41',
    fontWeight: '600',
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2430',
    marginTop: 12,
    marginBottom: 8,
  },
  storeGroupSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3EFE6',
    paddingTop: 12,
    marginTop: 6,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  storeNameText: {
    fontSize: 12,
    color: '#6B6F78',
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  itemThumb: {
    width: 40,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#EFE8DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2430',
  },
  itemMetaText: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 2,
  },
  reviewItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reviewItemBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2430',
  },
  summaryFooter: {
    borderTopWidth: 0.5,
    borderTopColor: '#E4DDD0',
    paddingTop: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B6F78',
  },
  totalBoldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2430',
  },
  totalBoldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2430',
  },
  addressBodyText: {
    fontSize: 13,
    color: '#1E2430',
    marginTop: 4,
    lineHeight: 18,
  },
  timelineWrapper: {
    paddingLeft: 4,
  },
  timelineStepRow: {
    flexDirection: 'row',
  },
  timelineLeftCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E4DDD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: '#5C6B4A',
  },
  timelineDotCurrent: {
    shadowColor: '#1B2A41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E4DDD0',
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: '#5C6B4A',
  },
  timelineRightCol: {
    flex: 1,
    paddingLeft: 10,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2430',
  },
  timelineStepDesc: {
    fontSize: 12,
    color: '#6B6F78',
    marginTop: 1,
  },
  timelineStepDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
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
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    backgroundColor: '#1B2A41',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 99,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 18, 15, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#F4F0E8',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '88%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2430',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#6B6F78',
    marginBottom: 14,
    lineHeight: 17,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  sheetOptionOn: {
    borderColor: '#1B2A41',
    borderWidth: 1.5,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B9B2A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleOn: {
    borderColor: '#1B2A41',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1B2A41',
  },
  sheetOptionText: {
    fontSize: 13,
    color: '#1E2430',
    fontWeight: '500',
  },
  sheetInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E2430',
    marginTop: 6,
    marginBottom: 6,
  },
  formContainer: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    fontSize: 10,
    color: '#6B6F78',
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 14,
    color: '#1E2430',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  addressErrorBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FBE3E0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  addressErrorText: {
    fontSize: 12,
    color: '#8E1B14',
    flex: 1,
    lineHeight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  // Modal de Endereço idêntico ao padrão de Meus Endereços
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addressModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE4',
    paddingBottom: 10,
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C252E',
  },
  addressModalSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  addressInputGroup: {
    marginBottom: 12,
  },
  addressInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
  },
  addressTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addressTagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E4D8',
    backgroundColor: '#FAF9F5',
  },
  addressTagBtnActive: {
    backgroundColor: '#273847',
    borderColor: '#273847',
  },
  addressTagText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  addressTagTextActive: {
    color: '#FFFFFF',
  },
  addressInputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  addressInput: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E8E4D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 14,
    color: '#1C252E',
  },
  addressInputSpinner: {
    position: 'absolute',
    right: 12,
  },
  addressRowTwoCols: {
    flexDirection: 'row',
  },
  addressModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  addressModalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  addressModalSaveBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A85A38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModalSaveText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal de Avisos e Confirmações
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  confirmModalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAEFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmModalIconDanger: {
    backgroundColor: '#FDECEB',
  },
  confirmModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmModalMessage: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmModalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmModalConfirmBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#273847',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalConfirmBtnDanger: {
    backgroundColor: '#BA1A1A',
  },
  confirmModalConfirmText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});