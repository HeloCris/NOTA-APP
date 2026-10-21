import React, { useState } from 'react';
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
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { StoreReview } from '@/services/stores';

const SafeModal: React.ComponentType<any> = (Modal as any) || View;
const SafeScrollView: React.ComponentType<any> = (ScrollView as any) || View;

const DEFAULT_REVIEWS: StoreReview[] = [
  {
    id: '1',
    user_name: 'Camila Albuquerque',
    rating: 5,
    date: 'Há 2 dias',
    comment: 'Perfume 100% autêntico! A embalagem veio lacrada com selo de garantia, muito bem protegida e com dois decants de brinde maravilhosos. Entrega antes do prazo previsto!',
    verified_purchase: true,
    perfume_bought: 'Maison Noire Elixir • 100ml',
    photos: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    id: '2',
    user_name: 'Lucas Prado',
    rating: 5,
    date: 'Há 1 semana',
    comment: 'Fixação incrível de mais de 10 horas na pele. Atendimento impecável da loja tirando dúvidas pelo chat antes do envio. Com certeza comprarei novamente!',
    verified_purchase: true,
    perfume_bought: 'Sauvage Eau de Parfum • Decant 10ml',
    photos: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    id: '3',
    user_name: 'Mariana S.',
    rating: 5,
    date: 'Há 2 semanas',
    comment: 'Chegou super rápido em São Paulo. O batch code bateu certinho no CheckFresh. Produto original, loja de extrema confiança!',
    verified_purchase: true,
    perfume_bought: 'Perseus Eau de Parfum • 100ml',
    photos: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    id: '4',
    user_name: 'Rodrigo M. F.',
    rating: 4,
    date: 'Há 3 semanas',
    comment: 'Ótima projeção e aroma sofisticado. Demorou apenas um dia a mais pelos Correios, mas a loja respondeu prontamente.',
    verified_purchase: true,
    perfume_bought: 'Cedro Noturno • 50ml',
  },
];

interface StoreReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  storeName?: string;
  rating?: number;
  reviewsCount?: number;
  reviews?: StoreReview[];
}

export function StoreReviewsModal({
  visible,
  onClose,
  storeName = 'Loja',
  rating = 4.8,
  reviewsCount = 28,
  reviews = DEFAULT_REVIEWS,
}: StoreReviewsModalProps) {
  const [filterType, setFilterType] = useState<'all' | 'with_photos' | '5_stars'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (filterType === 'with_photos') return r.photos && r.photos.length > 0;
    if (filterType === '5_stars') return r.rating === 5;
    return true;
  });

  const allPhotos = reviews.flatMap((r) => r.photos || []);

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
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>Avaliações da Loja</Text>
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
          <Text style={styles.scoreText}>{rating.toFixed(1).replace('.', ',')}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons
                key={star}
                name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
                size={18}
                color="#F59E0B"
              />
            ))}
          </View>
          <Text style={styles.totalReviewsText}>{reviewsCount} avaliações</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownCol}>
          {[
            { star: 5, pct: '89%' },
            { star: 4, pct: '8%' },
            { star: 3, pct: '2%' },
            { star: 2, pct: '1%' },
            { star: 1, pct: '0%' },
          ].map((item) => (
            <View key={item.star} style={styles.barRow}>
              <Text style={styles.barStarText}>{item.star}★</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: item.pct as any }]} />
              </View>
              <Text style={styles.barPctText}>{item.pct}</Text>
            </View>
          ))}
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

      {/* Filtros de Avaliações */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            Todas ({reviews.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'with_photos' && styles.filterChipActive]}
          onPress={() => setFilterType('with_photos')}
        >
          <MaterialIcons
            name="photo-camera"
            size={13}
            color={filterType === 'with_photos' ? '#FFFFFF' : '#4B5563'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.filterChipText, filterType === 'with_photos' && styles.filterChipTextActive]}>
            Com fotos ({reviews.filter((r) => r.photos?.length).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === '5_stars' && styles.filterChipActive]}
          onPress={() => setFilterType('5_stars')}
        >
          <Text style={[styles.filterChipText, filterType === '5_stars' && styles.filterChipTextActive]}>
            5 Estrelas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Comentários */}
      <View style={styles.reviewsList}>
        {filteredReviews.map((rev) => (
          <View key={rev.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{rev.user_name.charAt(0)}</Text>
              </View>
              <View style={styles.userInfoCol}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{rev.user_name}</Text>
                  {rev.verified_purchase && (
                    <View style={styles.verifiedPurchaseBadge}>
                      <MaterialIcons name="check-circle" size={12} color="#16A34A" />
                      <Text style={styles.verifiedPurchaseText}>Compra Verificada</Text>
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
                  <Text style={styles.reviewDate}>{rev.date}</Text>
                </View>
              </View>
            </View>

            {rev.perfume_bought && (
              <View style={styles.perfumeBoughtContainer}>
                <MaterialIcons name="local-drink" size={12} color="#78716C" />
                <Text style={styles.perfumeBoughtText}>{rev.perfume_bought}</Text>
              </View>
            )}

            <Text style={styles.reviewComment}>{rev.comment}</Text>

            {rev.photos && rev.photos.length > 0 && (
              <View style={styles.reviewPhotosRow}>
                {rev.photos.map((pUrl, pIdx) => (
                  <TouchableOpacity
                    key={pIdx}
                    onPress={() => setSelectedPhoto(pUrl)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: pUrl }}
                      style={styles.reviewAttachedPhoto}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

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
});
