import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storesService, ProductDetails } from '@/services/stores';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    storesService.getProduct(id)
      .then(setProduct)
      .catch((requestError) => {
        console.error('Erro ao carregar produto:', requestError);
        setError(true);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <MaterialIcons name="arrow-back" size={22} color="#1C252E" />
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#2C4659" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>{backButton}</View>
        <View style={styles.centered}>
          <Text style={styles.title}>Produto indisponível</Text>
          <Text style={styles.muted}>Não foi possível carregar este perfume.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const noteSections = [
    { title: 'Notas de saída', notes: product.top_notes },
    { title: 'Notas de coração', notes: product.heart_notes },
    { title: 'Notas de fundo', notes: product.base_notes },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1EA" />
      <View style={styles.topBar}>{backButton}</View>
      <ScrollView contentContainerStyle={styles.container}>
        {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.image} /> : null}
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.muted}>{product.brand.name}</Text>
        <View style={styles.familyBadge}>
          <Text style={styles.familyBadgeText}>{product.olfactory_family}</Text>
        </View>
        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
        <View style={styles.notesContainer}>
          {noteSections.map((section) => (
            <View key={section.title} style={styles.noteSection}>
              <Text style={styles.noteTitle}>{section.title}</Text>
              <Text style={styles.muted}>{section.notes.join(' • ') || 'Não informado'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE4',
  },
  container: {
    padding: 20,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#FAF9F5',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C252E',
  },
  muted: {
    fontSize: 14,
    color: '#78716C',
  },
  familyBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E4EAEF',
  },
  familyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C4659',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  notesContainer: {
    marginTop: 16,
    gap: 16,
  },
  noteSection: {
    gap: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C4659',
  },
});