import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

// --- Custom Vector Icons for Categorias Rápidas ---

function DropletIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke="#9E4732"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlowerIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={2} />
      <Circle cx="12" cy="5.5" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="12" cy="18.5" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="5.5" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="18.5" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
    </Svg>
  );
}

function CitrusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#2C4659" strokeWidth={2} />
      <Path
        d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M5.64 18.36L18.36 5.64"
        stroke="#2C4659"
        strokeWidth={1.4}
      />
      <Circle cx="12" cy="12" r="2.2" fill="#2C4659" />
    </Svg>
  );
}

function OrientalIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c-2 3-5 6.5-5 10a5 5 0 0 0 10 0c0-3.5-3-7-5-10z"
        stroke="#9E512F"
        strokeWidth={2}
      />
      <Circle cx="12" cy="13" r="1.8" fill="#9E512F" />
    </Svg>
  );
}

function GourmandIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 5.6 6 .8-4.4 4.2 1.2 6-5.2-3-5.2 3 1.2-6-4.4-4.2 6-.8z"
        stroke="#B45309"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Perfume Bottle Illustrations for "Para Você" ---

function LavenderBottle() {
  return (
    <Svg width={100} height={135} viewBox="0 0 110 140">
      <Defs>
        <LinearGradient id="lavenderGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#DDD6FE" />
          <Stop offset="35%" stopColor="#C4B5FD" />
          <Stop offset="75%" stopColor="#A78BFA" />
          <Stop offset="100%" stopColor="#8B5CF6" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#CA8A04" />
          <Stop offset="100%" stopColor="#854D0E" />
        </LinearGradient>
      </Defs>
      {/* Golden Cap */}
      <Rect x="46" y="14" width="18" height="16" rx="2" fill="url(#goldGrad)" />
      {/* Golden Neck */}
      <Rect x="49" y="30" width="12" height="7" rx="1" fill="#CA8A04" />
      {/* Bottle Body */}
      <Rect x="26" y="37" width="58" height="88" rx="8" fill="url(#lavenderGrad)" />
      {/* Minimalist Label Frame */}
      <Rect
        x="37"
        y="58"
        width="36"
        height="32"
        rx="3"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeOpacity="0.85"
      />
    </Svg>
  );
}

function AmberBottle() {
  return (
    <Svg width={100} height={135} viewBox="0 0 110 140">
      <Defs>
        <LinearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="40%" stopColor="#F59E0B" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>
        <LinearGradient id="goldCapGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="60%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
      </Defs>
      {/* Golden Spherical Cap */}
      <Circle cx="55" cy="22" r="11" fill="url(#goldCapGrad)" />
      {/* Neck */}
      <Rect x="50" y="33" width="10" height="7" fill="#B45309" />
      {/* Cylinder Bottle Body */}
      <Rect x="38" y="40" width="34" height="90" rx="6" fill="url(#amberGrad)" />
    </Svg>
  );
}

