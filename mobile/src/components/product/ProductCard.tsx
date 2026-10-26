import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { StoreProduct } from '@/services/stores';

function VectorPerfumeBottle({ family }: { family?: string }) {
  const isWoody = family?.toLowerCase().includes('amadeirado');
  const isCitrus = family?.toLowerCase().includes('cítrico') || family?.toLowerCase().includes('citrico');
  const isFloral = family?.toLowerCase().includes('floral');

  const capGradient = ['#F5E6BE', '#C5A880'];
  const bodyGradient = isWoody
    ? ['#5C3D2E', '#2B170E']
    : isCitrus
      ? ['#FDE047', '#CA8A04']
      : isFloral
        ? ['#F9A8D4', '#BE185D']
        : ['#3A5A72', '#1C2E3D'];

  const id = (family || 'default').replace(/\s+/g, '-');

  return (
    <Svg width={70} height={100} viewBox="0 0 70 100">
      <Defs>
        <LinearGradient id={`capGrad-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={capGradient[0]} />
          <Stop offset="100%" stopColor={capGradient[1]} />
        </LinearGradient>
        <LinearGradient id={`bodyGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={bodyGradient[0]} />
          <Stop offset="100%" stopColor={bodyGradient[1]} />
        </LinearGradient>
      </Defs>
      {/* Cap */}
      <Rect x="26" y="8" width="18" height="14" rx="3" fill={`url(#capGrad-${id})`} />
      {/* Neck */}
      <Rect x="31" y="22" width="8" height="5" fill="#B39366" />
      {/* Bottle Body */}
      <Rect x="17" y="27" width="36" height="64" rx="6" fill={`url(#bodyGrad-${id})`} />
      {/* Label Plate */}
      <Rect x="23" y="46" width="24" height="26" rx="2" fill="rgba(255, 255, 255, 0.92)" />
      {/* Label Lines */}
      <Rect x="27" y="52" width="16" height="2.5" fill="#2C4659" />
      <Rect x="29" y="58" width="12" height="1.8" fill="#9CA3AF" />
    </Svg>
  );
}

interface ProductCardProps {
  product: StoreProduct;
  hasMultipleVariations?: boolean;
  onPress: () => void;
}

export function ProductCard({ product, hasMultipleVariations, onPress }: ProductCardProps) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {product.image_url && !hasError ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
              onError={() => setHasError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <VectorPerfumeBottle family={product.olfactory_family} />
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{product.olfactory_family}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.storeNameRow}>
            <Text style={styles.brand} numberOfLines={1}>
              {product.store_name ? product.store_name.toUpperCase() : product.brand_name.toUpperCase()}
            </Text>
            {product.is_official && (
              <Ionicons name="checkmark-circle" size={13} color="#1D9BF0" style={{ marginLeft: 3 }} />
            )}
          </View>
          <Text style={styles.productName} numberOfLines={1}>
            {product.product_name}
          </Text>
          <Text style={styles.price}>
            {hasMultipleVariations ? <Text style={styles.fromPriceLabel}>A partir de </Text> : null}
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
          </Text>

          {/* Linha Shopee: Vendidos | Localidade */}
          <View style={styles.shopeeMetaRow}>
            {product.sold_count !== undefined && product.sold_count > 0 ? (
              <Text style={styles.soldText}>
                {product.sold_count} {product.sold_count === 1 ? 'vendido' : 'vendidos'}
              </Text>
            ) : null}

            {product.sold_count !== undefined && product.sold_count > 0 && Boolean(product.store_city || product.store_state) ? (
              <Text style={styles.metaDivider}>•</Text>
            ) : null}

            {Boolean(product.store_city || product.store_state) ? (
              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={11} color="#9CA3AF" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {product.store_city && product.store_state
                    ? `${product.store_city}, ${product.store_state}`
                    : (product.store_city || product.store_state)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 6,
    maxWidth: '48%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFECE4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#FAF9F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#78716C',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F5F3E9',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoContainer: {
    padding: 10,
  },
  brand: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#78716C',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 6,
  },
  price: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2C4659',
  },
  fromPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
  },
  shopeeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: 6,
    gap: 4,
  },
  soldText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716C',
  },
  metaDivider: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#9CA3AF',
    flexShrink: 1,
  },
});