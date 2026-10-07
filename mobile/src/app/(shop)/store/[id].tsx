import React, { useEffect, useState, useCallback } from 'react';
import { Animated, Pressable, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { storesService, Store, StoreProduct } from '@/services/stores';
import { StoreHero } from '@/components/store/StoreHero';
import { FamilyFilterChips } from '@/components/common/FamilyFilterChips';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [scrollY] = useState(() => new Animated.Value(0));

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
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

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [storeData, productsData] = await Promise.all([
        storesService.getStore(id),
        storesService.getStoreProducts(id, {
          search: debouncedSearch || undefined,
          olfactory_family: selectedFamily || undefined,
        }),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, debouncedSearch, selectedFamily]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading && !store) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1C252E" />
        </Pressable>
      </View>
      <Animated.FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            {store && <StoreHero store={store} scrollY={scrollY} />}
            
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Buscar em ${store?.name || 'loja'}...`}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
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
              <Text style={styles.sectionCount}>({products.length})</Text>
            </View>
          </>
        }
        ListEmptyComponent={<StoreEmptyState onClearFilters={clearFilters} />}
        renderItem={({ item }) => (
         <ProductCard
           product={item}
           onPress={() => router.push({ pathname: '/product/[id]' as never, params: { id: item.id.toString() } })}
         />
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

export function StoreEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Image
        source={require('../../../../assets/images/logo-icon.png')}
        style={styles.emptyIllustration}
        contentFit="contain"
      />
      <Text style={styles.emptyTitle}>Nenhum perfume encontrado</Text>
      <Text style={styles.emptyMessage}>Nenhum perfume encontrado para este filtro.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onClearFilters}
        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
      >
        <Text style={styles.clearButtonText}>Limpar filtros</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F4F1EA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  listContent: {
    paddingBottom: 24,
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
  clearButtonPressed: {
    opacity: 0.7,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});