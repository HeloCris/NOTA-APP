import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as customerOrders from '@/services/customerOrders';
import {
  getCustomerOrder,
  type CustomerOrderDetail,
} from '@/services/customerOrders';

type ReturnPayload = {
  reason: string;
  description: string;
  items: { order_item_id: string; quantity: number }[];
};

const createReturn =
  (
    customerOrders as unknown as {
      createReturn?: (orderId: string, payload: ReturnPayload) => Promise<unknown>;
      createReturnRequest?: (orderId: string, payload: ReturnPayload) => Promise<unknown>;
      requestReturn?: (orderId: string, payload: ReturnPayload) => Promise<unknown>;
    }
  ).createReturn ??
  (
    customerOrders as unknown as {
      createReturnRequest?: (orderId: string, payload: ReturnPayload) => Promise<unknown>;
    }
  ).createReturnRequest ??
  (
    customerOrders as unknown as {
      requestReturn?: (orderId: string, payload: ReturnPayload) => Promise<unknown>;
    }
  ).requestReturn;

const RETURN_REASONS = [
  'Produto com defeito / avariado',
  'Produto diferente do anunciado',
  'Tamanho incorreto',
  'Arrependimento da compra',
  'Outro motivo',
];

export default function OrderReturnScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;
    getCustomerOrder(id)
      .then((data) => {
        setOrder(data);
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível carregar os dados do pedido.');
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleItem = (itemId: string | number, maxQty: number) => {
    const key = String(itemId);
    setSelectedItems((prev) => {
      const current = prev[key] || 0;
      if (current > 0) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }
      return { ...prev, [key]: 1 };
    });
  };

  const handleQuantityChange = (itemId: string | number, delta: number, maxQty: number) => {
    const key = String(itemId);
    setSelectedItems((prev) => {
      const current = prev[key] || 0;
      const next = current + delta;
      if (next <= 0) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }
      if (next > maxQty) return prev;
      return { ...prev, [key]: next };
    });
  };

  const handleSubmitReturn = async () => {
    if (!id) return;
    if (!selectedReason) {
      Alert.alert('Atenção', 'Selecione o motivo da devolução.');
      return;
    }

    const itemsPayload = Object.entries(selectedItems).map(([order_item_id, quantity]) => ({
      order_item_id: String(order_item_id),
      quantity,
    }));

    if (itemsPayload.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um produto para devolver.');
      return;
    }

    if (!createReturn) {
      Alert.alert('Erro', 'A solicitação de devolução não está disponível no momento.');
      return;
    }

    try {
      setSubmitting(true);
      await createReturn(id, {
        reason: selectedReason,
        description: description.trim(),
        items: itemsPayload,
      });

      Alert.alert('Sucesso', 'Solicitação de devolução enviada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Erro',
        err?.response?.data?.error || 'Não foi possível solicitar a devolução.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A85A38" />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Solicitar Devolução</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Selecione os produtos do pedido #{order?.code || id} que deseja devolver:
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ITENS DO PEDIDO</Text>
            {order?.items?.map((item) => {
              const itemKey = String(item.id);
              const qtySelected = selectedItems[itemKey] || 0;
              const isSelected = qtySelected > 0;

              return (
                <View key={item.id} style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
                  <TouchableOpacity
                    style={styles.itemHeader}
                    activeOpacity={0.8}
                    onPress={() => handleToggleItem(item.id, item.quantity)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? '#A85A38' : '#78716C'}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemPrice}>
                        R$ {Number(item.unit_price || 0).toFixed(2).replace('.', ',')} (Qtd comprada: {item.quantity})
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {isSelected ? (
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>Qtd. a devolver:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleQuantityChange(item.id, -1, item.quantity)}
                        >
                          <Ionicons name="remove" size={16} color="#273847" />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qtySelected}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleQuantityChange(item.id, 1, item.quantity)}
                        >
                          <Ionicons name="add" size={16} color="#273847" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOTIVO DA DEVOLUÇÃO</Text>
            {RETURN_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES (OPCIONAL)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva detalhes sobre o motivo ou estado do produto..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={handleSubmitReturn}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F4F1EA', flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  subtitle: { fontSize: 14, color: '#78716C', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: '#A85A38',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3D8',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  itemCardSelected: {
    borderColor: '#A85A38',
    backgroundColor: '#FBF7F5',
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#273847' },
  itemPrice: { fontSize: 12, color: '#78716C', marginTop: 2 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEAE1',
  },
  quantityLabel: { fontSize: 13, color: '#273847', fontWeight: '600' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EEF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: { fontSize: 14, fontWeight: '800', color: '#273847' },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E3D8',
  },
  reasonOptionSelected: {
    borderColor: '#A85A38',
    backgroundColor: '#F7E8E1',
  },
  reasonText: { fontSize: 14, color: '#273847' },
  reasonTextSelected: { fontWeight: '700', color: '#A85A38' },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3D8',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#273847',
    textAlignVertical: 'top',
    height: 100,
  },
  submitButton: {
    backgroundColor: '#A85A38',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});