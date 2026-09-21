import React, { useEffect, useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
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

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');

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
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            {store && <StoreHero store={store} />}
            
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
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => router.push(`/(shop)/product/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
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
});