import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { storesService, Store, StoreProduct } from '@/services/stores';
import { startConversation } from '@/services/communication';
import { StoreHero } from '@/components/store/StoreHero';
import { StoreReviewsModal } from '@/components/store/StoreReviewsSection';
import { FamilyFilterChips } from '@/components/common/FamilyFilterChips';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scrollY] = useState(() => new Animated.Value(0));

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const viewRegisteredForId = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(shop)' as never);
    }
  };

  const handleContactStore = async () => {
    if (!store) return;

    try {
      const conversation = await startConversation(store.id);
      router.push({
        pathname: '/chat/[id]' as never,
        params: { id: String(conversation.id) },
      });
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      Alert.alert(
        'Não foi possível iniciar o chat',
        'Entre na sua conta para conversar com a loja.',
      );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFamily('');
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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

  const loadData = useCallback(
    async (showSkeleton = true, isMountedCheck?: () => boolean) => {
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
        if (isMountedCheck && !isMountedCheck()) return;

        if (viewRegisteredForId.current !== String(storeData.id)) {
          viewRegisteredForId.current = String(storeData.id);
          void storesService.registerView(storeData.id);
        }
        setStore(storeData);
        setProducts(productsData);
      } catch (error) {
        if (!isMountedCheck || isMountedCheck()) {
          console.error('Erro ao carregar dados da loja:', error);
        }
      } finally {
        if (!isMountedCheck || isMountedCheck()) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [id, debouncedSearch, selectedFamily],
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData(false);
  }, [loadData]);

  useEffect(() => {
    let isMounted = true;
    void loadData(true, () => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  if (isLoading && !store) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [80, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const topOffset = Math.max(insets.top, 12);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.stickyHeader,
            {
              paddingTop: topOffset,
              height: topOffset + 52,
              opacity: headerOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
            {store?.name || 'Loja'}
          </Text>
        </Animated.View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={handleGoBack}
          style={[styles.floatingBackButton, { top: topOffset + 6 }]}
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
                      pathname: '/store/[id]/reviews' as never,
                      params: {
                        id: store.id.toString(),
                        storeName: store.name,
                        rating: store.rating?.toString(),
                        reviewsCount: store.reviews_count?.toString(),
                      },
                    });
                  }}
                  onContactPress={() => void handleContactStore()}
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
              hasMultipleVariations={item.hasMultipleVariations}
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

        <StoreReviewsModal
          visible={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
          storeId={store?.id}
          storeName={store?.name}
          rating={typeof store?.rating === 'string' ? parseFloat(store.rating) : store?.rating}
          reviewsCount={store?.reviews_count}
        />
      </View>
    </SafeAreaView>
  );
}

export function StoreEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="search-off" size={36} color="#9CA3AF" />
      </View>
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9990,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C252E',
  },
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 9999,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAE6DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
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
});