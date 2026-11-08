import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { OlfactoryFamilyCard } from '../../../components/common/OlfactoryFamilyCard';
import { NoteChip } from '../../../components/common/NoteChip';
import { useAuth } from '../../../context/AuthContext';
import { storesService, CatalogNotesResponse } from '@/services/stores';

const FALLBACK_FAMILIES = [
  'Amadeirado',
  'Cítrico',
  'Oriental',
  'Floral',
  'Fougère',
  'Aquático',
  'Gourmand',
];

const FALLBACK_NOTES: Record<string, string[]> = {
  Saída: ['Bergamota', 'Limão', 'Pimenta Rosa', 'Mandarina'],
  Corpo: ['Jasmim', 'Lavanda', 'Rosa', 'Íris'],
  Fundo: ['Baunilha', 'Âmbar', 'Sândalo', 'Vetiver', 'Patchouli'],
};

export default function EditOlfactoryProfileScreen() {
  const router = useRouter();
  const { user, updateOlfactoryProfile } = useAuth();

  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(
    user?.olfactory_families ?? []
  );
  const [selectedNotes, setSelectedNotes] = useState<string[]>(
    user?.preferred_notes ?? []
  );

  const [familiesList, setFamiliesList] = useState<string[]>(FALLBACK_FAMILIES);
  const [categorizedNotes, setCategorizedNotes] =
    useState<Record<string, string[]>>(FALLBACK_NOTES);

  const [isFetchingNotes, setIsFetchingNotes] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    storesService
      .getCatalogNotes()
      .then((data: CatalogNotesResponse) => {
        if (!isMounted) return;

        if (data.families && data.families.length > 0) {
          const mergedFamilies = Array.from(
            new Set([...FALLBACK_FAMILIES, ...data.families])
          );
          setFamiliesList(mergedFamilies);
        }

        const notesObj: Record<string, string[]> = {};

        if (data.top_notes && data.top_notes.length > 0) {
          notesObj['Notas de Saída'] = data.top_notes;
        } else {
          notesObj['Notas de Saída'] = FALLBACK_NOTES['Saída'];
        }

        if (data.heart_notes && data.heart_notes.length > 0) {
          notesObj['Notas de Coração (Corpo)'] = data.heart_notes;
        } else {
          notesObj['Notas de Coração (Corpo)'] = FALLBACK_NOTES['Corpo'];
        }

        if (data.base_notes && data.base_notes.length > 0) {
          notesObj['Notas de Fundo'] = data.base_notes;
        } else {
          notesObj['Notas de Fundo'] = FALLBACK_NOTES['Fundo'];
        }

        setCategorizedNotes(notesObj);
      })
      .catch((err) => {
        console.error('Erro ao carregar catálogo de notas:', err);
        if (isMounted) {
          setFamiliesList(FALLBACK_FAMILIES);
          setCategorizedNotes(FALLBACK_NOTES);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsFetchingNotes(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFamily = (family: string) => {
    setSelectedFamilies((prev) =>
      prev.includes(family)
        ? prev.filter((f) => f !== family)
        : [...prev, family]
    );
  };

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(note)) {
        return prev.filter((n) => n !== note);
      }
      if (prev.length >= 10) {
        Alert.alert(
          'Limite Atingido',
          'Você pode selecionar no máximo 10 notas favoritas.'
        );
        return prev;
      }
      return [...prev, note];
    });
  };

  const canSave = selectedFamilies.length > 0 || selectedNotes.length > 0;

  const handleSave = async () => {
    if (!canSave || loading) return;

    setLoading(true);
    try {
      const payload = {
        olfactory_families: selectedFamilies,
        preferred_notes: selectedNotes,
      };

      if (typeof updateOlfactoryProfile === 'function') {
        await updateOlfactoryProfile(payload);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(shop)/account' as never);
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil olfativo:', error);
      const errorData = error?.response?.data;
      const firstErrorKey = errorData ? Object.keys(errorData)[0] : null;
      Alert.alert(
        'Erro',
        (firstErrorKey && errorData[firstErrorKey]?.[0]) ||
          'Não foi possível salvar seu perfil olfativo. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Oculta o cabeçalho nativo do Expo Router Stack para evitar duplicação */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Customizado Único */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(shop)/account' as never)
          }
          style={styles.backButton}
          accessibilityLabel="Voltar"
        >
          <MaterialIcons name="arrow-back" size={22} color="#1E3446" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil Olfativo</Text>
        <View style={{ width: 40 }} />
      </View>

      {isFetchingNotes ? (
        <View style={styles.centeredLoading}>
          <ActivityIndicator size="large" color="#1E3446" />
          <Text style={styles.loadingText}>Carregando notas do catálogo...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Famílias Olfativas */}
          <Text style={styles.sectionTitle}>
            1. Famílias olfativas que te conquistam
          </Text>
          <Text style={styles.sectionSubtitle}>
            Escolha uma ou mais famílias olfativas de sua preferência.
          </Text>

          {/* Grid de 2 colunas com suporte ao flex/width nativo */}
          <View style={styles.familyGrid}>
            {familiesList.map((family) => (
              <View key={family} style={styles.familyCardWrapper}>
                <OlfactoryFamilyCard
                  name={family}
                  isSelected={selectedFamilies.includes(family)}
                  onPress={() => toggleFamily(family)}
                />
              </View>
            ))}
          </View>

          {/* 2. Suas Notas Favoritas */}
          <View style={styles.notesHeaderRow}>
            <Text style={styles.sectionTitle}>2. Suas notas favoritas</Text>
            <Text style={styles.counterBadgeText}>
              ({selectedNotes.length}/10 selecionadas)
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Extraídas em tempo real do banco de dados do catálogo NŌTA.
          </Text>

          {Object.entries(categorizedNotes).map(([category, notes]) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.chipContainer}>
                {notes.map((note) => (
                  <NoteChip
                    key={note}
                    note={note}
                    isSelected={selectedNotes.includes(note)}
                    onPress={() => toggleNote(note)}
                  />
                ))}
              </View>
            </View>
          ))}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* Footer Fixo */}
      <View style={styles.footer}>
        <Text style={styles.counterText}>
          {selectedNotes.length === 0 && selectedFamilies.length === 0
            ? 'Selecione ao menos 1 família ou 1 nota para salvar'
            : `${selectedFamilies.length} ${
                selectedFamilies.length === 1 ? 'família' : 'famílias'
              } e ${selectedNotes.length} ${
                selectedNotes.length === 1 ? 'nota' : 'notas'
              } selecionadas`}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.disabledButton]}
          onPress={handleSave}
          disabled={!canSave || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Salvar Preferências Olfativas</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3E9',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
    backgroundColor: '#F5F3E9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2DED5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3446',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  centeredLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#63666A',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3446',
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#63666A',
    marginTop: 4,
    marginBottom: 12,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  counterBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546347',
  },

  // Grid de 2 Colunas Corrigida
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 12,
    marginBottom: 20,
  },

  familyCardWrapper: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
  },

  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#546347',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  counterText: {
    fontSize: 12,
    color: '#63666A',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1E3446',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});