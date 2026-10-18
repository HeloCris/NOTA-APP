import React, { useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Store, storesService } from '@/services/stores';

interface StoreHeroProps {
  store: Store;
  scrollY?: Animated.Value;
  productsCount?: number;
  onOpenReviews?: () => void;
  onContactPress?: () => void;
}

export function StoreHero({
  store,
  scrollY,
  productsCount,
  onOpenReviews,
  onContactPress,
}: StoreHeroProps) {
  const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);
  const [canExpandBio, setCanExpandBio] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(Boolean(store.is_following));
  const [followersCount, setFollowersCount] = useState<number>(store.followers_count ?? 0);

  const handleToggleFollow = async () => {
    // Atualização otimista
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowersCount((prev) => (nextFollowing ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await storesService.toggleFollow(store.id);
      setIsFollowing(res.is_following);
      setFollowersCount(res.followers_count);
    } catch {
      // Reverte em caso de erro (ex: não logado ou falha de rede)
      setIsFollowing(!nextFollowing);
      setFollowersCount((prev) => (!nextFollowing ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const coverTranslateY = scrollY?.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -54],
    extrapolate: 'clamp',
  });

  const ratingDisplay = (store.rating ?? 4.8).toFixed(1).replace('.', ',');
  const perfumesCount = productsCount ?? store.products_count ?? 12;
  const locationText = store.city ? `${store.city}${store.state ? `, ${store.state}` : ''}` : null;

  return (
    <View style={styles.container}>
      {/* Banner / Capa */}
      <View style={styles.coverContainer}>
        <Animated.View
          style={[
            styles.coverImageWrapper,
            coverTranslateY && { transform: [{ translateY: coverTranslateY }] },
          ]}
        >
          <Image
            source={
              store.cover_url
                ? { uri: store.cover_url }
                : require('../../../assets/images/banner.png')
            }
            style={styles.coverImage}
            contentFit="cover"
          />
        </Animated.View>
      </View>

      {/* Detalhes da Loja */}
      <View style={styles.detailsContainer}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          {store.logo_url ? (
            <Image source={{ uri: store.logo_url }} style={styles.logoImage} contentFit="cover" />
          ) : (
            <View style={styles.logoMonogramWrapper}>
              <Text style={styles.logoMonogramText}>
                {store.name?.charAt(0)?.toUpperCase() || 'N'}
              </Text>
            </View>
          )}
        </View>

        {/* Nome da Loja + Símbolo Oficial (Apenas o ícone de verificado azul) */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{store.name}</Text>
          {(store.is_official || store.is_verified) && (
            <MaterialIcons
              name="verified"
              size={18}
              color="#1D9BF0"
              style={styles.verifiedIcon}
              accessibilityLabel="Loja Oficial Verificada"
            />
          )}
        </View>

        {/* Bio com 'ver mais' / 'ver menos' condicional ao transbordamento real */}
        {store.bio ? (
          <View style={styles.bioContainer}>
            <Text
              style={styles.bioText}
              numberOfLines={isBioExpanded ? undefined : 2}
              onTextLayout={(e) => {
                if (!isBioExpanded && e.nativeEvent.lines.length > 2) {
                  setCanExpandBio(true);
                }
              }}
            >
              {store.bio}{' '}
              {canExpandBio && (
                <Text
                  style={styles.bioToggleText}
                  onPress={() => setIsBioExpanded(!isBioExpanded)}
                >
                  {isBioExpanded ? 'ver menos' : 'ver mais'}
                </Text>
              )}
            </Text>
          </View>
        ) : null}

        {/* Linha de Estatísticas: Avaliação, Perfumes e Cidade */}
        <View style={styles.statsRow}>
          {/* Avaliação (clicável para abrir avaliações) */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={onOpenReviews}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver avaliações da loja"
          >
            <MaterialIcons name="star-outline" size={16} color="#4B5563" />
            <Text style={styles.statText}>{ratingDisplay}</Text>
          </TouchableOpacity>

          {/* Quantidade de perfumes */}
          <View style={styles.statItem}>
            <MaterialIcons name="local-drink" size={15} color="#4B5563" />
            <Text style={styles.statText}>{perfumesCount} perfumes</Text>
          </View>

          {/* Seguidores */}
          <View style={styles.statItem}>
            <MaterialIcons name="people-outline" size={15} color="#4B5563" />
            <Text style={styles.statText}>
              {followersCount >= 1000
                ? `${(followersCount / 1000).toFixed(1).replace('.', ',')}k`
                : followersCount}{' '}
              seguidores
            </Text>
          </View>

          {/* Cidade/Estado se cadastrado */}
          {locationText && (
            <View style={styles.statItem}>
              <MaterialIcons name="location-on" size={15} color="#4B5563" />
              <Text style={styles.statText}>{locationText}</Text>
            </View>
          )}
        </View>

        {/* Link discreto para abrir avaliações */}
        {onOpenReviews && (
          <TouchableOpacity
            style={styles.reviewsLinkButton}
            onPress={onOpenReviews}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ver avaliações da loja"
          >
            <Text style={styles.reviewsLinkText}>Ver avaliações da loja</Text>
            <MaterialIcons name="chevron-right" size={17} color="#2C4659" />
          </TouchableOpacity>
        )}

        {/* Botões de Ação: Seguir e Falar com a loja */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isFollowing ? 'Seguindo' : 'Seguir loja'}
          >
            {isFollowing ? (
              <View style={styles.followingContent}>
                <MaterialIcons name="check" size={14} color="#1C252E" />
                <Text style={styles.followingText}>Seguindo</Text>
              </View>
            ) : (
              <Text style={styles.followText}>Seguir</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={onContactPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Falar com a loja"
          >
            <MaterialIcons name="chat-bubble-outline" size={15} color="#FFFFFF" />
            <Text style={styles.chatText}>Falar com a loja</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
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
    paddingBottom: 12,
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
  logoMonogramWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C4659',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMonogramText: {
    color: '#F4F1EA',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C252E',
    letterSpacing: -0.3,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  bioContainer: {
    marginBottom: 8,
  },
  bioText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: '#4B5563',
  },
  bioToggleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  followButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  followingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  followText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  followingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C252E',
  },
  chatButton: {
    flex: 1.2,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C252E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewsLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  reviewsLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2C4659',
    textDecorationLine: 'underline',
  },
});