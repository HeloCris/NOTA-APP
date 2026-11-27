import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getCustomerOrder,
  requestCustomerReturn,
  type CustomerOrderDetail,
} from '@/services/customerOrders';
import { formatProductVolume } from '@/utils/productUtils';

const RETURN_REASONS = [
  'Produto com defeito',
  'Diferente do anunciado',
  'Chegou avariado',
  'Não gostei da fragrância',
];

type SelectedPhotoAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function OrderReturnScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<SelectedPhotoAsset[]>([]);

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isError?: boolean;
    onOk?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    isError: false,
  });

  const showFeedback = (
    title: string,
    message: string,
    options?: { isError?: boolean; onOk?: () => void }
  ) => {
    setFeedbackModal({
      visible: true,
      title,
      message,
      isError: options?.isError ?? false,
      onOk: options?.onOk,
    });
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    getCustomerOrder(id)
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch(() => {
        if (isMounted) {
          showFeedback('Erro', 'Não foi possível carregar os dados do pedido.', {
            isError: true,
            onOk: () => router.back(),
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, router]);

  const handleToggleItem = (itemId: string | number, maxQty: number) => {
    if (maxQty <= 0) return;
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

  const handleQuantityChange = (
    itemId: string | number,
    delta: number,
    maxQty: number
  ) => {
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

  const pickImage = async () => {
    if (photos.length >= 3) {
      showFeedback('Limite de fotos', 'Você pode adicionar no máximo 3 fotos.', {
        isError: true,
      });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showFeedback(
        'Permissão necessária',
        'Precisamos de permissão para acessar a galeria.',
        { isError: true }
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setPhotos((prev) => [
        ...prev,
        {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
        },
      ]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async () => {
    if (!id || submitting) return;
    if (!selectedReason) {
      showFeedback('Atenção', 'Selecione o motivo da devolução.', {
        isError: true,
      });
      return;
    }

    const itemsPayload = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([order_item_id, quantity]) => ({
        order_item_id: String(order_item_id),
        quantity,
      }));

    if (itemsPayload.length === 0) {
      showFeedback('Atenção', 'Selecione ao menos um produto para devolver.', {
        isError: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      if (photos.length > 0) {
        const formData = new FormData();
        formData.append('reason', selectedReason);
        formData.append('description', description.trim());
        formData.append('items', JSON.stringify(itemsPayload));

        for (let idx = 0; idx < photos.length; idx++) {
          const asset = photos[idx];
          const uri = asset.uri;
          const rawExt = uri.split('?')[0].split('.').pop()?.toLowerCase();
          const ext = rawExt && ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
          const filename = asset.fileName || `return_photo_${idx + 1}.${ext}`;
          const mimeType =
            asset.mimeType ||
            (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

          if (Platform.OS === 'web') {
            try {
              const res = await fetch(uri);
              const blob = await res.blob();
              formData.append('photos', blob, filename);
            } catch {
              formData.append('photos', {
                uri,
                name: filename,
                type: mimeType,
              } as any);
            }
          } else {
            formData.append('photos', {
              uri,
              name: filename,
              type: mimeType,
            } as any);
          }
        }

        await requestCustomerReturn(id, formData);
      } else {
        const payload = {
          reason: selectedReason,
          description: description.trim(),
          items: itemsPayload,
        };
        await requestCustomerReturn(id, payload);
      }

      showFeedback(
        'Solicitação Enviada',
        'Devolução solicitada. A loja tem até 48h para analisar.',
        {
          isError: false,
          onOk: () => router.back(),
        }
      );
    } catch (err: any) {
      showFeedback(
        'Erro',
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Não foi possível solicitar a devolução.',
        { isError: true }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalItemsSelected = Object.values(selectedItems).reduce(
    (a, b) => a + b,
    0
  );
  const isValid = totalItemsSelected > 0 && !!selectedReason;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#1B2A41" />
        </View>
      </SafeAreaView>
    );
  }

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
              router.replace(`/orders/${id}` as never);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#1E2430" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar devolução</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenSubtitle}>
            Escolha o que deseja devolver do pedido #{order?.code || id}.
          </Text>

          {/* Seleção de Itens e Quantidades */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ITENS DO PEDIDO</Text>
            {order?.items?.map((item) => {
              const itemKey = String(item.id);
              const maxAvailable =
                item.available_return_quantity !== undefined
                  ? item.available_return_quantity
                  : item.quantity;
              const isAlreadyReturned = maxAvailable <= 0;
              const qtySelected = selectedItems[itemKey] || 0;
              const isSelected = qtySelected > 0;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                    isAlreadyReturned && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.itemRow}>
                    <TouchableOpacity
                      style={styles.itemCheckWrapper}
                      disabled={isAlreadyReturned}
                      onPress={() => handleToggleItem(item.id, maxAvailable)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemThumb}>
                        {item.product_image ? (
                          <Image
                            source={{ uri: item.product_image }}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="beaker-outline" size={18} color="#9A8F7A" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        <Text style={styles.itemMeta}>
                          {formatProductVolume(item.volume_ml, 'Produto')} ·
                          comprado: {item.quantity} un.
                        </Text>
                        {isAlreadyReturned ? (
                          <Text style={{ fontSize: 11, color: '#A85A38', fontWeight: '700', marginTop: 2 }}>
                            Devolução já solicitada para este item
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Controles de Quantidade */}
                    {!isAlreadyReturned ? (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() =>
                            handleQuantityChange(item.id, -1, maxAvailable)
                          }
                        >
                          <Text style={styles.qtyBtnSymbol}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyNumber}>{qtySelected}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() =>
                            handleQuantityChange(item.id, 1, maxAvailable)
                          }
                        >
                          <Text style={styles.qtyBtnSymbol}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Motivo da Devolução */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOTIVO</Text>
            {RETURN_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    isSelected && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleOn,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioInnerDot} /> : null}
                  </View>
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fotos (Opcional - até 3) */}
          <View style={styles.section}>
            <View style={styles.photosTitleRow}>
              <Text style={styles.sectionTitle}>FOTOS</Text>
              <Text style={styles.optionalHint}>(opcional - até 3)</Text>
            </View>

            <View style={styles.photosContainer}>
              {photos.map((photo, idx) => (
                <View key={idx} style={styles.photoThumbWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => removePhoto(idx)}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 3 ? (
                <TouchableOpacity
                  style={styles.addPhotoBox}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={22} color="#6B6F78" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Observações Opcionais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES (OPCIONAL)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva detalhes sobre o estado do produto..."
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Botão de Envio */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              !isValid && styles.submitBtnDisabled,
            ]}
            disabled={!isValid || submitting}
            onPress={handleSubmitReturn}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar solicitação</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLinkBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Feedback Padrão */}
      <Modal
        visible={feedbackModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFeedbackModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View
              style={[
                styles.modalIconCircle,
                feedbackModal.isError && styles.modalIconDanger,
              ]}
            >
              <Ionicons
                name={
                  feedbackModal.isError
                    ? 'alert-circle-outline'
                    : 'checkmark-circle-outline'
                }
                size={28}
                color={feedbackModal.isError ? '#BA1A1A' : '#1B2A41'}
              />
            </View>
            <Text style={styles.modalTitle}>{feedbackModal.title}</Text>
            <Text style={styles.modalMessage}>{feedbackModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalOkBtn,
                feedbackModal.isError && styles.modalOkBtnDanger,
              ]}
              activeOpacity={0.88}
              onPress={() => {
                const callback = feedbackModal.onOk;
                setFeedbackModal((prev) => ({ ...prev, visible: false }));
                callback?.();
              }}
            >
              <Text style={styles.modalOkBtnText}>OK</Text>
            </TouchableOpacity>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  screenSubtitle: {
    fontSize: 12,
    color: '#6B6F78',
    marginBottom: 16,
    lineHeight: 17,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E2430',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemCardSelected: {
    borderColor: '#1B2A41',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemCheckWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemThumb: {
    width: 36,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#EFE8DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2430',
  },
  itemMeta: {
    fontSize: 11,
    color: '#6B6F78',
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 16,
    backgroundColor: '#F4F0E8',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnSymbol: {
    fontSize: 15,
    color: '#1E2430',
    fontWeight: '600',
  },
  qtyNumber: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#1E2430',
  },
  reasonOption: {
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
  reasonOptionSelected: {
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
  reasonText: {
    fontSize: 13,
    color: '#1E2430',
    fontWeight: '500',
  },
  photosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  optionalHint: {
    fontSize: 11,
    color: '#6B6F78',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumbWrapper: {
    position: 'relative',
    width: 58,
    height: 58,
  },
  photoImg: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#C62828',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBox: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9B2A3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#1E2430',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  submitBtn: {
    backgroundColor: '#1B2A41',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2A41',
    paddingVertical: 12,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#1B2A41',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
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
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAEFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconDanger: {
    backgroundColor: '#FDECEB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalOkBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B2A41',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOkBtnDanger: {
    backgroundColor: '#BA1A1A',
  },
  modalOkBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});