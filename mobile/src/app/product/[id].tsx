import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Rect, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import {
  storesService,
  ProductDetails,
  ProductStoreOffer,
  ShippingQuoteResponse,
  ApiStoreReview,
  StoreReviewsSummary,
} from '@/services/stores';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/product/ProductCard';
import { StoreReviewsModal } from '@/components/store/StoreReviewsSection';
import { formatProductVolume } from '@/utils/productUtils';

// --- Ilustração de frasco luxuoso quando não houver foto cadastrada ---
function LuxuryBottleIllustration({ family }: { family?: string }) {
  const isWoody = family?.toLowerCase().includes('amadeirad');
  const isCitrus =
    family?.toLowerCase().includes('cítric') ||
    family?.toLowerCase().includes('citric');

  const capGradient = ['#E5B25D', '#9A6B29'];
  const bodyGradient = isWoody
    ? ['#734128', '#381A0E']
    : isCitrus
    ? ['#F6D066', '#D9981E']
    : ['#E9AE56', '#BD7320'];

  return (
    <Svg width={140} height={190} viewBox="0 0 140 190">
      <Defs>
        <LinearGradient id="goldCapGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={capGradient[0]} />
          <Stop offset="100%" stopColor={capGradient[1]} />
        </LinearGradient>
        <LinearGradient id="bottleAmberGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={bodyGradient[0]} />
          <Stop offset="100%" stopColor={bodyGradient[1]} />
        </LinearGradient>
      </Defs>

      {/* Tampa */}
      <Rect x="54" y="10" width="32" height="26" rx="5" fill="url(#goldCapGrad)" />
      {/* Gargalo */}
      <Rect x="62" y="36" width="16" height="8" fill="#9A6B29" />
      {/* Corpo de Vidro */}
      <Rect
        x="24"
        y="44"
        width="92"
        height="136"
        rx="18"
        fill="url(#bottleAmberGrad)"
      />
      {/* Reflexo no vidro */}
      <Path
        d="M 34 54 Q 38 48 46 48 L 46 166 Q 38 166 34 160 Z"
        fill="rgba(255, 255, 255, 0.15)"
      />
      {/* Placa de rótulo */}
      <Rect
        x="42"
        y="84"
        width="56"
        height="48"
        rx="4"
        fill="rgba(255, 255, 255, 0.94)"
      />
      {/* Linhas simulando tipografia nobre */}
      <Rect x="50" y="96" width="40" height="4.5" rx="2" fill="#2C4659" />
      <Rect x="56" y="106" width="28" height="3" rx="1.5" fill="#8C7A6B" />
      <Rect x="58" y="115" width="24" height="2" rx="1" fill="#C5A880" />
    </Svg>
  );
}

