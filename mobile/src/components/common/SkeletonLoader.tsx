import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';
import { ThemedView } from '@/components/themed-view';

export function SkeletonLoader() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.heroCoverSkeleton} />
      <View style={styles.heroContentSkeleton}>
        <ThemedView type="backgroundElement" style={styles.logoSkeleton} />
        <ThemedView type="backgroundElement" style={styles.lineSkeletonLarge} />
        <ThemedView type="backgroundElement" style={styles.lineSkeletonSmall} />
      </View>

      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((item) => (
          <ThemedView key={item} type="backgroundElement" style={styles.cardSkeleton}>
            <View style={styles.cardImageSkeleton} />
            <View style={styles.cardTextSkeleton} />
            <View style={styles.cardTextSkeletonShort} />
          </ThemedView>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroCoverSkeleton: {
    width: '100%',
    height: 180,
    opacity: 0.6,
  },
  heroContentSkeleton: {
    padding: Spacing.three,
  },
  logoSkeleton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginTop: -40,
    marginBottom: Spacing.two,
  },
  lineSkeletonLarge: {
    width: '60%',
    height: 20,
    borderRadius: 4,
    marginBottom: Spacing.one,
  },
  lineSkeletonSmall: {
    width: '90%',
    height: 14,
    borderRadius: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.two,
    justifyContent: 'space-between',
  },
  cardSkeleton: {
    width: '48%',
    borderRadius: Spacing.three,
    padding: Spacing.two,
    marginBottom: Spacing.three,
    height: 220,
  },
  cardImageSkeleton: {
    width: '100%',
    height: 130,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
  },
  cardTextSkeleton: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: Spacing.one,
  },
  cardTextSkeletonShort: {
    width: '40%',
    height: 14,
    borderRadius: 4,
  },
});