import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  storesService,
  Store,
  ProductDetails,
  Brand,
  CatalogNotesResponse,
} from '../../services/stores';
import { authService } from '../../services/auth';
import Svg, {
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

function DarkBottleIllustration() {
  return (
    <Svg width={70} height={110} viewBox="0 0 80 130">
      <Defs>
        <LinearGradient id="tfBlackGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#2E3338" />
          <Stop offset="30%" stopColor="#1C2024" />
          <Stop offset="70%" stopColor="#111315" />
          <Stop offset="100%" stopColor="#1E2328" />
        </LinearGradient>
        <LinearGradient id="goldPlateGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#CA8A04" />
          <Stop offset="100%" stopColor="#854D0E" />
        </LinearGradient>
      </Defs>
      <Rect x="28" y="12" width="24" height="20" rx="2" fill="#252A2F" />
      <Rect x="34" y="32" width="12" height="4" fill="#181B1E" />
      <Rect x="20" y="36" width="40" height="74" rx="4" fill="url(#tfBlackGrad)" />
      <Rect x="24" y="84" width="32" height="12" rx="1.5" fill="url(#goldPlateGrad)" />
    </Svg>
  );
}

function SoftBottleIllustration() {
  return (
    <Svg width={70} height={110} viewBox="0 0 80 130">
      <Defs>
        <LinearGradient id="sageGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#C2D6BC" />
          <Stop offset="35%" stopColor="#A7C2A0" />
          <Stop offset="70%" stopColor="#8EA987" />
          <Stop offset="100%" stopColor="#769170" />
        </LinearGradient>
        <LinearGradient id="woodCapGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#8A6349" />
          <Stop offset="50%" stopColor="#634532" />
          <Stop offset="100%" stopColor="#4A3324" />
        </LinearGradient>
      </Defs>
      <Rect x="33" y="14" width="14" height="14" rx="3" fill="url(#woodCapGrad)" />
      <Rect x="35" y="28" width="10" height="6" rx="1" fill="#4A3324" />
      <Rect x="23" y="34" width="34" height="76" rx="17" fill="url(#sageGrad)" />
    </Svg>
  );
}

function AmberBottle() {
  return (
    <Svg width={70} height={110} viewBox="0 0 80 130">
      <Defs>
        <LinearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FDBA74" />
          <Stop offset="50%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>
      </Defs>
      <Rect x="30" y="10" width="20" height="16" rx="2" fill="#B45309" />
      <Rect x="35" y="26" width="10" height="6" fill="#78350F" />
      <Rect x="22" y="32" width="36" height="80" rx="8" fill="url(#amberGrad)" />
    </Svg>
  );
}

function BottleIllustration({ family }: { family?: string }) {
  const fam = family?.toLowerCase() || '';
  if (fam.includes('oriental') || fam.includes('gourmand')) {
    return <AmberBottle />;
  }
  if (
    fam.includes('floral') ||
    fam.includes('cítrico') ||
    fam.includes('citrico') ||
    fam.includes('aquático') ||
    fam.includes('aquatico')
  ) {
    return <SoftBottleIllustration />;
  }
  return <DarkBottleIllustration />;
}

const FAMILIES_LIST = [
  'Todos',
  'Amadeirado',
  'Floral',
  'Cítrico',
  'Oriental',
  'Gourmand',
  'Fougère',
  'Aquático',
];

const getParam = (val?: string | string[]): string => {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
};

function formatPriceLabel(rawPrice: number | string | null | undefined): string {
  if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
    return 'Sob consulta';
  }
  const numeric = Number(rawPrice);
  if (Number.isNaN(numeric)) {
    return 'Sob consulta';
  }
  return `A partir de R$ ${numeric.toFixed(2).replace('.', ',')}`;
}

