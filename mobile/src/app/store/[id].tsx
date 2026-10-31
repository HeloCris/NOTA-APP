import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { storesService, Store, StoreProduct } from '@/services/stores';
import { StoreHero } from '@/components/store/StoreHero';
import { StoreReviewsModal } from '@/components/store/StoreReviewsSection';
import { FamilyFilterChips } from '@/components/common/FamilyFilterChips';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

const SafeModal: React.ComponentType<any> = (Modal as any) || View;

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [scrollY] = useState(() => new Animated.Value(0));

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const viewRegistered = useRef(false);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFamily('');
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Agrupa os itens para que cada perfume apareça apenas uma vez no catálogo da loja
  // e exibe o menor preço disponível caso haja variações de volume/preço
  const groupedProducts = useMemo(() => {
    const map = new Map<string, { product: StoreProduct; minPrice: number; hasMultipleVariations: boolean }>();

    for (const item of products) {
      const key = (item.product_id ? `p_${item.product_id}` : `n_${item.product_name}`).toLowerCase();
      const currentPrice = parseFloat(item.price) || 0;

      if (!map.has(key)) {
        map.set(key, {
          product: { ...item },
          minPrice: currentPrice,
          hasMultipleVariations: false,
        });
      } else {
        const existing = map.get(key)!;
        existing.hasMultipleVariations = true;
        if (currentPrice < existing.minPrice) {
          existing.minPrice = currentPrice;
          existing.product = {
            ...existing.product,
            price: item.price,
            promotional_price: item.promotional_price,
            image_url: existing.product.image_url || item.image_url,
          };
        }
      }
    }

    return Array.from(map.values()).map(({ product, minPrice, hasMultipleVariations }) => ({
      ...product,
      price: minPrice.toString(),
      hasMultipleVariations,
    }));
  }, [products]);

  const loadData = useCallback(async (showSkeleton = true) => {
    if (!id) return;
    if (showSkeleton) setIsLoading(true);
    try {
      const [storeData, productsData] = await Promise.all([
        storesService.getStore(id),
        storesService.getStoreProducts(id, {
          search: debouncedSearch || undefined,
          olfactory_family: selectedFamily || undefined,
        }),
      ]);
      if (!viewRegistered.current) {
        viewRegistered.current = true;
        void storesService.registerView(storeData.id);
      }
      setStore(storeData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, debouncedSearch, selectedFamily]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    (async () => {
      try {
        const [storeData, productsData] = await Promise.all([
          storesService.getStore(id),
          storesService.getStoreProducts(id, {
            search: debouncedSearch || undefined,
            olfactory_family: selectedFamily || undefined,
          }),
        ]);
        if (!isMounted) return;
        setStore(storeData);
        setProducts(productsData);
      } catch (error) {
        console.error('Erro ao carregar dados da loja:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, debouncedSearch, selectedFamily]);

  if (isLoading && !store) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar para busca"
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => {
            router.navigate('/(shop)/explore' as never);
          }}
          style={styles.floatingBackButton}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1C252E" />
        </TouchableOpacity>

        <Animated.FlatList
          data={groupedProducts}
          keyExtractor={(item) => (item.product_id ? `p_${item.product_id}` : item.id.toString())}
          numColumns={2}
          columnWrapperStyle={groupedProducts.length > 0 ? styles.columnWrapper : undefined}
          refreshControl={
            RefreshControl ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#2C4659"
                colors={['#2C4659']}
              />
            ) : undefined
          }
          ListHeaderComponent={
            <>
              {store && (
                <StoreHero
                  store={store}
                  scrollY={scrollY}
                  productsCount={groupedProducts.length}
                  onOpenReviews={() => {
                    router.push({
                      pathname: '/store/[id]/reviews' as any,
                      params: {
                        id: store.id.toString(),
                        storeName: store.name,
                        rating: store.rating?.toString(),
                        reviewsCount: store.reviews_count?.toString(),
                      },
                    });
                  }}
                  onContactPress={() => setShowContactModal(true)}
                />
              )}

              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Buscar em ${store?.name || 'loja'}...`}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <FamilyFilterChips selectedFamily={selectedFamily} onSelectFamily={setSelectedFamily} />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Catálogo de Perfumes</Text>
                <Text style={styles.sectionCount}>({groupedProducts.length})</Text>
              </View>
            </>
          }
          ListEmptyComponent={<StoreEmptyState onClearFilters={clearFilters} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              hasMultipleVariations={(item as any).hasMultipleVariations}
              onPress={() =>
                router.push({
                  pathname: '/product/[id]' as never,
                  params: {
                    id: (item.product_id || item.id).toString(),
                    storeId: id ? id.toString() : undefined,
                  },
                })
              }
            />
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />

        {/* Modal informativo: Falar com a loja dentro da plataforma */}
        <SafeModal visible={showContactModal} transparent animationType="fade">
          <Pressable style={styles.contactModalOverlay} onPress={() => setShowContactModal(false)}>
            <View style={styles.contactModalCard}>
              <View style={styles.contactModalIconWrap}>
                <MaterialIcons name="chat-bubble" size={28} color="#2C4659" />
              </View>
              <Text style={styles.contactModalTitle}>Falar com a loja</Text>
              <Text style={styles.contactModalStoreName}>Atendimento Oficial • {store?.name}</Text>
              <Text style={styles.contactModalDesc}>
                O chat direto entre você e o lojista dentro da plataforma NOTA estará disponível em breve.
                Todas as mensagens e transações serão mantidas com segurança e suporte por aqui.
              </Text>
              <TouchableOpacity
                style={styles.contactModalButton}
                onPress={() => setShowContactModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.contactModalButtonText}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </SafeModal>

        {/* Modal de Avaliações da Loja */}
        <StoreReviewsModal
          visible={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
          storeId={store?.id}
          storeName={store?.name}
          rating={store?.rating}
          reviewsCount={store?.reviews_count}
        />
      </View>
    </SafeAreaView>
  );
}

export function StoreEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Image
        source={{
          uri: 'https://illustrations.popertee.com/illustrations/empty-search.svg',
        }}
        style={styles.emptyIllustration}
      />
      <Text style={styles.emptyTitle}>Nenhum perfume encontrado</Text>
      <Text style={styles.emptyMessage}>
        Nenhum perfume encontrado para este filtro.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onClearFilters}
        style={styles.clearButton}
      >
        <Text style={styles.clearButtonText}>Limpar filtros</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 36,
    left: 16,
    zIndex: 9999,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  listContent: {
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: '#EAE6DD',
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1C252E',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C252E',
    height: '100%',
    paddingVertical: 0,
    borderWidth: 0,
    outlineWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
  },
  sectionCount: {
    fontSize: 13,
    color: '#78716C',
  },
  columnWrapper: {
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  emptyIllustration: {
    width: 128,
    height: 128,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C252E',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2C4659',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  contactModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  contactModalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E4EAEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  contactModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 4,
  },
  contactModalStoreName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C4659',
    marginBottom: 12,
  },
  contactModalDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactModalButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C4659',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});