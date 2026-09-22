import React, { useEffect, useState, useCallback } from 'react';
import { Animated, Pressable, View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { storesService, Store, StoreProduct } from '@/services/stores';
import { StoreHero } from '@/components/store/StoreHero';
import { FamilyFilterChips } from '@/components/common/FamilyFilterChips';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
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
    return <SkeletonLoader />;
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            {store && <StoreHero store={store} scrollY={scrollY} />}
            
            <ThemedView type="backgroundElement" style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Buscar em ${store?.name || 'loja'}...`}
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </ThemedView>

            <FamilyFilterChips selectedFamily={selectedFamily} onSelectFamily={setSelectedFamily} />

            <View style={styles.sectionHeader}>
              <ThemedText type="default" style={styles.sectionTitle}>Catálogo de Perfumes</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">({products.length})</ThemedText>
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
    </ThemedView>
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
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        Nenhum perfume encontrado
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.emptyMessage}>
        Nenhum perfume encontrado para este filtro.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onClearFilters}
        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
      >
        <ThemedText type="smallBold">Limpar filtros</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 46,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.one,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  columnWrapper: {
    paddingHorizontal: Spacing.two,
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  emptyIllustration: {
    width: 128,
    height: 128,
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  clearButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#E0E1E6',
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
});