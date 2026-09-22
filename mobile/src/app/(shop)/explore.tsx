import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
    <Svg width={80} height={130} viewBox="0 0 80 130">
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
      {/* Square Cap */}
      <Rect x="28" y="12" width="24" height="20" rx="2" fill="#252A2F" />
      {/* Small Neck */}
      <Rect x="34" y="32" width="12" height="4" fill="#181B1E" />
      {/* Bottle Body */}
      <Rect x="20" y="36" width="40" height="74" rx="4" fill="url(#tfBlackGrad)" />
      {/* Gold Label Plate */}
      <Rect x="24" y="84" width="32" height="12" rx="1.5" fill="url(#goldPlateGrad)" />
    </Svg>
  );
}

// --- Vector Perfume Bottle: Natura Essência do Brasil Style ---
function NaturaBottle() {
  return (
    <Svg width={80} height={130} viewBox="0 0 80 130">
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
      {/* Wooden Cap */}
      <Rect x="33" y="14" width="14" height="14" rx="3" fill="url(#woodCapGrad)" />
      {/* Neck Collar */}
      <Rect x="35" y="28" width="10" height="6" rx="1" fill="#4A3324" />
      {/* Rounded Bottle Body */}
      <Rect x="23" y="34" width="34" height="76" rx="17" fill="url(#sageGrad)" />
    </Svg>
  );
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Decants');

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  const popularSearches = [
    'Decants',
    'Baccarat Rouge 540',
    'Amadeirados',
    'Presentes',
  ];

  const featuredBrands = [
    'Yves Saint Laurent',
    'Maison F. Kurkdjian',
    'Tom Ford',
    'Natura',
    'Chanel',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* --- BUSCAS POPULARES --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buscas Populares</Text>
            <View style={styles.popularTagsContainer}>
              <View style={styles.popularTagsRow}>
                {['Decants', 'Baccarat Rouge 540'].map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.popularTag,
                        isSelected && styles.popularTagActive,
                      ]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.7}
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
                      style={[
                        styles.popularTag,
                        isSelected && styles.popularTagActive,
                      ]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.7}
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

          {/* --- MARCAS EM DESTAQUE --- */}
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
                >
                  <Text style={styles.brandText}>{brand}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* --- EM ALTA AGORA --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Em Alta Agora</Text>
            <View style={styles.productsGrid}>
              {/* Product 1: Tom Ford Oud Wood */}
              <View style={styles.productCard}>
                <View style={styles.productInnerBox}>
                  <TomFordBottle />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>TOM FORD</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    Oud Wood
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>Amadeirado</Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.volumeText}>100ml</Text>
                    <Text style={styles.priceText}>R$ 1.540</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Product 2: Natura Essência do Brasil */}
              <View style={styles.productCard}>
                <View style={styles.productInnerBox}>
                  <NaturaBottle />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>NATURA</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    Essência do{'\n'}Brasil
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>Cítrico</Text>
                    </View>
                    <View style={[styles.tagBadge, { marginLeft: 4 }]}>
                      <Text style={styles.tagBadgeText}>Floral</Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.volumeText}>100ml</Text>
                    <Text style={styles.priceText}>R$ 289</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
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
    paddingBottom: 16,
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
  },

  // --- Section Common ---
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
    paddingHorizontal: 20,
    marginBottom: 12,
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  brandText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1C252E',
  },

  // --- Em Alta Agora (Product Cards) ---
  productsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  productCard: {
    flex: 1,
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
    height: 148,
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
    fontSize: 10.5,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    minHeight: 20,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 20,
  },
  tagBadge: {
    backgroundColor: '#F5F3E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  volumeText: {
    fontSize: 11.5,
    color: '#78716C',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2C4659',
  },
  detailsBtn: {
    borderWidth: 1.5,
    borderColor: '#2C4659',
    borderRadius: 20,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
});
