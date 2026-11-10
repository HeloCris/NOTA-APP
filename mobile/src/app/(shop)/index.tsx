import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useUnreadNotifications } from '../../hooks/use-unread-notifications';
import {
  storesService,
  HomeFeedResponse,
  HomeProductItem,
  HomeStoreItem,
} from '../../services/stores';

// --- Ícones Vetoriais das 7 Famílias Olfativas Oficiais (RN-05) ---

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

function FougereIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22V8M12 8C9 4 5 5 4 8c3 1 5 4 8 0zM12 14c3-3 7-2 8 1-3 1-5 4-8-1zM12 18c-2-2-5-2-6 0 2 1 4 3 6 0z"
        stroke="#2E7D32"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AquaticIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7 0M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7 0"
        stroke="#0284C7"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Ilustração de fallback para perfume sem foto
function BottleFallback() {
  return (
    <Svg width={70} height={95} viewBox="0 0 110 140">
      <Defs>
        <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#E2E8F0" />
          <Stop offset="50%" stopColor="#CBD5E1" />
          <Stop offset="100%" stopColor="#94A3B8" />
        </LinearGradient>
      </Defs>
      <Rect x="46" y="14" width="18" height="16" rx="2" fill="#354B5E" />
      <Rect x="49" y="30" width="12" height="7" rx="1" fill="#64748B" />
      <Rect x="26" y="37" width="58" height="88" rx="8" fill="url(#glassGrad)" />
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

// As 7 Famílias Olfativas Oficiais do Sistema (RN-05)
const OLFACTORY_CATEGORIES = [
  { name: 'Amadeirado', icon: <DropletIcon /> },
  { name: 'Floral', icon: <FlowerIcon /> },
  { name: 'Cítrico', icon: <CitrusIcon /> },
  { name: 'Oriental', icon: <OrientalIcon /> },
  { name: 'Gourmand', icon: <GourmandIcon /> },
  { name: 'Fougère', icon: <FougereIcon /> },
  { name: 'Aquático', icon: <AquaticIcon /> },
];

export default function ShopIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();

  const [feed, setFeed] = useState<HomeFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Nome e inicial reais do usuário autenticado (RN-08)
  const userName = user?.first_name || (user?.email ? user.email.split('@')[0] : 'Visitante');
  const userInitial = (user?.first_name?.[0] || user?.email?.[0] || 'V').toUpperCase();

  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = Math.min(windowWidth, 460);

  // Banner responsivo ocupando ~80% da tela com peek
  const bannerGap = 12;
  const bannerWidth = Math.round(containerWidth * 0.80);
  const snapInterval = bannerWidth + bannerGap;

  // Largura de card de loja
  const storeCardWidth = Math.round((containerWidth - 40 - 12) / 2.2);

  // Largura do card de produto (grid de 2 colunas)
  const productCardWidth = Math.floor((containerWidth - 40 - 12) / 2);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await storesService.getHomeFeed();
      setFeed(data);
    } catch (error) {
      console.error('Erro ao carregar feed da Home:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    storesService.getHomeFeed()
      .then((data) => {
        if (isMounted) {
          setFeed(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro no feed inicial:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Navegação para busca filtrada por família olfativa (RN-05)
  const handleFamilyPress = (familyName: string) => {
    router.push({
      pathname: '/(shop)/explore',
      params: { family: familyName },
    } as never);
  };

  // Navegação para lojas e produtos
  const handleStorePress = (storeId: number) => {
    router.push(`/store/${storeId}` as never);
  };

  const handleProductPress = (productId: number) => {
    router.push(`/product/${productId}` as never);
  };

  // Banner 1: Festival de Decants (RN-06)
  const handleDecantBannerPress = () => {
    router.push({
      pathname: '/(shop)/explore',
      params: { type: 'decant' },
    } as never);
  };

  // Banner 2: Descoberta Olfativa (RN-06)
  const handleDiscoveryBannerPress = () => {
    if (feed?.has_olfactory_profile) {
      router.push({
        pathname: '/(shop)/explore',
        params: { openNotes: '1' },
      } as never);
    } else {
      router.push('/(shop)/account/edit-olfactory-profile' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={[styles.mainWrapper, { maxWidth: containerWidth }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchFeed(true)}
              tintColor="#354B5E"
              colors={['#354B5E']}
            />
          }
        >
          {/* --- HEADER DINÂMICO (RN-08) --- */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarCircle} testID="user-avatar-circle">
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>
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

            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(shop)/notifications' as never)}
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações"
            >
              <Ionicons name="notifications-outline" size={21} color="#1E293B" />
              {unreadCount > 0 && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationDotText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* --- BANNERS DE CURADORIA INTERATIVOS (RN-06) --- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannersScroll}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {/* Banner 1: Festival de Decants */}
            <TouchableOpacity
              style={[
                styles.bannerCard,
                styles.bannerNavy,
                { width: bannerWidth },
              ]}
              activeOpacity={0.9}
              onPress={handleDecantBannerPress}
              testID="banner-decants"
            >
              <Text style={styles.bannerTagNavy}>FESTIVAL DE DECANTS</Text>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                Perfumes de nicho em{'\n'}5ml, 10ml e 15ml →
              </Text>
              <Text style={styles.bannerSubtext}>Experimente antes de comprar o frasco</Text>
            </TouchableOpacity>

            {/* Banner 2: Descoberta Olfativa */}
            <TouchableOpacity
              style={[
                styles.bannerCard,
                styles.bannerTerracotta,
                { width: bannerWidth },
              ]}
              activeOpacity={0.9}
              onPress={handleDiscoveryBannerPress}
              testID="banner-discovery"
            >
              <Text style={styles.bannerTagTerracotta}>DESCOBERTA OLFATIVA</Text>
              <Text style={styles.bannerTitle} numberOfLines={2}>
                Encontre fragrâncias pelas{'\n'}suas notas favoritas →
              </Text>
              <Text style={styles.bannerSubtext}>Curadoria de acordo com seu gosto</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* --- 7 FAMÍLIAS OLFATIVAS (RN-05) --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Famílias Olfativas</Text>
            <Text style={styles.sectionSubtitle}>Toque para filtrar por família</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {OLFACTORY_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={styles.categoryItem}
                activeOpacity={0.7}
                onPress={() => handleFamilyPress(cat.name)}
                testID={`category-${cat.name}`}
              >
                <View style={styles.categoryCircle}>
                  {cat.icon}
                </View>
                <Text style={styles.categoryLabel}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* --- LOJAS EM DESTAQUE (RN-03, RN-07) --- */}
          <View style={styles.sectionHeaderWithAction}>
            <View>
              <Text style={styles.sectionTitle}>Lojas em Destaque</Text>
              <Text style={styles.sectionSubtitle}>Parceiros e marcas verificadas</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push({ pathname: '/(shop)/explore', params: { tab: 'stores' } } as never)}
              testID="see-all-stores-btn"
            >
              <Text style={styles.seeAllText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          {loading && !feed ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#354B5E" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storesScroll}
            >
              {feed?.featured_stores && feed.featured_stores.length > 0 ? (
                feed.featured_stores.map((store: HomeStoreItem) => {
                  const ratingLabel = (store.rating !== null && store.rating !== undefined && store.rating > 0)
                    ? store.rating.toFixed(1)
                    : 'Novo';
                  const locationLabel = store.city && store.state
                    ? `${store.city}/${store.state}`
                    : store.reviews_count > 0
                    ? `${store.reviews_count} aval.`
                    : 'Loja';

                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storeCard, { width: storeCardWidth }]}
                      activeOpacity={0.8}
                      onPress={() => handleStorePress(store.id)}
                      testID={`store-card-${store.id}`}
                    >
                      <View style={styles.storeLogoBox}>
                        {store.logo_url ? (
                          <Image
                            source={{ uri: store.logo_url }}
                            style={styles.storeLogoImg}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.storeLogoFallback}>
                            <Text style={styles.storeLogoText}>
                              {store.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {store.is_official && (
                          <View style={styles.officialCheckBadge} testID="official-badge">
                            <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </View>

                      <Text style={styles.storeName} numberOfLines={1}>
                        {store.name}
                      </Text>

                      <View style={styles.storeRatingRow}>
                        <Ionicons name="star" size={12} color="#D97706" />
                        <Text style={styles.storeRatingText}>
                          {' '}{ratingLabel} · {locationLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyStoresCard}>
                  <Text style={styles.emptyStoresText}>Nenhuma loja encontrada.</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* --- PARA VOCÊ (RN-02, RN-04, CA-05) --- */}
          <View style={styles.sectionHeaderWithAction}>
            <View>
              <Text style={styles.sectionTitle}>
                {feed?.has_olfactory_profile ? 'Para Você ✨' : 'Para Você'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {feed?.has_olfactory_profile
                  ? 'Baseado nas suas preferências olfativas'
                  : 'Fragrâncias mais procuradas do catálogo'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push('/(shop)/explore' as never)}
              testID="explore-catalog-btn"
            >
              <Text style={styles.seeAllText}>Explorar catálogo →</Text>
            </TouchableOpacity>
          </View>

          {/* Card de convite para quem ainda não tem perfil olfativo configurado (RN-02) */}
          {feed && !feed.has_olfactory_profile && (
            <View style={styles.inviteCard} testID="olfactory-invite-card">
              <View style={styles.inviteIconCircle}>
                <Ionicons name="sparkles" size={20} color="#354B5E" />
              </View>
              <View style={styles.inviteContent}>
                <Text style={styles.inviteTitle}>Descubra seu Match Olfativo</Text>
                <Text style={styles.inviteDesc}>
                  Configure suas notas e famílias favoritas em 30 segundos para receber recomendações exclusivas.
                </Text>
                <TouchableOpacity
                  style={styles.inviteBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(shop)/account/edit-olfactory-profile' as never)}
                  testID="setup-profile-btn"
                >
                  <Text style={styles.inviteBtnText}>Configurar Perfil →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Grid de Produtos Recomendados */}
          {loading && !feed ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#354B5E" />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {feed?.recommended_products && feed.recommended_products.length > 0 ? (
                feed.recommended_products.map((item: HomeProductItem) => {
                  const formattedPrice = item.min_price != null
                    ? `A partir de R$ ${item.min_price.toFixed(2).replace('.', ',')}`
                    : 'Sob consulta';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.productCard, { width: productCardWidth }]}
                      activeOpacity={0.85}
                      onPress={() => handleProductPress(item.id)}
                      testID={`product-card-${item.id}`}
                    >
                      {/* Top Badges: Match % e Decant */}
                      <View style={styles.productTopBadges}>
                        {item.match_percentage != null && item.match_percentage > 0 ? (
                          <View style={styles.matchBadge} testID={`match-badge-${item.id}`}>
                            <Text style={styles.matchBadgeText}>
                              ✨ {item.match_percentage}% Match
                            </Text>
                          </View>
                        ) : <View />}

                        {item.has_decant && (
                          <View style={styles.decantTag}>
                            <Text style={styles.decantTagText}>Decant</Text>
                          </View>
                        )}
                      </View>

                      {/* Imagem do Perfume ou Fallback */}
                      <View style={styles.productInnerBox}>
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.productImage}
                            contentFit="contain"
                          />
                        ) : (
                          <BottleFallback />
                        )}
                      </View>

                      {/* Informações */}
                      <View style={styles.productDetails}>
                        <Text style={styles.productBrand} numberOfLines={1}>
                          {item.brand_name || 'Exclusivo'}
                        </Text>
                        <Text style={styles.productName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.productFooter}>
                          <Text style={styles.productPrice}>{formattedPrice}</Text>
                          <View style={styles.familyBadge}>
                            <Text style={styles.familyBadgeText}>
                              {item.olfactory_family || 'Geral'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyProductsBox}>
                  <Text style={styles.emptyProductsText}>
                    Nenhum produto disponível no momento.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* --- DECANTS PARA EXPERIMENTAR (Se houver ofertas fracionadas) --- */}
          {feed?.decant_highlights && feed.decant_highlights.length > 0 && (
            <>
              <View style={styles.sectionHeaderWithAction}>
                <View>
                  <Text style={styles.sectionTitle}>Decants para Experimentar</Text>
                  <Text style={styles.sectionSubtitle}>Fracionados originais de 5ml, 10ml e 15ml</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={handleDecantBannerPress}
                >
                  <Text style={styles.seeAllText}>Ver todos →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storesScroll}
              >
                {feed.decant_highlights.map((item: HomeProductItem) => (
                  <TouchableOpacity
                    key={`decant-${item.id}`}
                    style={[styles.decantCard, { width: storeCardWidth }]}
                    activeOpacity={0.85}
                    onPress={() => handleProductPress(item.id)}
                    testID={`decant-highlight-${item.id}`}
                  >
                    <View style={styles.decantInnerBox}>
                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.decantImage}
                          contentFit="contain"
                        />
                      ) : (
                        <BottleFallback />
                      )}
                      <View style={styles.decantSmallBadge}>
                        <Text style={styles.decantSmallBadgeText}>5 a 15ml</Text>
                      </View>
                    </View>
                    <Text style={styles.decantBrand} numberOfLines={1}>
                      {item.brand_name}
                    </Text>
                    <Text style={styles.decantName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.decantPrice}>
                      {item.min_price != null ? `A partir de R$ ${item.min_price.toFixed(2).replace('.', ',')}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={{ height: 40 }} />
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
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#354B5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  wave: {
    fontSize: 16,
  },
  subGreeting: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#9E4732',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  bannersScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  bannerCard: {
    height: 140,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bannerNavy: {
    backgroundColor: '#1E293B',
  },
  bannerTerracotta: {
    backgroundColor: '#9E4732',
  },
  bannerTagNavy: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
  },
  bannerTagTerracotta: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FED7AA',
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 23,
    marginTop: 4,
  },
  bannerSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9E4732',
  },
  categoriesScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    width: 66,
  },
  categoryCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  storesScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeLogoBox: {
    position: 'relative',
    width: 44,
    height: 44,
    marginBottom: 10,
  },
  storeLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  storeLogoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#354B5E',
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
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  storeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeRatingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyStoresCard: {
    padding: 20,
  },
  emptyStoresText: {
    fontSize: 13,
    color: '#64748B',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  inviteCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E9E3D5',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inviteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBE4D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteContent: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  inviteDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  inviteBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#354B5E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  productTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 22,
    marginBottom: 4,
  },
  matchBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  matchBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
  },
  decantTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  decantTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
  },
  productInnerBox: {
    height: 110,
    borderRadius: 10,
    backgroundColor: '#FAF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productBrand: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8C939D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: 'column',
    gap: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  familyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  familyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  emptyProductsBox: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 13,
    color: '#64748B',
  },
  decantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  decantInnerBox: {
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  decantImage: {
    width: '80%',
    height: '80%',
  },
  decantSmallBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#354B5E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  decantSmallBadgeText: {
    fontSize: 8.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  decantBrand: {
    fontSize: 10,
    color: '#8C939D',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  decantName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  decantPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E4732',
  },
});
