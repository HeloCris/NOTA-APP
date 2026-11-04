import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { storesService, FollowingStore } from '@/services/stores';

export default function FollowingStoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<FollowingStore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    storesService
      .getFollowingStores()
      .then((data) => {
        if (isMounted) {
          setStores(data);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar lojas seguidas:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await storesService.getFollowingStores();
      setStores(data);
    } catch (err) {
      console.error('Erro ao carregar lojas seguidas:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnfollow = async (storeId: number) => {
    try {
      await storesService.toggleFollow(storeId);
      setStores((prev) => prev.filter((s) => s.store_id !== storeId));
    } catch (err) {
      console.error('Erro ao deixar de seguir:', err);
    }
  };

  const renderItem = ({ item }: { item: FollowingStore }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.7}
        onPress={() => router.push(`/store/${item.store_id}` as any)}
      >
        <View style={styles.logoWrapper}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} contentFit="cover" />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoWrapper}>
          <View style={styles.titleRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_official && (
              <View style={styles.badgeOfficial}>
                <MaterialIcons name="verified" size={13} color="#D4AF37" />
                <Text style={styles.badgeOfficialText}>Oficial</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={12} color="#D97706" />
              <Text style={styles.ratingText}>
                {(item.rating || 5.0).toFixed(1).replace('.', ',')}
              </Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.followersText}>
              {item.followers_count} {item.followers_count === 1 ? 'seguidor' : 'seguidores'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.viewStoreBtn}
          onPress={() => router.push(`/store/${item.store_id}` as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewStoreText}>Ver Loja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.unfollowBtn}
          onPress={() => handleUnfollow(item.store_id)}
          activeOpacity={0.7}
        >
          <Feather name="check" size={13} color="#4A6072" />
          <Text style={styles.unfollowText}>Seguindo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1C252E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lojas que Sigo</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#354B5E" />
          <Text style={styles.loadingText}>Carregando lojas...</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={36} color="#4A6072" />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma loja seguida ainda</Text>
          <Text style={styles.emptySubtitle}>
            Siga suas perfumarias favoritas para acompanhar lançamentos e receber cupons de desconto exclusivos!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(shop)/explore' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Explorar Vitrine</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => String(item.store_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#354B5E"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E1D2',
    backgroundColor: '#F4F1EA',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBE6DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C252E',
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#637381',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE7DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F5F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#354B5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoWrapper: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C252E',
    flexShrink: 1,
  },
  badgeOfficial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF9E7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F3E5AB',
  },
  badgeOfficialText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6D1C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C252E',
  },
  dot: {
    color: '#919EAB',
    fontSize: 11,
  },
  followersText: {
    fontSize: 12,
    color: '#637381',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F3E9',
    paddingTop: 10,
  },
  viewStoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#354B5E',
  },
  viewStoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unfollowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0D7DE',
    backgroundColor: '#F8F9FA',
  },
  unfollowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A6072',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EBE6DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#637381',
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#354B5E',
    shadowColor: '#354B5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