export default function ProductDetailScreen() {
  const { id, storeId } = useLocalSearchParams<{ id: string; storeId?: string }>();
  const router = useRouter();
  const { addItem, totalItemsCount } = useCart();
  const { width: windowWidth } = useWindowDimensions();
  const maxWidth = Math.min(windowWidth, 480);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (storeId) {
      router.replace({
        pathname: '/store/[id]' as never,
        params: { id: storeId },
      });
    } else {
      router.replace('/(shop)/explore' as never);
    }
  };

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [allProducts, setAllProducts] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Volumetria selecionada (número em ml, ex: 10, 75, 100, 125)
  const [selectedVolume, setSelectedVolume] = useState<number | null>(null);

  // Oferta de loja selecionada
  const [selectedOffer, setSelectedOffer] = useState<ProductStoreOffer | null>(null);

  // Simulador de CEP e cálculo real de frete
  const [cep, setCep] = useState('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteResponse | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Avaliações do perfume
  const [reviews, setReviews] = useState<ApiStoreReview[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<StoreReviewsSummary | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const loadData = async () => {
      try {
        const revData = await storesService.getProductReviews(id, { storeId });
        if (isMounted) {
          setReviews(revData.results || []);
          setReviewsSummary(revData.summary || null);
        }
      } catch {
        if (isMounted) {
          setReviews([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    };

    void loadData();

    Promise.all([
      storesService.getProduct(id),
      storesService.getProducts(),
    ])
      .then(([prodData, listData]) => {
        if (!isMounted) return;
        setProduct(prodData);
        setAllProducts(listData);
        setError(false);

        // Se storeId foi fornecido (ex: vindo da vitrine de uma loja específica),
        // filtra ou prioriza as ofertas e volumetrias dessa loja específica!
        const offers = prodData.store_offers || [];
        const storeOffers = storeId
          ? offers.filter((o) => o.store_id.toString() === storeId.toString())
          : [];
        const relevantOffers = storeOffers.length > 0 ? storeOffers : offers;

        // Volumes disponíveis para a loja do contexto (ou gerais caso não haja contexto de loja)
        const relevantVolumes = storeOffers.length > 0
          ? Array.from(new Set(storeOffers.map((o) => o.volume_ml))).sort((a, b) => a - b)
          : (prodData.available_volumes || []);

        if (relevantVolumes.length > 0) {
          const firstVol = relevantVolumes[0];
          setSelectedVolume(firstVol);
          const offer = relevantOffers.find((o) => o.volume_ml === firstVol);
          setSelectedOffer(offer || relevantOffers[0] || null);
        } else if (relevantOffers.length > 0) {
          setSelectedOffer(relevantOffers[0]);
          setSelectedVolume(relevantOffers[0].volume_ml);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao carregar produto:', err);
        setError(true);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, storeId]);

  // Ao trocar o volume selecionado
  const handleSelectVolume = (vol: number) => {
    setSelectedVolume(vol);
    if (!product?.store_offers) return;
    // Se storeId estiver presente, busca a oferta deste volume da loja selecionada primeiro
    const matchingOffer = (storeId
      ? product.store_offers.find((o) => o.store_id.toString() === storeId.toString() && o.volume_ml === vol)
      : undefined) || product.store_offers.find((o) => o.volume_ml === vol);
    if (matchingOffer) {
      setSelectedOffer(matchingOffer);
      // Se já houver CEP calculado, recalcula com a nova oferta
      if (cep.replace(/\D/g, '').length === 8) {
        calculateRealShipping(cep, matchingOffer);
      }
    }
  };

  // Cálculo de frete real conectado ao backend
  const calculateRealShipping = async (targetCep: string, offerToUse = selectedOffer) => {
    const cleanCep = targetCep.replace(/\D/g, '');
    if (!cleanCep || cleanCep.length !== 8) {
      setShippingError('Informe um CEP válido com 8 dígitos.');
      setShippingQuote(null);
      return;
    }

    const storeId = offerToUse?.store_id || product?.store_offers?.[0]?.store_id;
    if (!storeId) {
      setShippingError('Nenhuma loja disponível para calcular o frete deste perfume.');
      setShippingQuote(null);
      return;
    }

    const price = offerToUse ? Number(offerToUse.price) : (product?.min_price || 0);

    try {
      setIsCalculatingShipping(true);
      setShippingError(null);
      const quote = await storesService.calculateShippingQuote(storeId, {
        postal_code: cleanCep,
        cart_subtotal: price,
      });
      setShippingQuote(quote);
    } catch (err: any) {
      console.error('Erro ao calcular frete no backend:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.detail;
      setShippingError(serverMsg || 'Não foi possível calcular o frete para este CEP.');
      setShippingQuote(null);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleCalculateShipping = () => {
    calculateRealShipping(cep, selectedOffer);
  };

  // 1) Recomendações formatadas no padrão do catálogo:
  // Cada perfume aparece somente 1 vez com "A partir de R$ ..." se houver variações,
  // e ao clicar redireciona para a página de detalhes daquele perfume.
  const recommendedItems = useMemo(() => {
    if (!product) return [];
    
    // Todos os perfumes da plataforma exceto o que já está aberto na tela
    const others = allProducts.filter((p) => p.id !== product.id);

    return others.map((p) => {
      const hasVariations = (p.available_volumes && p.available_volumes.length > 1) || 
                            (p.store_offers && p.store_offers.length > 1);
      const minPrice = p.min_price ?? (
        p.store_offers && p.store_offers.length > 0 
          ? Math.min(...p.store_offers.map((o) => parseFloat(o.price) || 0))
          : 0
      );
      const primaryOffer = p.store_offers && p.store_offers.length > 0 ? p.store_offers[0] : null;

      return {
        id: p.id,
        product_id: p.id,
        product_name: p.name,
        brand_name: p.brand?.name || 'NOTA',
        olfactory_family: p.olfactory_family || 'Geral',
        price: minPrice ? minPrice.toString() : '0',
        image_url: p.image_url,
        store_name: primaryOffer?.store_name || p.store_name || '',
        is_official: primaryOffer?.is_official ?? p.store_is_official ?? false,
        store_city: primaryOffer?.city || p.store_city || '',
        store_state: primaryOffer?.state || p.store_state || '',
        sold_count: p.sold_count || 0,
        hasMultipleVariations: Boolean(hasVariations),
      };
    });
  }, [allProducts, product]);

  const storeOffersForProduct = useMemo(() => {
    if (!product?.store_offers) return [];
    if (!storeId) return product.store_offers;
    const filtered = product.store_offers.filter((o) => o.store_id.toString() === storeId.toString());
    return filtered.length > 0 ? filtered : product.store_offers;
  }, [product, storeId]);

  const displayVolumes = useMemo(() => {
    if (storeOffersForProduct.length > 0 && storeId) {
      return Array.from(new Set(storeOffersForProduct.map((o) => o.volume_ml))).sort((a, b) => a - b);
    }
    return product?.available_volumes || [];
  }, [storeOffersForProduct, storeId, product]);

  const hasVolumes = displayVolumes.length > 0;

  const currentPrice = selectedOffer
    ? Number(selectedOffer.price)
    : product?.min_price || null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#2C4659" />
        <Text style={styles.loadingText}>Carregando perfume...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.heroActionBar, { paddingHorizontal: 16, paddingTop: 12 }]}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.floatingCircleBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1C252E" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.productTitle}>Perfume indisponível</Text>
          <Text style={styles.mutedText}>
            Não foi possível carregar os dados reais deste perfume no banco de dados.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleGoBack}
          >
            <Text style={styles.retryBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Floating Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <View style={[styles.mainWrapper, { maxWidth }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ========================================================= */}
          {/* 1. TOP HERO BANNER & IMAGEM/FOTO DO PERFUME */}
          {/* ========================================================= */}
          <View style={styles.heroBanner}>
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={styles.realProductImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.bottleCenterWrapper}>
                <LuxuryBottleIllustration family={product.olfactory_family} />
              </View>
            )}

            {/* Botões de Ação Flutuantes sobre a Imagem */}
            <View style={styles.heroActionBar}>
              <TouchableOpacity
                onPress={handleGoBack}
                style={styles.floatingCircleBtn}
                accessibilityLabel="Voltar"
              >
                <MaterialIcons name="arrow-back" size={22} color="#1C252E" />
              </TouchableOpacity>

              <View style={styles.heroRightActions}>
                <TouchableOpacity
                  onPress={() => showToast('Link do perfume copiado!')}
                  style={styles.floatingCircleBtn}
                  accessibilityLabel="Compartilhar"
                >
                  <MaterialIcons name="share" size={20} color="#1C252E" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setIsFavorite(!isFavorite);
                    showToast(
                      !isFavorite
                        ? 'Adicionado aos favoritos!'
                        : 'Removido dos favoritos'
                    );
                  }}
                  style={styles.floatingCircleBtn}
                  accessibilityLabel="Favoritar"
                >
                  <MaterialIcons
                    name={isFavorite ? 'favorite' : 'favorite-border'}
                    size={22}
                    color={isFavorite ? '#DC2626' : '#1C252E'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 2. INFORMAÇÕES DO PRODUTO (BD) */}
          {/* ========================================================= */}
          <View style={styles.cardSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Text style={styles.brandSubtitle}>
                {selectedOffer?.store_name
                  ? selectedOffer.store_name.toUpperCase()
                  : product.store_name
                  ? product.store_name.toUpperCase()
                  : product.brand?.name?.toUpperCase() || 'ALTA PERFUMARIA'}
                {(selectedOffer?.is_official ?? product.store_is_official) ? (
                  <Text> <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" /></Text>
                ) : null}
              </Text>
            </View>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.concentrationSubtext}>
              {product.concentration || 'Eau de Parfum'} • {product.olfactory_family}
            </Text>

            {/* Tags de Classificação e Família Olfativa cadastradas no BD */}
            <View style={styles.familyPillsRow}>
              {product.gender ? (
                <View style={styles.familyPill}>
                  <Text style={styles.familyPillText}>
                    {product.gender}
                  </Text>
                </View>
              ) : null}
              {product.olfactory_family ? (
                <View style={styles.familyPill}>
                  <Text style={styles.familyPillText}>
                    {product.olfactory_family}
                  </Text>
                </View>
              ) : null}
              {product.sold_count !== undefined && product.sold_count > 0 ? (
                <View style={[styles.familyPill, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}>
                  <Text style={[styles.familyPillText, { color: '#C2410C', fontWeight: '700' }]}>
                    🔥 {product.sold_count} {product.sold_count === 1 ? 'vendido' : 'vendidos'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Preço real do BD */}
            {currentPrice !== null ? (
              <View style={styles.priceContainer}>
                <Text style={styles.priceStartingText}>
                  {hasVolumes && displayVolumes.length > 1
                    ? 'A partir de'
                    : 'Preço'}
                </Text>
                <View style={styles.priceValueRow}>
                  <Text style={styles.priceMainText}>
                    R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <Text style={styles.installmentText}>
                  {`ou 10x de R$ ${(currentPrice / 10).toFixed(2).replace('.', ',')} sem juros • `}
                  <Text style={styles.pixDiscountText}>
                    {`Pix: R$ ${(currentPrice * 0.95).toFixed(2).replace('.', ',')} (5% off)`}
                  </Text>
                </Text>
                {selectedOffer ? (
                  <TouchableOpacity
                    style={styles.selectedStoreBadgeRow}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/store/[id]' as never,
                        params: { id: selectedOffer.store_id.toString() },
                      })
                    }
                  >
                    <Ionicons name="storefront" size={14} color="#2C4659" />
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.selectedStoreBadgeText}>
                        {`Vendido e entregue por: `}
                        <Text style={{ fontWeight: '800' }}>{selectedOffer.store_name}</Text>
                        {selectedOffer.is_official ? (
                          <Text> <Ionicons name="checkmark-circle" size={13} color="#1D9BF0" /></Text>
                        ) : null}
                      </Text>
                      {Boolean(selectedOffer.city || selectedOffer.state || product.store_city || product.store_state) ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Ionicons name="location-outline" size={12} color="#5A6067" />
                          <Text style={{ fontSize: 11, color: '#5A6067', fontWeight: '600' }}>
                            {selectedOffer.city && selectedOffer.state
                              ? `${selectedOffer.city}, ${selectedOffer.state}`
                              : (selectedOffer.city || selectedOffer.state || product.store_city || product.store_state)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.priceContainer}>
                <Text style={styles.priceStartingText}>
                  Nenhuma loja com estoque disponível no momento
                </Text>
              </View>
            )}
          </View>

          {/* ========================================================= */}
          {/* 3. TAMANHO / VOLUMES CADASTRADOS NO BD */}
          {/* ========================================================= */}
          {hasVolumes ? (
            <View style={styles.sectionWrapper}>
              <Text style={styles.sectionHeaderTitle}>Tamanho disponível</Text>
              <View style={styles.volumesRow}>
                {displayVolumes.map((vol) => {
                  const isSelected = selectedVolume === vol;
                  // Encontra a melhor oferta para este volume (priorizando a loja atual)
                  const offerForVol =
                    storeOffersForProduct.find((o) => o.volume_ml === vol) ||
                    product.store_offers?.find((o) => o.volume_ml === vol);
                  const isDecant = vol <= 15;
                  const label = isDecant ? `Decant ${vol}ml` : `${vol} ml`;

                  return (
                    <TouchableOpacity
                      key={vol}
                      style={[
                        styles.volumeCard,
                        isSelected && styles.volumeCardSelected,
                      ]}
                      onPress={() => handleSelectVolume(vol)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.volumeLabelText,
                          isSelected && styles.volumeLabelTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                      {offerForVol ? (
                        <Text
                          style={[
                            styles.volumePriceText,
                            isSelected && styles.volumePriceTextSelected,
                          ]}
                        >
                          R$ {Number(offerForVol.price).toFixed(0)}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* 4. CALCULAR FRETE / ENTREGA */}
          {/* ========================================================= */}
          <View style={styles.sectionWrapper}>
            <Text style={styles.sectionHeaderTitle}>Entrega</Text>
            <View style={styles.cepInputRow}>
              <View style={styles.cepInputFieldWrapper}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#9CA3AF"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  placeholder="Digite seu CEP"
                  placeholderTextColor="#9CA3AF"
                  value={cep}
                  onChangeText={setCep}
                  keyboardType="numeric"
                  maxLength={9}
                  style={styles.cepTextInput}
                />
              </View>
              <TouchableOpacity
                style={styles.calcCepBtn}
                onPress={handleCalculateShipping}
                activeOpacity={0.8}
              >
                <Text style={styles.calcCepBtnText}>Calcular</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback de erro */}
            {shippingError ? (
              <View style={styles.shippingErrorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text style={styles.shippingErrorText}>{shippingError}</Text>
              </View>
            ) : null}

            {/* Loading */}
            {isCalculatingShipping ? (
              <View style={styles.shippingLoadingBox}>
                <ActivityIndicator size="small" color="#2C4659" />
                <Text style={styles.shippingLoadingText}>Consultando prazos e fretes com o vendedor...</Text>
              </View>
            ) : null}

            {/* Resultado real por métodos (PAC / SEDEX) */}
            {shippingQuote && !isCalculatingShipping ? (
              <View style={styles.shippingResultsList}>
                <View style={styles.shippingOriginBadge}>
                  <Ionicons name="storefront-outline" size={13} color="#2C4659" />
                  <Text style={styles.shippingOriginText}>
                    Enviado de {shippingQuote.origin_state || 'Origem'} • {shippingQuote.region_description}
                  </Text>
                </View>

                {shippingQuote.methods.map((method) => (
                  <View key={method.id} style={styles.shippingMethodCard}>
                    <View style={styles.shippingMethodHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialIcons
                          name="local-shipping"
                          size={18}
                          color={method.is_free ? '#059669' : '#2C4659'}
                        />
                        <Text style={styles.shippingMethodName}>{method.name}</Text>
                        {method.is_free ? (
                          <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>Grátis</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.shippingMethodPrice, method.is_free && styles.shippingFreePrice]}>
                        {method.is_free ? 'R$ 0,00' : `R$ ${method.price.toFixed(2).replace('.', ',')}`}
                      </Text>
                    </View>

                    <Text style={styles.shippingMethodDeadline}>
                      Prazo total: {method.total_delivery_days_min} a {method.total_delivery_days_max} dias úteis
                    </Text>

                    <Text style={styles.shippingMethodBreakdown}>
                      (Despacho em até {method.handling_days} {method.handling_days === 1 ? 'dia útil' : 'dias úteis'} + trânsito de {method.transit_days_min} a {method.transit_days_max} dias)
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.securityRow}>
              <MaterialIcons name="shield" size={15} color="#78716C" />
              <Text style={styles.securityText}>
                Garantia da plataforma • Envio seguro e rastreado
              </Text>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 5. PIRÂMIDE OLFATIVA (BD) */}
          {/* ========================================================= */}
          {Boolean((product.top_notes && product.top_notes.length > 0) ||
            (product.heart_notes && product.heart_notes.length > 0) ||
            (product.base_notes && product.base_notes.length > 0)) ? (
            <View style={styles.sectionWrapper}>
              <Text style={styles.sectionHeaderTitle}>Pirâmide olfativa</Text>
              <View style={styles.pyramidContainer}>
                {Array.isArray(product.top_notes) && product.top_notes.length > 0 ? (
                  <View style={styles.pyramidStage}>
                    <View style={styles.pyramidStageHeader}>
                      <View style={[styles.pyramidDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.pyramidStageTitle}>Notas de Saída</Text>
                    </View>
                    <View style={styles.notesPillList}>
                      {product.top_notes
                        .filter((note) => typeof note === 'string' && note.trim().length > 0)
                        .map((note, index) => (
                          <View key={`top-${index}`} style={styles.notePill}>
                            <Text style={styles.notePillText}>{String(note)}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}

                {Array.isArray(product.heart_notes) && product.heart_notes.length > 0 ? (
                  <View style={styles.pyramidStage}>
                    <View style={styles.pyramidStageHeader}>
                      <View style={[styles.pyramidDot, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.pyramidStageTitle}>Notas de Coração</Text>
                    </View>
                    <View style={styles.notesPillList}>
                      {product.heart_notes
                        .filter((note) => typeof note === 'string' && note.trim().length > 0)
                        .map((note, index) => (
                          <View key={`heart-${index}`} style={styles.notePill}>
                            <Text style={styles.notePillText}>{String(note)}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}

                {Array.isArray(product.base_notes) && product.base_notes.length > 0 ? (
                  <View style={styles.pyramidStage}>
                    <View style={styles.pyramidStageHeader}>
                      <View style={[styles.pyramidDot, { backgroundColor: '#B45309' }]} />
                      <Text style={styles.pyramidStageTitle}>Notas de Fundo</Text>
                    </View>
                    <View style={styles.notesPillList}>
                      {product.base_notes
                        .filter((note) => typeof note === 'string' && note.trim().length > 0)
                        .map((note, index) => (
                          <View key={`base-${index}`} style={styles.notePill}>
                            <Text style={styles.notePillText}>{String(note)}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* 6. SOBRE A FRAGRÂNCIA (BD) */}
          {/* ========================================================= */}
          {product.description ? (
            <View style={styles.sectionWrapper}>
              <Text style={styles.sectionHeaderTitle}>Sobre a fragrância</Text>
              <Text
                style={styles.aboutParagraph}
                numberOfLines={showFullDesc ? undefined : 3}
              >
                {product.description}
              </Text>
              {product.description.length > 120 ? (
                <TouchableOpacity
                  onPress={() => setShowFullDesc(!showFullDesc)}
                  style={styles.seeMoreBtn}
                >
                  <Text style={styles.seeMoreBtnText}>
                    {showFullDesc ? 'Ver menos' : 'Ver mais'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* ========================================================= */}
          {/* AVALIAÇÕES DO PRODUTO (ESTILO SHOPEE) */}
          {/* ========================================================= */}
          <View style={styles.reviewsSectionShopee}>
            {/* Cabeçalho da seção */}
            <View style={styles.reviewsShopeeHeader}>
              <View style={styles.reviewsShopeeTitleWrap}>
                <Text style={styles.reviewsShopeeTitle}>Avaliações do Produto</Text>
                <View style={styles.reviewsShopeeScoreRow}>
                  <MaterialIcons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.reviewsShopeeScoreText}>
                    {reviewsSummary && reviewsSummary.count > 0
                      ? reviewsSummary.average.toFixed(1).replace('.', ',')
                      : '5,0'}
                  </Text>
                  <Text style={styles.reviewsShopeeCountText}>
                    ({reviewsSummary?.count ?? reviews.length} avaliações)
                  </Text>
                </View>
              </View>

              {reviews.length > 0 && (
                <TouchableOpacity
                  style={styles.reviewsShopeeViewAllBtn}
                  onPress={() => {
                    if (storeId) {
                      router.push({
                        pathname: '/store/[id]/product/[productId]/reviews' as any,
                        params: {
                          id: storeId.toString(),
                          productId: id.toString(),
                          storeName: selectedOffer?.store_name || 'Loja',
                          rating: reviewsSummary?.average?.toString(),
                          reviewsCount: reviewsSummary?.count?.toString(),
                        },
                      });
                    } else {
                      setShowAllReviewsModal(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reviewsShopeeViewAllText}>Ver todas</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#D97706" />
                </TouchableOpacity>
              )}
            </View>

            {/* Prévia das primeiras avaliações (1 a 2 comentários como na Shopee) */}
            {isLoadingReviews ? (
              <View style={styles.reviewsShopeeLoading}>
                <ActivityIndicator size="small" color="#2C4659" />
                <Text style={styles.reviewsShopeeLoadingText}>Carregando avaliações...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewsShopeeEmpty}>
                <MaterialIcons name="star-outline" size={32} color="#D1D5DB" />
                <Text style={styles.reviewsShopeeEmptyText}>
                  Este perfume ainda não possui avaliações.
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsShopeeList}>
                {reviews.slice(0, 2).map((rev) => (
                  <View key={rev.id} style={styles.reviewsShopeeCard}>
                    {/* Linha do autor e data */}
                    <View style={styles.reviewsShopeeUserRow}>
                      <View style={styles.reviewsShopeeAvatar}>
                        <Text style={styles.reviewsShopeeAvatarText}>
                          {(rev.author_name || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewsShopeeUserName}>{rev.author_name}</Text>
                        <View style={styles.reviewsShopeeStarsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <MaterialIcons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={13}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewsShopeeDate}>
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('pt-BR') : ''}
                      </Text>
                    </View>

                    {/* Variação/Volume comprado */}
                    {Boolean(rev.volume_ml) && (
                      <Text style={styles.reviewsShopeeVariation}>
                        Variação: {formatProductVolume(rev.volume_ml)}
                      </Text>
                    )}

                    {/* Comentário */}
                    {Boolean(rev.comment) && (
                      <Text style={styles.reviewsShopeeComment} numberOfLines={3}>
                        {rev.comment}
                      </Text>
                    )}

                    {/* Miniaturas de fotos */}
                    {rev.photos && rev.photos.length > 0 && (
                      <View style={styles.reviewsShopeePhotosRow}>
                        {rev.photos.slice(0, 3).map((p) => (
                          <Image
                            key={p.id}
                            source={{ uri: p.image }}
                            style={styles.reviewsShopeePhotoThumb}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ))}
                      </View>
                    )}

                    {/* Resposta da Loja */}
                    {rev.reply && (
                      <View style={styles.reviewsShopeeReplyBox}>
                        <View style={styles.reviewsShopeeReplyHeader}>
                          <MaterialIcons name="subdirectory-arrow-right" size={13} color="#2C4659" />
                          <Text style={styles.reviewsShopeeReplyStoreName}>
                            Resposta da Loja {rev.reply.author_name ? `(${rev.reply.author_name})` : ''}
                          </Text>
                          {rev.reply.created_at && (
                            <Text style={styles.reviewsShopeeReplyDate}>
                              {new Date(rev.reply.created_at).toLocaleDateString('pt-BR')}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.reviewsShopeeReplyText}>{rev.reply.text}</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Botão para visualizar todas */}
                {reviews.length > 2 && (
                  <TouchableOpacity
                    style={styles.reviewsShopeeBottomButton}
                    onPress={() => {
                      if (storeId) {
                        router.push({
                          pathname: '/store/[id]/product/[productId]/reviews' as any,
                          params: {
                            id: storeId.toString(),
                            productId: id.toString(),
                            storeName: selectedOffer?.store_name || 'Loja',
                            rating: reviewsSummary?.average?.toString(),
                            reviewsCount: reviewsSummary?.count?.toString(),
                          },
                        });
                      } else {
                        setShowAllReviewsModal(true);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reviewsShopeeBottomButtonText}>
                      Ver todas as {reviews.length} avaliações
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color="#2C4659" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ========================================================= */}
          {/* 7. SEÇÃO UNIFICADA DE RECOMENDAÇÕES */}
          {/* ========================================================= */}
          {recommendedItems.length > 0 ? (
            <View style={styles.shopeeSectionWrapper}>
              <View style={styles.shopeeHeaderRow}>
                <View style={styles.shopeeTitleGroup}>
                  <Ionicons name="sparkles" size={18} color="#2C4659" />
                  <Text style={styles.shopeeSectionTitle}>Recomendações</Text>
                </View>
              </View>

              <View style={styles.shopeeGrid}>
                {recommendedItems.map((item) => (
                  <ProductCard
                    key={`rec-${item.id}`}
                    product={item}
                    hasMultipleVariations={item.hasMultipleVariations}
                    onPress={() => {
                      router.push({
                        pathname: '/product/[id]' as never,
                        params: { id: item.id.toString() },
                      });
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ========================================================= */}
        {/* 8. BARRA FIXA INFERIOR COM DADOS REAIS */}
        {/* ========================================================= */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBarStoreInfo}>
            <Text style={styles.bottomBarStoreName} numberOfLines={1}>
              {selectedOffer
                ? selectedOffer.store_name
                : 'Selecione uma opção'}
            </Text>
            <Text style={styles.bottomBarPriceText}>
              {currentPrice !== null
                ? `R$ ${currentPrice.toFixed(2).replace('.', ',')}`
                : 'Indisponível'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              currentPrice === null && { backgroundColor: '#9CA3AF' },
            ]}
            disabled={currentPrice === null}
            activeOpacity={0.85}
            onPress={() => {
              if (currentPrice === null) return;
              const volNumber = selectedVolume || product.available_volumes?.[0] || 50;
              const volLabel = volNumber <= 15 ? `Decant ${volNumber}ml` : `${volNumber}ml`;
              addItem({
                productId: product.id,
                productName: product.name,
                brandName: selectedOffer?.store_name || product.store_name || product.brand?.name || 'Alta Perfumaria',
                volume: volLabel,
                volumeMl: volNumber,
                price: currentPrice,
                imageUrl: product.image_url,
                storeProductId: selectedOffer?.id,
                storeId: selectedOffer?.store_id,
                storeName: selectedOffer?.store_name || product.store_name,
                storeIsOfficial: selectedOffer?.is_official ?? product.store_is_official,
                storeCity: selectedOffer?.city || product.store_city,
                storeState: selectedOffer?.state || product.store_state,
              });
              showToast(`${product.name} adicionado à sacola!`);
            }}
          >
            <Text style={styles.addToCartBtnText}>Adicionar à sacola</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bagIconBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(shop)/cart' as never)}
            accessibilityLabel="Sacola de compras"
          >
            <MaterialIcons name="shopping-bag" size={22} color="#2C4659" />
            {totalItemsCount > 0 ? (
              <View style={styles.bagBadge}>
                <Text style={styles.bagBadgeText}>
                  {totalItemsCount > 99 ? '99+' : totalItemsCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Modal de Todas as Avaliações do Perfume */}
        <StoreReviewsModal
          visible={showAllReviewsModal}
          onClose={() => setShowAllReviewsModal(false)}
          productId={product.id}
          storeId={storeId || selectedOffer?.store_id}
          storeName={product.name}
          rating={reviewsSummary?.average ?? 5.0}
          reviewsCount={reviewsSummary?.count ?? reviews.length}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F8F6F0',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#78716C',
    fontWeight: '500',
  },
  mutedText: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 6,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2C4659',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(28, 37, 46, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hero Banner com Foto do Perfume
  heroBanner: {
    width: '100%',
    height: 360,
    position: 'relative',
    backgroundColor: '#EBE6DC',
    overflow: 'hidden',
  },
  realProductImage: {
    width: '100%',
    height: '100%',
  },
  bottleCenterWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  heroRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  floatingCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // Informações do produto
  cardSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#8A7B6E',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C252E',
    letterSpacing: -0.5,
  },
  concentrationSubtext: {
    fontSize: 14,
    color: '#78716C',
    marginTop: 2,
  },
  familyPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  familyPill: {
    backgroundColor: '#EBE6DC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  familyPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524B43',
  },

  // Preço
  priceContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
  },
  priceStartingText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceMainText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1C252E',
  },
  installmentText: {
    fontSize: 12.5,
    color: '#78716C',
    marginTop: 4,
  },
  pixDiscountText: {
    color: '#059669',
    fontWeight: '700',
  },
  selectedStoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E4EAEF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  selectedStoreBadgeText: {
    fontSize: 12,
    color: '#2C4659',
  },

  // Seção Geral
  sectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C252E',
    marginBottom: 12,
  },

  // Volumes
  volumesRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  volumeCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EFECE4',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  volumeCardSelected: {
    borderColor: '#2C4659',
    backgroundColor: '#F3F6F8',
  },
  volumeLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
  },
  volumeLabelTextSelected: {
    color: '#2C4659',
  },
  volumePriceText: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 4,
  },
  volumePriceTextSelected: {
    color: '#2C4659',
    fontWeight: '700',
  },

  // Entrega
  cepInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cepInputFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DED5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  cepTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C252E',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outlineWidth: 0,
        } as any)
      : {}),
  },
  calcCepBtn: {
    backgroundColor: '#2C4659',
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcCepBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  shippingLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F6F8',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  shippingLoadingText: {
    fontSize: 12.5,
    color: '#2C4659',
    fontWeight: '500',
  },
  shippingErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  shippingErrorText: {
    fontSize: 12.5,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  shippingResultsList: {
    marginTop: 12,
    gap: 10,
  },
  shippingOriginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shippingOriginText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2C4659',
  },
  shippingMethodCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D2',
    borderRadius: 12,
    padding: 12,
  },
  shippingMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shippingMethodName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  freeBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
  },
  shippingMethodPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C252E',
  },
  shippingFreePrice: {
    color: '#059669',
  },
  shippingMethodDeadline: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  shippingMethodBreakdown: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#78716C',
  },

  // Pirâmide Olfativa
  pyramidContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE4',
    gap: 14,
  },
  pyramidStage: {
    gap: 8,
  },
  pyramidStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pyramidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pyramidStageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C252E',
  },
  notesPillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  notePill: {
    backgroundColor: '#F5F3ED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  notePillText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },

  // Sobre
  aboutParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  seeMoreBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  seeMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C4659',
  },

  // Shopee Recommendations
  shopeeSectionWrapper: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  shopeeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shopeeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopeeSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C252E',
  },
  shopeeBadgeHint: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78716C',
  },
  shopeeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Bottom Fixed Bar
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarStoreInfo: {
    flex: 1,
  },
  bottomBarStoreName: {
    fontSize: 11.5,
    color: '#78716C',
    fontWeight: '500',
  },
  bottomBarPriceText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1C252E',
  },
  addToCartBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  bagIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DED5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  bagBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#A85A38',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bagBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    lineHeight: 12,
  },
  // --- Estilos Shopee: Avaliações do Produto ---
  reviewsSectionShopee: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewsShopeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewsShopeeTitleWrap: {
    flex: 1,
  },
  reviewsShopeeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C252E',
  },
  reviewsShopeeScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  reviewsShopeeScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewsShopeeCountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewsShopeeViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewsShopeeViewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewsShopeeLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  reviewsShopeeLoadingText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewsShopeeEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  reviewsShopeeEmptyText: {
    fontSize: 12.5,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  reviewsShopeeList: {
    marginTop: 8,
  },
  reviewsShopeeCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  reviewsShopeeUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reviewsShopeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E4EAEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsShopeeAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
  reviewsShopeeUserName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewsShopeeStarsRow: {
    flexDirection: 'row',
    marginTop: 1,
  },
  reviewsShopeeDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  reviewsShopeeVariation: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewsShopeeComment: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },
  reviewsShopeePhotosRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  reviewsShopeePhotoThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewsShopeeBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reviewsShopeeBottomButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2C4659',
    marginRight: 2,
  },
  reviewsShopeeReplyBox: {
    marginTop: 8,
    backgroundColor: '#F7F5EE',
    borderRadius: 8,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#2C4659',
  },
  reviewsShopeeReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  reviewsShopeeReplyStoreName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2C4659',
    flex: 1,
  },
  reviewsShopeeReplyDate: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  reviewsShopeeReplyText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
});