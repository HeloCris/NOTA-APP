import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { storesService, Store } from '../../../services/stores';

export default function ShopHomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    storesService.getStores()
      .then(setStores)
      .catch((error) => console.error('Erro ao carregar lojas:', error))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>Bem-vindo à Loja!</Text>
      <Text style={styles.profile}>Perfil: {user?.olfactory_families?.join(', ')}</Text>
      <Text style={styles.title}>Lojas disponíveis</Text>
      {isLoading ? <ActivityIndicator /> : (
        <View style={styles.storeList}>
          {stores.length === 0 ? <Text>Nenhuma loja disponível.</Text> : stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeButton}
              onPress={() => router.push({ pathname: '/store/[id]' as never, params: { id: store.id.toString() } })}
            >
              <Text style={styles.storeName}>{store.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Button title="Sair" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  welcomeTitle: { fontSize: 20, marginBottom: 20 },
  profile: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  storeList: { marginBottom: 24 },
  storeButton: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  storeName: { fontSize: 16, fontWeight: '600' },
});
