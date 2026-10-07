import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Store } from '@/services/stores';

interface StoreHeroProps {
  store: Store;
  scrollY?: Animated.Value;
}

export function StoreHero({ store, scrollY }: StoreHeroProps) {
  const coverTranslateY = scrollY?.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -54],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.coverContainer}>
        {store.cover_url && (
          <Animated.View style={[styles.coverImageWrapper, coverTranslateY && { transform: [{ translateY: coverTranslateY }] }]}>
            <Image source={{ uri: store.cover_url }} style={styles.coverImage} contentFit="cover" />
          </Animated.View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.logoWrapper}>
          {store.logo_url ? (
            <Image source={{ uri: store.logo_url }} style={styles.logoImage} contentFit="cover" />
          ) : (
            <Text style={styles.logoFallback}>Loja</Text>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name}>{store.name}</Text>
          {store.is_verified && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#2C4659" />
              <Text style={styles.verifiedText}>Verificada ✓</Text>
            </View>
          )}
        </View>

        {store.bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {store.bio}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#F4F1EA',
  },
  coverContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    backgroundColor: '#EFECE4',
  },
  coverImageWrapper: {
    width: '100%',
    height: 234,
  },
  coverImage: {
    width: '100%',
    height: 234,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    position: 'relative',
  },
  logoWrapper: {
    marginTop: -40,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
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
  logoFallback: {
    fontSize: 12,
    color: '#78716C',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C252E',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#E4EAEF',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C4659',
  },
  bio: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#78716C',
  },
});