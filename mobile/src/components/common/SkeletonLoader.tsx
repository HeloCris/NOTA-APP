import React from 'react';
import { View, StyleSheet } from 'react-native';

export function SkeletonLoader() {
  return (
    <View testID="store-skeleton" style={styles.container}>
      <View style={styles.heroCoverSkeleton} />
      <View style={styles.heroContentSkeleton}>
        <View style={styles.logoSkeleton} />
        <View style={styles.lineSkeletonLarge} />
        <View style={styles.lineSkeletonSmall} />
      </View>

      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.cardSkeleton}>
            <View style={styles.cardImageSkeleton} />
            <View style={styles.cardTextSkeleton} />
            <View style={styles.cardTextSkeletonShort} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  heroCoverSkeleton: {
    width: '100%',
    height: 180,
    backgroundColor: '#EFECE4',
  },
  heroContentSkeleton: {
    paddingHorizontal: 20,
  },
  logoSkeleton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginTop: -40,
    marginBottom: 8,
    backgroundColor: '#E4DFD3',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  lineSkeletonLarge: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#EFECE4',
  },
  lineSkeletonSmall: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#EFECE4',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  cardSkeleton: {
    width: '48%',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    height: 220,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  cardImageSkeleton: {
    width: '100%',
    height: 130,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAF9F5',
  },
  cardTextSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#EFECE4',
  },
  cardTextSkeletonShort: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#EFECE4',
  },
});