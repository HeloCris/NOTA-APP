import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Store } from '@/services/stores';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StoreHeroProps {
  store: Store;
}

export function StoreHero({ store }: StoreHeroProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.coverContainer}>
        {store.cover_url && (
          <Image source={{ uri: store.cover_url }} style={styles.coverImage} contentFit="cover" />
        )}
      </ThemedView>

      <View style={styles.detailsContainer}>
        <ThemedView type="background" style={styles.logoWrapper}>
          {store.logo_url ? (
            <Image source={{ uri: store.logo_url }} style={styles.logoImage} contentFit="cover" />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">Loja</ThemedText>
          )}
        </ThemedView>

        <View style={styles.nameRow}>
          <ThemedText type="subtitle">{store.name}</ThemedText>
          {store.is_verified && (
            <ThemedView type="backgroundSelected" style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color={theme.text} />
              <ThemedText type="code">Verificada ✓</ThemedText>
            </ThemedView>
          )}
        </View>

        {store.bio && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
            {store.bio}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  coverContainer: {
    width: '100%',
    height: 180,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    position: 'relative',
  },
  logoWrapper: {
    marginTop: -40,
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});