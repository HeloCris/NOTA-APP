import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { StoreProduct } from '@/services/stores';

interface ProductCardProps {
  product: StoreProduct;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>Perfume</Text>
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{product.olfactory_family}</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand_name}
          </Text>
          <Text style={styles.productName} numberOfLines={1}>
            {product.product_name}
          </Text>
          <Text style={styles.price}>
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
          </Text>
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
});