export default function ShopIndex() {
  const { user } = useAuth();
  const userName = user?.first_name || 'Ana';

  const { width: windowWidth } = useWindowDimensions();
  // Constrain to mobile width on desktop, full-width on mobile
  const containerWidth = Math.min(windowWidth, 460);

  // Responsive calculations:
  // Banner width occupies ~78-80% of screen, leaving exactly 40-50px peeking on the right
  const bannerGap = 12;
  const bannerWidth = Math.round(containerWidth * 0.78);
  const snapInterval = bannerWidth + bannerGap;

  // Store card: 2 cards visible with a peek of the 3rd
  const storeCardWidth = Math.round((containerWidth - 40 - 12) / 2.25);

  const [activeCategory, setActiveCategory] = useState<string>('Amadeirado');

  const categories = [
    { id: '1', name: 'Amadeirado', icon: <DropletIcon /> },
    { id: '2', name: 'Floral', icon: <FlowerIcon /> },
    { id: '3', name: 'Cítrico', icon: <CitrusIcon /> },
    { id: '4', name: 'Oriental', icon: <OrientalIcon /> },
    { id: '5', name: 'Gourmand', icon: <GourmandIcon /> },
  ];

  const stores = [
    {
      id: '1',
      name: "Maison d'Essence",
      letter: 'M',
      rating: '4.9',
      category: 'Nicho',
    },
    {
      id: '2',
      name: 'Ateliê Olfativo',
      letter: 'A',
      rating: '4.8',
      category: 'Autoral',
    },
    {
      id: '3',
      name: 'Raridades Perfumadas',
      letter: 'R',
      rating: '4.9',
      category: 'Vintage',
    },
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
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={require('@/assets/images/avatar_ana.jpg')}
                style={styles.avatar}
              />
              <View style={styles.greetingContainer}>
                <View style={styles.greetingRow}>
                  <Text style={styles.greeting}>Olá, {userName}</Text>
                  <Text style={styles.wave}> 👋</Text>
                </View>
                <Text style={styles.subGreeting}>
                  Descubra sua próxima fragrância.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={21} color="#1E293B" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* --- BANNERS CARROSSEL RESPONSIVO --- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannersScroll}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {/* Banner 1: Lançamentos */}
            <TouchableOpacity
              style={[
                styles.bannerCard,
                styles.bannerNavy,
                { width: bannerWidth },
              ]}
              activeOpacity={0.9}
            >
              <Text style={styles.bannerTagNavy}>LANÇAMENTOS</Text>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                Fragrâncias de Inverno{'\n'}chegaram
              </Text>
            </TouchableOpacity>

            {/* Banner 2: Oferta do Dia */}
            <TouchableOpacity
              style={[
                styles.bannerCard,
                styles.bannerTerracotta,
                { width: bannerWidth },
              ]}
              activeOpacity={0.9}
            >
              <Text style={styles.bannerTagTerracotta}>OFERTA DO DIA</Text>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                Até 30% OFF{'\n'}em selecionados
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* --- CATEGORIAS RÁPIDAS --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias Rápidas</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(cat.name)}
                >
                  <View
                    style={[
                      styles.categoryCircle,
                      isSelected && styles.categoryCircleActive,
                    ]}
                  >
                    {cat.icon}
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* --- LOJAS EM DESTAQUE --- */}
          <View style={styles.sectionHeaderWithAction}>
            <Text style={styles.sectionTitle}>Lojas em Destaque</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.seeAllText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storesScroll}
            snapToInterval={storeCardWidth + 12}
            decelerationRate="fast"
          >
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[styles.storeCard, { width: storeCardWidth }]}
                activeOpacity={0.8}
              >
                <View style={styles.storeLogo}>
                  <Text style={styles.storeLogoText}>{store.letter}</Text>
                </View>
                <Text style={styles.storeName} numberOfLines={1}>
                  {store.name}
                </Text>
                <View style={styles.storeRatingRow}>
                  <Text style={styles.storeStar}>★</Text>
                  <Text style={styles.storeRatingText}>
                    {' '}
                    {store.rating} · {store.category}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* --- PARA VOCÊ --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Para Você</Text>
          </View>

          <View style={styles.productsGrid}>
            {/* Card 1: Lavender Royale */}
            <TouchableOpacity style={styles.productCard} activeOpacity={0.85}>
              <View style={styles.productInnerBox}>
                <LavenderBottle />
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productBrand}>Maison d&apos;Essence</Text>
                <Text style={styles.productName} numberOfLines={1}>
                  Lavande Royale
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>R$ 389,90</Text>
                  <View style={styles.familyBadge}>
                    <Text style={styles.familyBadgeText}>Floral</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Ambre Impérial */}
            <TouchableOpacity style={styles.productCard} activeOpacity={0.85}>
              <View style={styles.productInnerBox}>
                <AmberBottle />
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productBrand}>Ateliê Olfativo</Text>
                <Text style={styles.productName} numberOfLines={1}>
                  Ambre Impérial
                </Text>
                <View style={styles.productFooter}>
                  <Text style={styles.productPrice}>R$ 420,00</Text>
                  <View
                    style={[
                      styles.familyBadge,
                      { backgroundColor: '#FDF2E9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.familyBadgeText,
                        { color: '#A85A38' },
                      ]}
                    >
                      Oriental
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8E3D5',
  },
  greetingContainer: {
    marginLeft: 12,
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
  },
  wave: {
    fontSize: 16,
  },
  subGreeting: {
    fontSize: 13,
    color: '#78716C',
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A85A38',
  },

  // --- Banners ---
  bannersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerCard: {
    height: 152,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
  },
  bannerNavy: {
    backgroundColor: '#1F2E3D',
  },
  bannerTerracotta: {
    backgroundColor: '#9E512F',
  },
  bannerTagNavy: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  bannerTagTerracotta: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FCD34D',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },

  // --- Categorias Rápidas ---
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 60,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryCircleActive: {
    borderColor: '#2C4659',
    backgroundColor: '#FAF9F6',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#1C252E',
    fontWeight: '700',
  },

  // --- Lojas em Destaque ---
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C4659',
  },
  storesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  storeLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1F2E3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeLogoText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  storeName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 4,
  },
  storeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeStar: {
    color: '#D97706',
    fontSize: 12,
  },
  storeRatingText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '500',
  },

  // --- Para Você (Product Cards) ---
  productsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  productInnerBox: {
    height: 155,
    borderRadius: 12,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EDE4',
  },
  productDetails: {
    paddingTop: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  productBrand: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C4659',
  },
  familyBadge: {
    backgroundColor: '#F0F4EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  familyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4D6B53',
  },
});