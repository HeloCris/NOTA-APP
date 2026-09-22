import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { storesService, ProductDetails } from '@/services/stores';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
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

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.text} />
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Produto indisponível</ThemedText>
        <ThemedText themeColor="textSecondary">Não foi possível carregar este perfume.</ThemedText>
      </ThemedView>
    );
  }

  const noteSections = [
    { title: 'Notas de saída', notes: product.top_notes },
    { title: 'Notas de coração', notes: product.heart_notes },
    { title: 'Notas de fundo', notes: product.base_notes },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.image} /> : null}
      <ThemedText type="subtitle">{product.name}</ThemedText>
      <ThemedText type="default" themeColor="textSecondary">{product.brand.name}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.familyBadge}>
        <ThemedText type="smallBold">{product.olfactory_family}</ThemedText>
      </ThemedView>
      {product.description ? <ThemedText style={styles.description}>{product.description}</ThemedText> : null}
      <View style={styles.notesContainer}>
        {noteSections.map((section) => (
          <View key={section.title} style={styles.noteSection}>
            <ThemedText type="smallBold">{section.title}</ThemedText>
            <ThemedText themeColor="textSecondary">{section.notes.join(' • ') || 'Não informado'}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  familyBadge: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  description: {
    marginTop: Spacing.two,
  },
  notesContainer: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  noteSection: {
    gap: Spacing.one,
  },
});