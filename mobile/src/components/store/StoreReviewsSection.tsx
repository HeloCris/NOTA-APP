import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import {
  storesService,
  ApiStoreReview,
  StoreReviewsSummary,
} from '@/services/stores';
import { formatProductVolume } from '@/utils/productUtils';

const SafeModal: React.ComponentType<any> = (Modal as any) || View;
const SafeScrollView: React.ComponentType<any> = (ScrollView as any) || View;

interface StoreReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  storeId?: number | string;
  productId?: number | string;
  storeName?: string;
  rating?: number;
  reviewsCount?: number;
}

export function StoreReviewsModal({
  visible,
  onClose,
  storeId,
  productId,
  storeName = 'Loja',
  rating: initialRating,
  reviewsCount: initialReviewsCount,
}: StoreReviewsModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [reviews, setReviews] = useState<ApiStoreReview[]>([]);
  const [summary, setSummary] = useState<StoreReviewsSummary | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showRatingMenu, setShowRatingMenu] = useState<boolean>(false);
  const [withPhotosOnly, setWithPhotosOnly] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showProductMenu, setShowProductMenu] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!visible || (!storeId && !productId)) {
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = productId
          ? await storesService.getProductReviews(productId, { storeId })
          : await storesService.getStoreReviews(storeId!);
        if (isMounted) {
          setReviews(data.results || []);
          setSummary(data.summary || null);
        }
      } catch {
        if (isMounted) {
          setReviews([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [visible, storeId, productId]);

  // Médias e totais reais (da API ou fallback inicial)
  const currentRating = summary ? summary.average : (initialRating ?? 0);
  const totalCount = summary ? summary.count : (initialReviewsCount ?? 0);

  // Produtos únicos presentes nas avaliações para o filtro de produto
  const uniqueProducts = Array.from(
    new Set(reviews.map((r) => r.product_name).filter(Boolean))
  ) as string[];

  // Filtros combinados: Estrelas selecionadas, Apenas com fotos, e Perfume selecionado
  const filteredReviews = reviews.filter((r) => {
    if (selectedRating !== null && r.rating !== selectedRating) {
      return false;
    }
    if (withPhotosOnly && (!r.photos || r.photos.length === 0)) {
      return false;
    }
    if (selectedProduct !== null && r.product_name !== selectedProduct) {
      return false;
    }
    return true;
  });

  // Todas as fotos de compradores
  const allPhotos = reviews.flatMap((r) => (r.photos || []).map((p) => p.image));

  // Formatar data legível
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  // Cálculo da distribuição por estrelas
  const getStarPercentage = (starNum: number) => {
    if (!summary || summary.count === 0) return 0;
    const starCount = (summary.distribution as any)?.[String(starNum)] || 0;
    return Math.round((starCount / summary.count) * 100);
  };

  return (
    <SafeModal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.modalFullContainer}>
        {/* Cabeçalho de Tela Inteira */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalBackButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialIcons name="arrow-back" size={22} color="#1C252E" />
          </TouchableOpacity>
          <View style={styles.modalHeaderTitleWrap}>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {productId ? 'Avaliações do Produto' : 'Avaliações da Loja'}
            </Text>
            {storeName ? (
              <Text style={styles.modalHeaderSubtitle} numberOfLines={1}>{storeName}</Text>
            ) : null}
          </View>
          <View style={styles.modalHeaderPlaceholder} />
        </View>

        <SafeScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Resumo de Avaliações */}
          <View style={styles.summaryCard}>
            <View style={styles.scoreCol}>
              <Text style={styles.scoreText}>
                {totalCount > 0 ? currentRating.toFixed(1).replace('.', ',') : '—'}
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name={
                      totalCount === 0
                        ? 'star-outline'
                        : star <= Math.floor(currentRating)
                        ? 'star'
                        : star - 0.5 <= currentRating
                        ? 'star-half'
                        : 'star-outline'
                    }
                    size={18}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.totalReviewsText}>
                {totalCount > 0
                  ? `${totalCount} ${totalCount === 1 ? 'avaliação' : 'avaliações'}`
                  : 'Sem avaliações'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownCol}>
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = getStarPercentage(star);
                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barStarText}>{star}★</Text>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barPctText}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Galeria de Fotos de Clientes */}
          {allPhotos.length > 0 && (
            <View style={styles.photosSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Fotos de Compradores</Text>
                <Text style={styles.sectionSubtitle}>({allPhotos.length})</Text>
              </View>
              <SafeScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScroll}
              >
                {allPhotos.map((url, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.photoThumbWrapper}
                    onPress={() => setSelectedPhoto(url)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.photoThumb}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                ))}
              </SafeScrollView>
            </View>
          )}

          {/* Barra de Filtros: Perfumes, Estrelas e Com Fotos */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Filtrar por:</Text>
            <SafeScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollRow}
            >
              {/* 1. Botão: Perfumes (somente quando visualizando a loja como um todo com múltiplos perfumes) */}
              {!productId && uniqueProducts.length > 1 && (
                <TouchableOpacity
                  style={[styles.filterChip, selectedProduct !== null && styles.filterChipActive]}
                  onPress={() => setShowProductMenu(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="local-drink"
                    size={13}
                    color={selectedProduct !== null ? '#FFFFFF' : '#4B5563'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[styles.filterChipText, selectedProduct !== null && styles.filterChipTextActive]}
                    numberOfLines={1}
                  >
                    {selectedProduct !== null ? selectedProduct : 'Perfumes'}
                  </Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={18}
                    color={selectedProduct !== null ? '#FFFFFF' : '#4B5563'}
                    style={{ marginLeft: 2 }}
                  />
                </TouchableOpacity>
              )}

              {/* 2. Botão: Estrelas */}
              <TouchableOpacity
                style={[styles.filterChip, selectedRating !== null && styles.filterChipActive]}
                onPress={() => setShowRatingMenu(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="star"
                  size={14}
                  color={selectedRating !== null ? '#F59E0B' : '#F59E0B'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterChipText, selectedRating !== null && styles.filterChipTextActive]}>
                  {selectedRating !== null
                    ? `${selectedRating} ${selectedRating === 1 ? 'Estrela' : 'Estrelas'}`
                    : 'Estrelas'}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={18}
                  color={selectedRating !== null ? '#FFFFFF' : '#4B5563'}
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>

              {/* 3. Chip: Com Fotos */}
              <TouchableOpacity
                style={[styles.filterChip, withPhotosOnly && styles.filterChipActive]}
                onPress={() => setWithPhotosOnly(!withPhotosOnly)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={13}
                  color={withPhotosOnly ? '#FFFFFF' : '#4B5563'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterChipText, withPhotosOnly && styles.filterChipTextActive]}>
                  Com fotos ({reviews.filter((r) => r.photos && r.photos.length > 0).length})
                </Text>
              </TouchableOpacity>
            </SafeScrollView>
          </View>

          {/* Indicador de carregamento */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2C4659" />
              <Text style={styles.loadingText}>Carregando avaliações...</Text>
            </View>
          )}

          {/* Lista de Comentários ou Estado Vazio */}
          {!loading && filteredReviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="star-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhuma avaliação encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {selectedRating !== null || withPhotosOnly || selectedProduct !== null
                  ? 'Nenhuma avaliação atende aos filtros selecionados.'
                  : 'Esta loja ainda não possui avaliações de clientes.'}
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {filteredReviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {(rev.author_name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfoCol}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{rev.author_name}</Text>
                        {rev.is_edited && (
                          <View style={styles.editedBadge}>
                            <Text style={styles.editedText}>Editada</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.starsAndDateRow}>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <MaterialIcons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={14}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(rev.created_at)}</Text>
                      </View>
                    </View>
                  </View>

                  {(rev.product_name || rev.volume_ml) && (
                    <View style={styles.perfumeBoughtContainer}>
                      <MaterialIcons name="local-drink" size={12} color="#78716C" />
                      <Text style={styles.perfumeBoughtText}>
                        {rev.product_name}
                        {rev.volume_ml ? ` • ${formatProductVolume(rev.volume_ml)}` : ''}
                      </Text>
                    </View>
                  )}

                  {Boolean(rev.comment) && (
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  )}

                  {rev.photos && rev.photos.length > 0 && (
                    <View style={styles.reviewPhotosRow}>
                      {rev.photos.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setSelectedPhoto(p.image)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: p.image }}
                            style={styles.reviewAttachedPhoto}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Resposta Pública da Loja (RN-09) */}
                  {rev.reply && (
                    <View style={styles.replyBox}>
                      <View style={styles.replyHeader}>
                        <MaterialIcons name="subdirectory-arrow-right" size={14} color="#2C4659" />
                        <Text style={styles.replyStoreName}>
                          Resposta da Loja ({rev.reply.author_name})
                        </Text>
                        <Text style={styles.replyDate}>{formatDate(rev.reply.created_at)}</Text>
                      </View>
                      <Text style={styles.replyText}>{rev.reply.text}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

      {/* Modal de Seleção de Estrelas */}
      <SafeModal visible={showRatingMenu} transparent animationType="fade">
        <Pressable
          style={styles.ratingMenuOverlay}
          onPress={() => setShowRatingMenu(false)}
        >
          <View style={styles.ratingMenuCard}>
            <View style={styles.ratingMenuHeader}>
              <Text style={styles.ratingMenuTitle}>Filtrar por estrelas</Text>
              <TouchableOpacity
                onPress={() => setShowRatingMenu(false)}
                style={styles.ratingMenuCloseBtn}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Opção Todas */}
            <TouchableOpacity
              style={[
                styles.ratingMenuItem,
                selectedRating === null && styles.ratingMenuItemActive,
              ]}
              onPress={() => {
                setSelectedRating(null);
                setShowRatingMenu(false);
              }}
            >
              <Text
                style={[
                  styles.ratingMenuItemText,
                  selectedRating === null && styles.ratingMenuItemTextActive,
                ]}
              >
                Todas as notas ({reviews.length})
              </Text>
              {selectedRating === null && (
                <MaterialIcons name="check" size={18} color="#2C4659" />
              )}
            </TouchableOpacity>

            {/* Opções 5 a 1 Estrela */}
            {[5, 4, 3, 2, 1].map((stars) => {
              const count =
                (summary?.distribution as any)?.[String(stars)] ??
                reviews.filter((r) => r.rating === stars).length;
              const isSelected = selectedRating === stars;
              return (
                <TouchableOpacity
                  key={stars}
                  style={[
                    styles.ratingMenuItem,
                    isSelected && styles.ratingMenuItemActive,
                  ]}
                  onPress={() => {
                    setSelectedRating(stars);
                    setShowRatingMenu(false);
                  }}
                >
                  <View style={styles.ratingMenuStarsRow}>
                    <View style={styles.starsRowCompact}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialIcons
                          key={s}
                          name={s <= stars ? 'star' : 'star-outline'}
                          size={16}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.ratingMenuItemText,
                        isSelected && styles.ratingMenuItemTextActive,
                      ]}
                    >
                      {stars} {stars === 1 ? 'estrela' : 'estrelas'} ({count})
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons name="check" size={18} color="#2C4659" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </SafeModal>

      {/* Modal de Seleção de Perfumes */}
      <SafeModal visible={showProductMenu} transparent animationType="fade">
        <Pressable
          style={styles.ratingMenuOverlay}
          onPress={() => setShowProductMenu(false)}
        >
          <View style={styles.ratingMenuCard}>
            <View style={styles.ratingMenuHeader}>
              <Text style={styles.ratingMenuTitle}>Filtrar por perfume</Text>
              <TouchableOpacity
                onPress={() => setShowProductMenu(false)}
                style={styles.ratingMenuCloseBtn}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Opção Todos os Perfumes */}
            <TouchableOpacity
              style={[
                styles.ratingMenuItem,
                selectedProduct === null && styles.ratingMenuItemActive,
              ]}
              onPress={() => {
                setSelectedProduct(null);
                setShowProductMenu(false);
              }}
            >
              <Text
                style={[
                  styles.ratingMenuItemText,
                  selectedProduct === null && styles.ratingMenuItemTextActive,
                ]}
              >
                Todos os perfumes ({reviews.length})
              </Text>
              {selectedProduct === null && (
                <MaterialIcons name="check" size={18} color="#2C4659" />
              )}
            </TouchableOpacity>

            {/* Lista dos perfumes da loja */}
            <SafeScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {uniqueProducts.map((pName) => {
                const count = reviews.filter((r) => r.product_name === pName).length;
                const isSelected = selectedProduct === pName;
                return (
                  <TouchableOpacity
                    key={pName}
                    style={[
                      styles.ratingMenuItem,
                      isSelected && styles.ratingMenuItemActive,
                    ]}
                    onPress={() => {
                      setSelectedProduct(pName);
                      setShowProductMenu(false);
                    }}
                  >
                    <View style={styles.ratingMenuStarsRow}>
                      <MaterialIcons
                        name="local-drink"
                        size={15}
                        color={isSelected ? '#2C4659' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.ratingMenuItemText,
                          isSelected && styles.ratingMenuItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {pName} ({count})
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color="#2C4659" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </SafeScrollView>
          </View>
        </Pressable>
      </SafeModal>

      {/* Modal de Foto Ampliada */}
      <SafeModal visible={!!selectedPhoto} transparent animationType="fade">
        <Pressable style={styles.photoModalOverlay} onPress={() => setSelectedPhoto(null)}>
          <View style={styles.photoModalContent}>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.modalEnlargedPhoto}
                contentFit="contain"
              />
            )}
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeModal>
          </SafeScrollView>
      </View>
    </SafeModal>
  );
}

const styles = StyleSheet.create({
  modalFullContainer: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 36),
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7DE',
  },
  modalBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
    marginTop: 2,
  },
  modalHeaderPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE4',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '38%',
  },
  scoreText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C252E',
    letterSpacing: -0.5,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  breakdownCol: {
    flex: 1,
    justifyContent: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  barStarText: {
    fontSize: 11,
    color: '#6B7280',
    width: 22,
    fontWeight: '600',
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  barPctText: {
    fontSize: 10.5,
    color: '#9CA3AF',
    width: 28,
    textAlign: 'right',
  },
  photosSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  photosScroll: {
    gap: 10,
    paddingRight: 10,
  },
  photoThumbWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE4',
    backgroundColor: '#FAF9F5',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filtersScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  filterChipActive: {
    backgroundColor: '#2C4659',
    borderColor: '#2C4659',
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 200,
  },
  productChipActive: {
    backgroundColor: '#2C4659',
    borderColor: '#2C4659',
  },
  productChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  productChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E4EAEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C4659',
  },
  userInfoCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  verifiedPurchaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedPurchaseText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  starsAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  perfumeBoughtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  perfumeBoughtText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18.5,
    color: '#374151',
  },
  reviewPhotosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  reviewAttachedPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalEnlargedPhoto: {
    width: '100%',
    height: '100%',
  },
  closeModalButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  editedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  editedText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  replyBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#2C4659',
    borderRadius: 6,
    padding: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  replyStoreName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
  replyDate: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  replyText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },
  ratingMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ratingMenuCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  ratingMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
  },
  ratingMenuCloseBtn: {
    padding: 4,
  },
  ratingMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  ratingMenuItemActive: {
    backgroundColor: '#F0F5F9',
  },
  ratingMenuItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#374151',
  },
  ratingMenuItemTextActive: {
    fontWeight: '700',
    color: '#2C4659',
  },
  ratingMenuStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRowCompact: {
    flexDirection: 'row',
    gap: 1,
  },
});
