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
  createReview,
  deleteReview,
  getCustomerReview,
  updateReview,
  type Review,
} from '@/services/reviews';



export default function NewReviewScreen() {
  const router = useRouter();
  const {
    order_item_id,
    product_name,
    product_image,
    review_id,
    can_edit,
  } = useLocalSearchParams<{
    order_item_id?: string;
    product_name?: string;
    product_image?: string;
    review_id?: string;
    can_edit?: string;
  }>();

  const isExistingReview = Boolean(review_id);
  const paramCanEdit = can_edit === 'true' || can_edit === '1';

  // Modo de edição: se for nova avaliação, já entra editável. Se for existente, começa inativo até clicar em Editar.
  const [isEditing, setIsEditing] = useState(() => !isExistingReview);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(() => Boolean(review_id));
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<Review | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Modal Customizado Padrão da Interface
  const [customModal, setCustomModal] = useState<{
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

  const showModalAlert = (title: string, message?: string, onOk?: () => void) => {
    setCustomModal({
      visible: true,
      title,
      message: message || '',
      confirmText: 'OK',
      cancelText: '',
      isDanger: false,
      onConfirm: () => {
        onOk?.();
      },
    });
  };

  const showModalConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }) => {
    setCustomModal({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      isDanger: !!options.isDanger,
      onConfirm: options.onConfirm,
    });
  };

  // RN-07: Se a avaliação já tiver sido editada (edited_at não nulo ou can_edit falso retornado pelo servidor), NÃO pode editar.
  const canEditReview = Boolean(
    isExistingReview &&
      (reviewData ? reviewData.can_edit && !reviewData.edited_at : paramCanEdit)
  );

  useEffect(() => {
    if (!review_id) return;
    let isMounted = true;
    getCustomerReview(review_id)
      .then((data) => {
        if (!isMounted) return;
        setReviewData(data);
        setRating(data.rating || 5);
        setComment(data.comment || '');
        if (data.photos && data.photos.length > 0) {
          setPhotos(data.photos.map((p) => p.image));
        }
        // Se a avaliação já foi editada, desativa qualquer modo de edição
        if (data.edited_at || data.can_edit === false) {
          setIsEditing(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar avaliação:', err);
        showModalAlert('Atenção', 'Não foi possível carregar os dados da avaliação.');
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [review_id]);

  const finalProductImage =
    product_image ||
    reviewData?.product_image ||
    null;

  const isFormEditable = !isExistingReview || (canEditReview && isEditing);

  const pickImage = async () => {
    if (!isFormEditable) return;
    if (photos.length >= 3) {
      showModalAlert('Limite de fotos', 'Você pode adicionar no máximo 3 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showModalAlert(
        'Permissão necessária',
        'Precisamos de permissão para acessar a galeria.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    if (!isFormEditable) return;
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (!review_id) return;
    showModalConfirm({
      title: 'Excluir avaliação',
      message: 'Tem certeza de que deseja excluir sua avaliação? De acordo com as regras, você não poderá avaliar este item novamente após a exclusão.',
      confirmText: 'Excluir avaliação',
      cancelText: 'Cancelar',
      isDanger: true,
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await deleteReview(review_id);
          showModalAlert('Excluir avaliação', 'Sua avaliação foi removida com sucesso.', () => {
            router.back();
          });
        } catch (err: any) {
          showModalAlert(
            'Excluir avaliação',
            err?.response?.data?.error || 'Não foi possível excluir a avaliação.'
          );
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      showModalAlert('Atenção', 'Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    try {
      setSubmitting(true);
      if (isExistingReview && review_id) {
        // RN-07: Edição única em até 30 dias
        await updateReview(review_id, {
          rating,
          comment: comment.trim(),
          photos,
        });
        showModalAlert('Editar avaliação', 'Sua avaliação foi atualizada com sucesso!', () => {
          setIsEditing(false);
          router.back();
        });
      } else {
        if (!order_item_id) {
          showModalAlert('Erro', 'Item não identificado.');
          return;
        }
        await createReview({
          order_item: order_item_id,
          rating,
          comment: comment.trim(),
          photos,
        });
        showModalAlert('Confirmar avaliação', 'Avaliação enviada com sucesso!', () => {
          router.back();
        });
      }
    } catch (err: any) {
      showModalAlert(
        isExistingReview ? 'Editar avaliação' : 'Confirmar avaliação',
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          'Não foi possível registrar sua avaliação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Voltar"
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#1E2430" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isExistingReview
            ? isEditing
              ? 'Editar Avaliação'
              : 'Sua Avaliação'
            : 'Avaliar Produto'}
        </Text>
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
          {loadingInitial ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#1B2A41" size="small" />
              <Text style={{ marginTop: 8, fontSize: 13, color: '#6B6F78' }}>
                Carregando sua avaliação...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.productBanner}>
                <View style={styles.thumb}>
                  {finalProductImage ? (
                    <Image
                      source={{ uri: finalProductImage }}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="beaker-outline" size={20} color="#9A8F7A" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>
                    {product_name || reviewData?.product_name || 'Produto comprado'}
                  </Text>
                  <Text style={styles.productSubtitle}>
                    {isExistingReview
                      ? (reviewData?.edited_at ? 'Avaliação registrada (Editada)' : 'Avaliação registrada')
                      : 'Conte sua experiência para outros compradores'}
                  </Text>
                </View>
              </View>

              {/* Seleção de Estrelas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SUA NOTA</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      disabled={!isFormEditable}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                      style={styles.starTouch}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comentário Opcional */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SEU COMENTÁRIO</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    !isFormEditable && { backgroundColor: '#F9F7F2', color: '#4B5563' },
                  ]}
                  editable={isFormEditable}
                  placeholder="O que achou da fragrância, fixação e embalagem?"
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  value={comment}
                  onChangeText={setComment}
                />
                <Text style={styles.counterText}>{comment.length}/1000</Text>
              </View>

              {/* Fotos (Até 3) - Oculta quando apenas visualizando e não há fotos */}
              {(isFormEditable || photos.length > 0) && (
                <View style={styles.section}>
                  <View style={styles.photosTitleRow}>
                    <Text style={styles.sectionTitle}>FOTOS</Text>
                    <Text style={styles.optionalHint}>
                      {isFormEditable ? '(opcional - até 3)' : ''}
                    </Text>
                  </View>

                  <View style={styles.photosRow}>
                    {photos.map((uri, idx) => (
                      <View key={idx} style={styles.photoWrapper}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setZoomedPhoto(uri)}
                        >
                          <Image source={{ uri }} style={styles.photoImg} />
                        </TouchableOpacity>
                        {isFormEditable ? (
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => removePhoto(idx)}
                          >
                            <Ionicons name="close" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}

                    {photos.length < 3 && isFormEditable ? (
                      <TouchableOpacity
                        style={styles.addPhotoBox}
                        onPress={pickImage}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="camera-outline" size={24} color="#6B6F78" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}

              {/* RESPOSTA DA LOJA */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>RESPOSTA DA LOJA</Text>
                {reviewData?.reply ? (
                  <View style={styles.replyBox}>
                    <View style={styles.replyHeader}>
                      <Ionicons name="storefront-outline" size={15} color="#1E2430" />
                      <Text style={styles.replyTitle}>
                        {reviewData.reply.author_name || 'Loja'}
                      </Text>
                      {reviewData.reply.created_at ? (
                        <Text style={styles.replyDate}>
                          {new Date(reviewData.reply.created_at).toLocaleDateString('pt-BR')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.replyText}>
                      {reviewData.reply.text || reviewData.reply.comment}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.replyEmptyBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#9CA3AF" />
                    <Text style={styles.replyEmptyText}>
                      A loja ainda não respondeu a esta avaliação.
                    </Text>
                  </View>
                )}
              </View>

              {/* Botões de Ação */}
              {isExistingReview ? (
                canEditReview ? (
                  !isEditing ? (
                    <TouchableOpacity
                      style={styles.editModeBtn}
                      onPress={() => setIsEditing(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={18} color="#1B2A41" />
                      <Text style={styles.editModeBtnText}>Editar Avaliação</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.btnDisabled]}
                      disabled={submitting}
                      onPress={handleSubmit}
                      activeOpacity={0.8}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Salvar Alterações</Text>
                      )}
                    </TouchableOpacity>
                  )
                ) : null
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  disabled={submitting}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Enviar Avaliação</Text>
                  )}
                </TouchableOpacity>
              )}

              {isExistingReview ? (
                <TouchableOpacity
                  style={styles.deleteBottomBtn}
                  disabled={submitting}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.deleteBottomBtnText}>Excluir avaliação</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para Expandir a Foto em Tela Cheia */}
      <Modal
        visible={Boolean(zoomedPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomedPhoto(null)}
      >
        <View style={styles.zoomModalBackdrop}>
          <TouchableOpacity
            style={styles.zoomCloseBtn}
            onPress={() => setZoomedPhoto(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {zoomedPhoto ? (
            <Image
              source={{ uri: zoomedPhoto }}
              style={styles.zoomModalImg}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      {/* Modal Elegante no Padrão da Interface para Avisos e Confirmações */}
      <Modal
        visible={customModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalBox}>
            <View
              style={[
                styles.confirmModalIconCircle,
                customModal.isDanger && styles.confirmModalIconDanger,
              ]}
            >
              <Ionicons
                name={customModal.isDanger ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={28}
                color={customModal.isDanger ? '#BA1A1A' : '#1B2A41'}
              />
            </View>
            <Text style={styles.confirmModalTitle}>{customModal.title}</Text>
            <Text style={styles.confirmModalMessage}>{customModal.message}</Text>

            <View style={styles.confirmModalActions}>
              {customModal.cancelText ? (
                <TouchableOpacity
                  style={styles.confirmModalCancelBtn}
                  activeOpacity={0.7}
                  onPress={() => setCustomModal((prev) => ({ ...prev, visible: false }))}
                >
                  <Text style={styles.confirmModalCancelText}>{customModal.cancelText}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.confirmModalConfirmBtn,
                  customModal.isDanger && styles.confirmModalConfirmBtnDanger,
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  setCustomModal((prev) => ({ ...prev, visible: false }));
                  customModal.onConfirm();
                }}
              >
                <Text style={styles.confirmModalConfirmText}>
                  {customModal.confirmText || 'OK'}
                </Text>
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
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  thumb: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFE8DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E2430',
  },
  productSubtitle: {
    fontSize: 11,
    color: '#6B6F78',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E2430',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  starTouch: {
    padding: 4,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E2430',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  counterText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
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
  photosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  photoImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E4DDD0',
  },
  removeBtn: {
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
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B9B2A3',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#1B2A41',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewStatusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  reviewStatusText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '500',
  },
  replyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 14,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  replyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E2430',
  },
  replyDate: {
    fontSize: 11,
    color: '#8E9099',
    marginLeft: 'auto',
  },
  replyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  replyEmptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 14,
  },
  replyEmptyText: {
    fontSize: 13,
    color: '#8E9099',
    fontStyle: 'italic',
  },
  deleteBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteBottomBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  editModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1B2A41',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  editModeBtnText: {
    color: '#1B2A41',
    fontSize: 14,
    fontWeight: '700',
  },
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalImg: {
    width: '92%',
    height: '75%',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  confirmModalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B2A41',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalConfirmBtnDanger: {
    backgroundColor: '#BA1A1A',
  },
  confirmModalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
