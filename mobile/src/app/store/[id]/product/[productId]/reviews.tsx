import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoreReviewsModal } from '@/components/store/StoreReviewsSection';

export default function ProductStoreReviewsScreen() {
  const router = useRouter();
  const { id, productId, storeName, rating, reviewsCount } = useLocalSearchParams<{
    id: string;
    productId: string;
    storeName?: string;
    rating?: string;
    reviewsCount?: string;
  }>();

  return (
    <View style={styles.container}>
      <StoreReviewsModal
        visible={true}
        onClose={() => router.back()}
        storeId={id}
        productId={productId}
        storeName={storeName || 'Loja'}
        rating={rating ? parseFloat(rating) : undefined}
        reviewsCount={reviewsCount ? parseInt(reviewsCount, 10) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