export default function ExploreScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams<{
    family?: string | string[];
    type?: string | string[];
    openNotes?: string | string[];
    tab?: string | string[];
    brand?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    family?: string | string[];
    type?: string | string[];
    openNotes?: string | string[];
    tab?: string | string[];
    brand?: string | string[];
  }>();

  const paramFamily = getParam(localParams.family) || getParam(globalParams.family);
  const paramType = getParam(localParams.type) || getParam(globalParams.type);
  const paramOpenNotes = getParam(localParams.openNotes) || getParam(globalParams.openNotes);
  const paramTab = getParam(localParams.tab) || getParam(globalParams.tab);
  const paramBrand = getParam(localParams.brand) || getParam(globalParams.brand);

  const [activeTab, setActiveTab] = useState<'products' | 'stores'>(
    paramTab === 'stores' ? 'stores' : 'products',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>(paramFamily || '');
  const [selectedType, setSelectedType] = useState<string>(
    paramType === 'decant' || paramType === 'bottle' ? paramType : '',
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(paramBrand);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [notesCatalog, setNotesCatalog] = useState<CatalogNotesResponse | null>(null);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [ordering, setOrdering] = useState<'popular' | 'price_asc' | 'price_desc'>('popular');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(paramOpenNotes === '1');
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  useEffect(() => {
    const currentTab = getParam(localParams.tab) || getParam(globalParams.tab);
    if (currentTab === 'stores') setActiveTab('stores');
    else if (currentTab === 'products') setActiveTab('products');

    const currentFamily = getParam(localParams.family) || getParam(globalParams.family);
    if (currentFamily) {
      setSelectedFamily(currentFamily);
    }

    const currentType = getParam(localParams.type) || getParam(globalParams.type);
    if (currentType === 'decant' || currentType === 'bottle') {
      setSelectedType(currentType);
    }

    const currentOpenNotes = getParam(localParams.openNotes) || getParam(globalParams.openNotes);
    if (currentOpenNotes === '1') setIsNotesModalOpen(true);

    const currentBrand = getParam(localParams.brand) || getParam(globalParams.brand);
    if (currentBrand) setSelectedBrand(currentBrand);
  }, [
    localParams.tab,
    globalParams.tab,
    localParams.family,
    globalParams.family,
    localParams.type,
    globalParams.type,
    localParams.openNotes,
    globalParams.openNotes,
    localParams.brand,
    globalParams.brand,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    setLoadingProducts(true);

    storesService
      .getProducts({
        search: debouncedSearch || undefined,
        olfactory_family: selectedFamily || undefined,
        brand: selectedBrand || undefined,
        notes: selectedNotes.length ? selectedNotes.join(',') : undefined,
        type: selectedType === 'decant' || selectedType === 'bottle' ? selectedType : undefined,
        available_only: true,
        ordering,
      })
      .then((data) => {
        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar produtos na busca:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedFamily, selectedBrand, selectedNotes, selectedType, ordering]);

  useEffect(() => {
    let isMounted = true;
    storesService
      .getStores(debouncedSearch || undefined)
      .then((data) => {
        if (isMounted) {
          setStores(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => console.error('Erro ao carregar lojas:', error));

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;
    setLoadingNotes(true);

    Promise.all([
      storesService.getCatalogNotes().catch((error) => {
        console.error('Erro ao carregar notas do catálogo:', error);
        return null;
      }),
      storesService.getBrands().catch((error) => {
        console.error('Erro ao carregar marcas:', error);
        return [] as Brand[];
      }),
    ])
      .then(([catalogData, brandsData]) => {
        if (!isMounted) return;
        if (catalogData) setNotesCatalog(catalogData);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      })
      .finally(() => {
        if (isMounted) setLoadingNotes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);
  const productCardWidth = Math.floor((containerWidth - 40 - 12) / 2);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const hasVolumeMetadata =
        (Array.isArray(prod.available_volumes) && prod.available_volumes.length > 0) ||
        (Array.isArray(prod.store_offers) && prod.store_offers.length > 0);

      if (selectedType === 'decant' && hasVolumeMetadata) {
        const hasDecant =
          prod.available_volumes?.some((v) => Number(v) <= 15) ||
          prod.store_offers?.some((o) => Number(o.volume_ml ?? 0) <= 15);
        if (!hasDecant) return false;
      }
      if (selectedType === 'bottle' && hasVolumeMetadata) {
        const hasBottle =
          prod.available_volumes?.some((v) => Number(v) > 15) ||
          prod.store_offers?.some((o) => Number(o.volume_ml ?? 0) > 15);
        if (!hasBottle) return false;
      }

      return true;
    });
  }, [products, selectedType]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedFamily('');
    setSelectedType('');
    setSelectedNotes([]);
    setSelectedBrand('');
    try {
      router.setParams({
        family: '',
        type: '',
        openNotes: '',
        brand: '',
      });
    } catch {
      // Fallback seguro caso setParams não esteja disponível no contexto atual
    }
  };

  const selectedBrandObj = brands.find((b) => String(b.id) === selectedBrand);

  const pyramidSections = notesCatalog
    ? [
        { title: 'Notas de Saída', notes: notesCatalog.top_notes || [] },
        { title: 'Notas de Coração', notes: notesCatalog.heart_notes || [] },
        { title: 'Notas de Fundo', notes: notesCatalog.base_notes || [] },
      ].filter((s) => s.notes.length > 0)
    : [];

  const hasActiveFilters =
    selectedFamily !== '' ||
    selectedType !== '' ||
    selectedNotes.length > 0 ||
    selectedBrand !== '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        {/* --- CABEÇALHO DA TELA --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explorar</Text>
          <Text style={styles.headerSubtitle}>Encontre fragrâncias, notas e lojas parceiras</Text>
        </View>

        {/* --- SEARCH INPUT BAR --- */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar perfumes, marcas ou lojas..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="explore-search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- SELETOR DE ABAS: PERFUMES / LOJAS --- */}
        <View style={styles.tabSelectorRow} testID="explore-tab-selector">
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'products' && styles.tabButtonActive]}
            onPress={() => setActiveTab('products')}
            testID="tab-perfumes"
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'products' && styles.tabButtonTextActive,
              ]}
            >
              Perfumes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stores' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stores')}
            testID="tab-stores"
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'stores' && styles.tabButtonTextActive,
              ]}
            >
              Lojas
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'stores' ? (
            <View style={styles.section} testID="stores-tab-content">
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleInline}>Todas as Lojas</Text>
                <Text style={styles.storeCountBadge}>{stores.length} lojas</Text>
              </View>

              {stores.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="business-outline" size={36} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>Nenhuma loja encontrada</Text>
                </View>
              ) : (
                <View style={styles.storesList}>
                  {stores.map((store) => {
                    const numericRating = store.rating != null ? Number(store.rating) : 0;
                    const ratingDisplay =
                      !Number.isNaN(numericRating) && numericRating > 0
                        ? numericRating.toFixed(1)
                        : 'Novo';

                    return (
                      <TouchableOpacity
                        key={store.id}
                        style={styles.storeFullCard}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: '/store/[id]' as never,
                            params: { id: store.id.toString() },
                          })
                        }
                        testID={`store-list-item-${store.id}`}
                      >
                        <View style={styles.storeLogoWrapper}>
                          {store.logo_url ? (
                            <Image
                              source={{ uri: store.logo_url }}
                              style={styles.storeAvatarImg}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <View style={styles.storeAvatarBox}>
                              <Text style={styles.storeAvatarInitial}>
                                {store.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {store.is_official && (
                            <View style={styles.officialCheckBadge}>
                              <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        <View style={styles.storeInfoBox}>
                          <View style={styles.storeNameRow}>
                            <Text style={styles.storeNameText} numberOfLines={1}>
                              {store.name}
                            </Text>
                          </View>
                          <Text style={styles.storeLocationText} numberOfLines={1}>
                            {store.city && store.state
                              ? `${store.city}/${store.state}`
                              : 'Parceiro verificado'}
                          </Text>
                          <View style={styles.storeMetaRow}>
                            <Ionicons name="star" size={13} color="#EAB308" />
                            <Text style={styles.storeRatingText}>{ratingDisplay}</Text>
                            <Text style={styles.storeMetaSeparator}>•</Text>
                            <Text style={styles.storeFollowersText}>
                              {store.followers_count || 0} seguidores
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View testID="products-tab-content">
              {hasActiveFilters && (
                <View style={styles.activeFiltersRow} testID="active-filters-container">
                  {selectedFamily !== '' && (
                    <View style={styles.activeFilterChip} testID="active-family-filter">
                      <Text style={styles.activeFilterChipText}>Família: {selectedFamily}</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedFamily('')}
                        testID="clear-family-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedType === 'decant' && (
                    <View style={styles.activeFilterChip} testID="active-type-filter">
                      <Text style={styles.activeFilterChipText}>Tipo: Decants</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedType('')}
                        testID="clear-type-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedType === 'bottle' && (
                    <View style={styles.activeFilterChip} testID="active-type-filter">
                      <Text style={styles.activeFilterChipText}>Tipo: Frascos</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedType('')}
                        testID="clear-bottle-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedBrand !== '' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterChipText}>
                        Marca: {selectedBrandObj?.name || 'Selecionada'}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedBrand('')}>
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedNotes.length > 0 && (
                    <View style={styles.activeFilterChip} testID="active-note-filter">
                      <Text style={styles.activeFilterChipText}>
                        {selectedNotes.length === 1
                          ? `Nota: ${selectedNotes[0]}`
                          : `${selectedNotes.length} notas`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedNotes([])}
                        testID="clear-note-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={clearAllFilters}
                    testID="clear-all-filters-btn"
                  >
                    <Text style={styles.clearAllBtnText}>Limpar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ATALHO PARA SELETOR DE NOTAS OLFATIVAS */}
              <View style={styles.notesDiscoveryBanner}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.notesDiscoveryTitle}>Descoberta Olfativa</Text>
                  <Text style={styles.notesDiscoverySubtitle}>
                    {selectedNotes.length
                      ? `${selectedNotes.length} notas selecionadas`
                      : 'Filtre por suas notas favoritas'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.notesModalTriggerBtn}
                  onPress={() => setIsNotesModalOpen(true)}
                  testID="open-notes-modal-btn"
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.notesModalTriggerBtnText}>
                    {selectedNotes.length ? 'Alterar Notas' : 'Notas Olfativas'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FORMATO */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Formato</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.familiesScroll}
                >
                  {[
                    { label: 'Todos', value: '' },
                    { label: '🧪 Decants', value: 'decant' },
                    { label: '🍾 Frascos', value: 'bottle' },
                  ].map((format) => (
                    <TouchableOpacity
                      key={format.label}
                      style={[
                        styles.familyChip,
                        selectedType === format.value && styles.familyChipActive,
                      ]}
                      onPress={() => setSelectedType(format.value)}
                      testID={`format-chip-${format.value || 'all'}`}
                    >
                      <Text
                        style={[
                          styles.familyChipText,
                          selectedType === format.value && styles.familyChipTextActive,
                        ]}
                      >
                        {format.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* FAMÍLIAS OLFATIVAS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Famílias Olfativas</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.familiesScroll}
                >
                  {FAMILIES_LIST.map((fam) => {
                    const isSelected =
                      (fam === 'Todos' && !selectedFamily) || selectedFamily === fam;
                    return (
                      <TouchableOpacity
                        key={fam}
                        style={[styles.familyChip, isSelected && styles.familyChipActive]}
                        onPress={() => {
                          if (fam === 'Todos') {
                            setSelectedFamily('');
                          } else {
                            setSelectedFamily(fam === selectedFamily ? '' : fam);
                          }
                        }}
                        activeOpacity={0.7}
                        testID={`family-chip-${fam}`}
                      >
                        <Text
                          style={[
                            styles.familyChipText,
                            isSelected && styles.familyChipTextActive,
                          ]}
                        >
                          {fam}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* PRODUTOS DO CATÁLOGO */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitleInline}>Perfumes Encontrados</Text>
                    <Text style={styles.productCountBadge}>
                      {filteredProducts.length} perfumes encontrados
                    </Text>
                  </View>
                  <View style={styles.sortRow}>
                    {[
                      { label: 'Relevantes', value: 'popular' as const },
                      { label: 'Menor R$', value: 'price_asc' as const },
                      { label: 'Maior R$', value: 'price_desc' as const },
                    ].map((option) => (
                      <TouchableOpacity key={option.value} onPress={() => setOrdering(option.value)}>
                        <Text
                          style={[
                            styles.sortText,
                            ordering === option.value && styles.sortTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {loadingProducts ? (
                  <View style={styles.loadingBox} testID="loading-products-box">
                    <ActivityIndicator size="small" color="#2C4659" />
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Ionicons name="sparkles-outline" size={36} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>
                      Nenhum perfume encontrado com os filtros selecionados.
                    </Text>
                    <TouchableOpacity
                      style={styles.clearEmptyButton}
                      onPress={clearAllFilters}
                    >
                      <Text style={styles.clearEmptyButtonText}>Limpar filtros</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((prod) => {
                      const brandName =
                        typeof prod.brand === 'object' && prod.brand !== null
                          ? prod.brand.name
                          : String(prod.brand || 'Marca');
                      const hasDecantOffer =
                        prod.available_volumes?.some((v) => Number(v) <= 15) ||
                        prod.store_offers?.some((o) => Number(o.volume_ml ?? 0) <= 15);
                      const priceLabel = formatPriceLabel(prod.min_price);

                      return (
                        <View
                          key={prod.id}
                          style={[styles.productCard, { width: productCardWidth }]}
                          testID={`product-card-${prod.id}`}
                        >
                          <View>
                            <View style={styles.productInnerBox}>
                              {prod.image_url ? (
                                <Image
                                  source={{ uri: prod.image_url }}
                                  style={styles.productImg}
                                  contentFit="contain"
                                  cachePolicy="memory-disk"
                                />
                              ) : (
                                <BottleIllustration family={prod.olfactory_family} />
                              )}
                            </View>

                            <View style={styles.productInfo}>
                              <Text style={styles.productBrand} numberOfLines={1}>
                                {brandName.toUpperCase()}
                              </Text>
                              <Text style={styles.productName} numberOfLines={2}>
                                {prod.name}
                              </Text>

                              <View style={styles.badgeRow}>
                                <View style={styles.tagBadge}>
                                  <Text style={styles.tagBadgeText}>{prod.olfactory_family}</Text>
                                </View>
                                {hasDecantOffer ? (
                                  <View style={[styles.tagBadge, styles.decantTagBadge]}>
                                    <Text style={styles.decantTagBadgeText}>Decant</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </View>

                          <View style={styles.productFooterBox}>
                            <View style={styles.priceRow}>
                              <Text style={styles.priceText}>{priceLabel}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.detailsBtn}
                              activeOpacity={0.7}
                              onPress={() =>
                                router.push({
                                  pathname: '/product/[id]' as never,
                                  params: { id: prod.id.toString() },
                                })
                              }
                              testID={`product-btn-${prod.id}`}
                            >
                              <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* --- MODAL DO SELETOR DE NOTAS OLFATIVAS --- */}
        <Modal
          visible={isNotesModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsNotesModalOpen(false)}
          testID="notes-modal"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="sparkles" size={20} color="#9E4732" />
                  <Text style={styles.modalTitle}>Descoberta por Notas</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsNotesModalOpen(false)}
                  testID="close-notes-modal-btn"
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={22} color="#1C252E" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Combine até 5 notas reais do catálogo:
              </Text>
              <TouchableOpacity
                style={styles.favoriteNotesButton}
                onPress={async () => {
                  try {
                    const profile = await authService.me();
                    const notes = Array.isArray(profile?.preferred_notes)
                      ? profile.preferred_notes.slice(0, 5)
                      : [];
                    setSelectedNotes(notes);
                  } catch (error) {
                    console.error('Erro ao carregar notas favoritas:', error);
                  }
                }}
              >
                <Text style={styles.favoriteNotesButtonText}>✨ Usar minhas notas favoritas</Text>
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalNotesScroll}
              >
                {loadingNotes ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#9E4732" />
                  </View>
                ) : pyramidSections.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Text style={styles.emptyStateText}>
                      Nenhuma nota olfativa disponível no catálogo.
                    </Text>
                  </View>
                ) : (
                  pyramidSections.map(({ title: pyramid, notes }) => (
                    <View key={pyramid} style={styles.pyramidGroup}>
                      <Text style={styles.pyramidTitle}>{pyramid}</Text>
                      <View style={styles.notesGrid}>
                        {notes.map((note) => {
                          const isSelected = selectedNotes.includes(note);
                          return (
                            <TouchableOpacity
                              key={note}
                              style={[
                                styles.noteSelectChip,
                                isSelected && styles.noteSelectChipActive,
                              ]}
                              onPress={() => {
                                setSelectedNotes((current) => {
                                  if (isSelected) {
                                    return current.filter((item) => item !== note);
                                  }
                                  return current.length >= 5 ? current : [...current, note];
                                });
                              }}
                              activeOpacity={0.7}
                              testID={`note-option-${note}`}
                            >
                              <Text
                                style={[
                                  styles.noteSelectChipText,
                                  isSelected && styles.noteSelectChipTextActive,
                                ]}
                              >
                                {note}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F4F1EA',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    ...Platform.select({
      web: {
        outlineStyle: 'none' as never,
      },
    }),
  },
  tabSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EBE7DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2C4659',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C4659',
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E4732',
  },
  notesDiscoveryBanner: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  notesDiscoveryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  notesDiscoverySubtitle: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 2,
  },
  notesModalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9E4732',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  notesModalTriggerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C252E',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitleInline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C252E',
  },
  productCountBadge: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
    marginTop: 2,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sortText: {
    fontSize: 11,
    color: '#78716C',
  },
  sortTextActive: {
    color: '#9E4732',
    fontWeight: '700',
  },
  storeCountBadge: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },
  familiesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  familyChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  familyChipActive: {
    backgroundColor: '#2C4659',
    borderColor: '#2C4659',
  },
  familyChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  familyChipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE4',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
  },
  productInnerBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EDE4',
  },
  productImg: {
    width: '85%',
    height: '85%',
  },
  productInfo: {
    paddingTop: 10,
    paddingHorizontal: 2,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  tagBadge: {
    backgroundColor: '#F5F3E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  decantTagBadge: {
    backgroundColor: '#FEF3C7',
  },
  decantTagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  productFooterBox: {
    paddingHorizontal: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2C4659',
  },
  detailsBtn: {
    borderWidth: 1.5,
    borderColor: '#2C4659',
    borderRadius: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2C4659',
  },
  storesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  storeFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  storeLogoWrapper: {
    position: 'relative',
    width: 46,
    height: 46,
  },
  storeAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
  },
  storeAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#354B5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  officialCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storeInfoBox: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  storeLocationText: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  storeRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C252E',
  },
  storeMetaSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  storeFollowersText: {
    fontSize: 12,
    color: '#78716C',
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 13.5,
    color: '#78716C',
    textAlign: 'center',
  },
  clearEmptyButton: {
    marginTop: 14,
    backgroundColor: '#2C4659',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C252E',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#78716C',
    marginBottom: 16,
  },
  favoriteNotesButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F3E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  favoriteNotesButtonText: {
    color: '#9E4732',
    fontSize: 12,
    fontWeight: '700',
  },
  modalNotesScroll: {
    maxHeight: 380,
  },
  pyramidGroup: {
    marginBottom: 16,
  },
  pyramidTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#354B5E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteSelectChip: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  noteSelectChipActive: {
    backgroundColor: '#9E4732',
    borderColor: '#9E4732',
  },
  noteSelectChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  noteSelectChipTextActive: {
    color: '#FFFFFF',
  },
});