import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { StoreProduct } from '@/services/stores';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ProductCardProps {
  product: StoreProduct;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <ThemedText type="small" themeColor="textSecondary">Perfume</ThemedText>
            </View>
          )}
          <ThemedView type="backgroundSelected" style={styles.badgeContainer}>
            <ThemedText type="code">{product.olfactory_family}</ThemedText>
          </ThemedView>
        </View>
        <View style={styles.infoContainer}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.productName}>
            {product.product_name}
          </ThemedText>
          <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
            {product.brand_name}
          </ThemedText>
          <ThemedText type="default" style={styles.price}>
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: Spacing.one,
    maxWidth: '48%',
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
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
  badgeContainer: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    opacity: 0.9,
  },
  infoContainer: {
    padding: Spacing.two,
  },
  productName: {
    marginBottom: 2,
  },
  price: {
    fontWeight: '700',
    marginTop: Spacing.one,
  },
});