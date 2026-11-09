import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { storesService, Store } from '../../services/stores';
import Svg, {
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

// --- Vector Perfume Bottle: Tom Ford Oud Wood Style ---
function TomFordBottle() {
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

// --- Vector Perfume Bottle: Natura Style ---
function NaturaBottle() {
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

// --- Vector Perfume Bottle: Amber/Oriental Style ---
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

interface CatalogPerfume {
  id: number;
  name: string;
  brand: string;
  family: string;
  notes: string[];
  hasDecant: boolean;
  volume: string;
  price: string;
  bottleType: 'tf' | 'natura' | 'amber';
}

const CATALOG_PRODUCTS: CatalogPerfume[] = [
  {
    id: 1,
    name: 'Oud Wood',
    brand: 'TOM FORD',
    family: 'Amadeirado',
    notes: ['Oud', 'Sândalo', 'Cardamomo', 'Vetiver'],
    hasDecant: true,
    volume: '100ml',
    price: 'R$ 1.540',
    bottleType: 'tf',
  },
  {
    id: 2,
    name: 'Essência do Brasil',
    brand: 'NATURA',
    family: 'Floral',
    notes: ['Rosa Damascena', 'Jasmim', 'Lichia'],
    hasDecant: false,
    volume: '100ml',
    price: 'R$ 289',
    bottleType: 'natura',
  },
  {
    id: 3,
    name: 'Grand Soir',
    brand: 'MAISON F. KURKDJIAN',
    family: 'Oriental',
    notes: ['Âmbar', 'Baunilha', 'Fava Tonka'],
    hasDecant: true,
    volume: '70ml',
    price: 'R$ 1.890',
    bottleType: 'amber',
  },
  {
    id: 4,
    name: 'Bergamote 22',
    brand: 'LE LABO',
    family: 'Cítrico',
    notes: ['Bergamota', 'Limão Siciliano', 'Flor de Laranjeira'],
    hasDecant: true,
    volume: '50ml',
    price: 'R$ 1.250',
    bottleType: 'natura',
  },
  {
    id: 5,
    name: 'Angels Share',
    brand: 'KILIAN',
    family: 'Gourmand',
    notes: ['Conhaque', 'Canela', 'Carvalho', 'Baunilha'],
    hasDecant: true,
    volume: '50ml',
    price: 'R$ 1.620',
    bottleType: 'amber',
  },
  {
    id: 6,
    name: 'Beau De Jour',
    brand: 'TOM FORD',
    family: 'Fougère',
    notes: ['Lavanda', 'Gerânio', 'Musgo de Carvalho'],
    hasDecant: false,
    volume: '100ml',
    price: 'R$ 1.100',
    bottleType: 'tf',
  },
  {
    id: 7,
    name: 'Acqua di Sale',
    brand: 'PROFUMUM ROMA',
    family: 'Aquático',
    notes: ['Sal Marinho', 'Algas', 'Mirto', 'Cedro'],
    hasDecant: true,
    volume: '100ml',
    price: 'R$ 1.450',
    bottleType: 'natura',
  },
];

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

const POPULAR_NOTES_MAP: Record<string, string[]> = {
  'Notas de Saída': ['Bergamota', 'Limão Siciliano', 'Cardamomo', 'Pimenta Rosa', 'Lichia'],
  'Notas de Corpo': ['Íris', 'Rosa Damascena', 'Jasmim', 'Violeta', 'Lavanda'],
  'Notas de Fundo': ['Sândalo', 'Cedro', 'Baunilha', 'Âmbar', 'Oud', 'Almíscar'],
};

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    family?: string;
    type?: string;
    openNotes?: string;
    tab?: string;
  }>();

  // Estados principais de navegação e filtros (CA-03, CA-04, RN-05, RN-06, RN-07)
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>(
    params.tab === 'stores' ? 'stores' : 'products'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>(params.family || '');
  const [selectedType, setSelectedType] = useState<string>(
    params.type === 'decant' ? 'decant' : ''
  );
  const [selectedTag, setSelectedTag] = useState<string>(
    params.type === 'decant' ? 'Decants' : (params.family || '')
  );
  const [selectedNote, setSelectedNote] = useState<string>('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(params.openNotes === '1');
  const [stores, setStores] = useState<Store[]>([]);

  // Sincroniza parâmetros de rota recebidos via deep link ou push (RN-05 a RN-07)
  useEffect(() => {
    if (params.tab === 'stores') {
      setActiveTab('stores');
    } else if (params.tab === 'products') {
      setActiveTab('products');
    }

    if (params.family !== undefined) {
      setSelectedFamily(params.family);
      if (params.family) {
        setSelectedTag(params.family);
      }
    }

    if (params.type === 'decant') {
      setSelectedType('decant');
      setSelectedTag('Decants');
    }

    if (params.openNotes === '1') {
      setIsNotesModalOpen(true);
    }
  }, [params.tab, params.family, params.type, params.openNotes]);

  useEffect(() => {
    storesService
      .getStores()
      .then(setStores)
      .catch((error) => console.error('Erro ao carregar lojas:', error));
  }, []);

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  // Filtragem de produtos conforme busca e filtros ativos
  const filteredProducts = CATALOG_PRODUCTS.filter((prod) => {
    if (selectedFamily && prod.family.toLowerCase() !== selectedFamily.toLowerCase()) {
      return false;
    }
    if (selectedType === 'decant' && !prod.hasDecant) {
      return false;
    }
    if (selectedNote && !prod.notes.some((n) => n.toLowerCase() === selectedNote.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = prod.name.toLowerCase().includes(q);
      const matchesBrand = prod.brand.toLowerCase().includes(q);
      const matchesFamily = prod.family.toLowerCase().includes(q);
      const matchesNote = prod.notes.some((n) => n.toLowerCase().includes(q));
      if (!matchesName && !matchesBrand && !matchesFamily && !matchesNote) {
        return false;
      }
    }
    return true;
  });

  // Filtragem de lojas na aba de Lojas
  const visibleStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const featuredBrands = [
    'Yves Saint Laurent',
    'Maison F. Kurkdjian',
    'Tom Ford',
    'Natura',
    'Chanel',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
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

        {/* --- SELETOR DE ABAS: PERFUMES / LOJAS (RN-07) --- */}
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
            /* ============================================================== */
            /* --- ABA DE LOJAS (RN-07) --- */
            /* ============================================================== */
            <View style={styles.section} testID="stores-tab-content">
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Todas as Lojas</Text>
                <Text style={styles.storeCountBadge}>{visibleStores.length} lojas</Text>
              </View>

              {visibleStores.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="business-outline" size={36} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>Nenhuma loja encontrada</Text>
                </View>
              ) : (
                <View style={styles.storesList}>
                  {visibleStores.map((store) => (
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
                      <View style={styles.storeAvatarBox}>
                        <Text style={styles.storeAvatarInitial}>
                          {store.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.storeInfoBox}>
                        <View style={styles.storeNameRow}>
                          <Text style={styles.storeNameText}>{store.name}</Text>
                          {store.is_official && (
                            <Ionicons name="checkmark-circle" size={15} color="#2C4659" />
                          )}
                        </View>
                        <Text style={styles.storeLocationText}>
                          {store.city && store.state
                            ? `${store.city}/${store.state}`
                            : 'Parceiro verificado'}
                        </Text>
                        <View style={styles.storeMetaRow}>
                          <Ionicons name="star" size={13} color="#EAB308" />
                          <Text style={styles.storeRatingText}>
                            {store.rating !== null && store.rating !== undefined && store.rating > 0
                              ? store.rating.toFixed(1)
                              : 'Novo'}
                          </Text>
                          <Text style={styles.storeMetaSeparator}>•</Text>
                          <Text style={styles.storeFollowersText}>
                            {store.followers_count || 0} seguidores
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            /* ============================================================== */
            /* --- ABA DE PRODUTOS / PERFUMES (CA-03, CA-04, RN-05, RN-06) --- */
            /* ============================================================== */
            <View testID="products-tab-content">
              {/* FILTROS ATIVOS EM DESTAQUE */}
              {(selectedFamily !== '' || selectedType !== '' || selectedNote !== '') && (
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
                        onPress={() => {
                          setSelectedType('');
                          setSelectedTag('');
                        }}
                        testID="clear-type-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedNote !== '' && (
                    <View style={styles.activeFilterChip} testID="active-note-filter">
                      <Text style={styles.activeFilterChipText}>Nota: {selectedNote}</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedNote('')}
                        testID="clear-note-filter-btn"
                      >
                        <Ionicons name="close-circle" size={16} color="#2C4659" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={() => {
                      setSelectedFamily('');
                      setSelectedType('');
                      setSelectedNote('');
                      setSelectedTag('');
                    }}
                    testID="clear-all-filters-btn"
                  >
                    <Text style={styles.clearAllBtnText}>Limpar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ATALHO PARA SELETOR DE NOTAS OLFATIVAS (RN-06) */}
              <View style={styles.notesDiscoveryBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notesDiscoveryTitle}>Descoberta Olfativa</Text>
                  <Text style={styles.notesDiscoverySubtitle}>
                    {selectedNote ? `Filtrando por: ${selectedNote}` : 'Filtre por suas notas favoritas'}
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
                    {selectedNote ? 'Alterar Nota' : 'Notas Olfativas'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FAMÍLIAS OLFATIVAS - CHIPS RÁPIDOS (RN-05) */}
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

              {/* BUSCAS POPULARES / TAGS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Buscas Populares</Text>
                <View style={styles.popularTagsContainer}>
                  <View style={styles.popularTagsRow}>
                    {['Decants', 'Baccarat Rouge 540'].map((tag) => {
                      const isSelected = selectedTag === tag || (tag === 'Decants' && selectedType === 'decant');
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.popularTag, isSelected && styles.popularTagActive]}
                          onPress={() => {
                            if (tag === 'Decants') {
                              setSelectedType(selectedType === 'decant' ? '' : 'decant');
                              setSelectedTag(selectedTag === 'Decants' ? '' : 'Decants');
                            } else {
                              setSelectedTag(tag);
                              setSearchQuery(tag);
                            }
                          }}
                          activeOpacity={0.7}
                          testID={`popular-tag-${tag}`}
                        >
                          <Text
                            style={[
                              styles.popularTagText,
                              isSelected && styles.popularTagTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={[styles.popularTagsRow, { marginTop: 8 }]}>
                    {['Amadeirados', 'Presentes'].map((tag) => {
                      const isSelected = selectedTag === tag;
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.popularTag, isSelected && styles.popularTagActive]}
                          onPress={() => {
                            setSelectedTag(tag);
                            if (tag === 'Amadeirados') {
                              setSelectedFamily('Amadeirado');
                            }
                          }}
                          activeOpacity={0.7}
                          testID={`popular-tag-${tag}`}
                        >
                          <Text
                            style={[
                              styles.popularTagText,
                              isSelected && styles.popularTagTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* MARCAS EM DESTAQUE */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Marcas em Destaque</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.brandsScroll}
                >
                  {featuredBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={styles.brandCard}
                      activeOpacity={0.7}
                      onPress={() => setSearchQuery(brand)}
                    >
                      <Text style={styles.brandText}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* PRODUTOS DO CATÁLOGO / RESULTADOS */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Perfumes em Destaque</Text>
                  <Text style={styles.productCountBadge}>{filteredProducts.length} itens</Text>
                </View>

                {filteredProducts.length === 0 ? (
                  <View style={styles.emptyStateBox}>
                    <Ionicons name="sparkles-outline" size={36} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>
                      Nenhum perfume encontrado com os filtros selecionados.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((prod) => (
                      <View
                        key={prod.id}
                        style={styles.productCard}
                        testID={`product-card-${prod.id}`}
                      >
                        <View style={styles.productInnerBox}>
                          {prod.bottleType === 'tf' ? (
                            <TomFordBottle />
                          ) : prod.bottleType === 'natura' ? (
                            <NaturaBottle />
                          ) : (
                            <AmberBottle />
                          )}
                        </View>

                        <View style={styles.productInfo}>
                          <Text style={styles.productBrand}>{prod.brand}</Text>
                          <Text style={styles.productName} numberOfLines={1}>
                            {prod.name}
                          </Text>

                          <View style={styles.badgeRow}>
                            <View style={styles.tagBadge}>
                              <Text style={styles.tagBadgeText}>{prod.family}</Text>
                            </View>
                            {prod.hasDecant && (
                              <View style={[styles.tagBadge, styles.decantTagBadge]}>
                                <Text style={styles.decantTagBadgeText}>Decant</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.priceRow}>
                            <Text style={styles.volumeText}>{prod.volume}</Text>
                            <Text style={styles.priceText}>{prod.price}</Text>
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
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ============================================================== */}
        {/* --- MODAL DO SELETOR DE NOTAS OLFATIVAS (RN-06) --- */}
        {/* ============================================================== */}
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
                Selecione uma nota olfativa para filtrar as criações do catálogo:
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalNotesScroll}
              >
                {Object.entries(POPULAR_NOTES_MAP).map(([pyramid, notes]) => (
                  <View key={pyramid} style={styles.pyramidGroup}>
                    <Text style={styles.pyramidTitle}>{pyramid}</Text>
                    <View style={styles.notesGrid}>
                      {notes.map((note) => {
                        const isSelected = selectedNote === note;
                        return (
                          <TouchableOpacity
                            key={note}
                            style={[
                              styles.noteSelectChip,
                              isSelected && styles.noteSelectChipActive,
                            ]}
                            onPress={() => {
                              setSelectedNote(isSelected ? '' : note);
                              setIsNotesModalOpen(false);
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
                ))}
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

  // --- Search Bar ---
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
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

  // --- Abas Segmentadas ---
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

  // --- Active Filters ---
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

  // --- Notes Discovery Banner ---
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

  // --- Section Common ---
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
  productCountBadge: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },
  storeCountBadge: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },

  // --- Famílias Olfativas Chips ---
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

  // --- Buscas Populares ---
  popularTagsContainer: {
    paddingHorizontal: 20,
  },
  popularTagsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  popularTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: 16,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  popularTagActive: {
    backgroundColor: '#273847',
    borderColor: '#273847',
  },
  popularTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  popularTagTextActive: {
    color: '#FFFFFF',
  },

  // --- Marcas em Destaque ---
  brandsScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C252E',
  },

  // --- Grid de Perfumes ---
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  productCard: {
    width: '47.5%',
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
  },
  productInnerBox: {
    height: 130,
    borderRadius: 12,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EDE4',
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
    minHeight: 18,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 20,
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  volumeText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 13.5,
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

  // --- Lista de Lojas (Aba Lojas) ---
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

  // --- Empty State ---
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

  // --- Modal de Notas Olfativas ---
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
