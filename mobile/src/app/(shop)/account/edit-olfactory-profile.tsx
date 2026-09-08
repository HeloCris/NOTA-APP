import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OlfactoryFamilyCard } from '../../../components/common/OlfactoryFamilyCard';
import { NoteChip } from '../../../components/common/NoteChip';
import { useAuth } from '../../../context/AuthContext';

const FAMILIES = ['Amadeirado', 'Cítrico', 'Oriental', 'Floral', 'Fougère', 'Aquático', 'Gourmand'];

const NOTES: Record<string, string[]> = {
  'Saída': ['Bergamota', 'Limão', 'Pimenta Rosa', 'Mandarina'],
  'Corpo': ['Jasmim', 'Lavanda', 'Rosa', 'Íris'],
  'Fundo': ['Baunilha', 'Âmbar', 'Sândalo', 'Vetiver', 'Patchouli'],
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
  const [loading, setLoading] = useState(false);

  const toggleFamily = (family: string) => {
    setSelectedFamilies((prev) =>
      prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family]
    );
  };

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(note)) {
        return prev.filter((n) => n !== note);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, note];
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOlfactoryProfile({
        olfactory_families: selectedFamilies,
        preferred_notes: selectedNotes,
      });
      router.back();
    } catch (error: any) {
      const errorData = error?.response?.data;
      const firstErrorKey = errorData ? Object.keys(errorData)[0] : null;
      Alert.alert(
        'Erro',
        (firstErrorKey && errorData[firstErrorKey]?.[0]) ||
          'Não foi possível salvar seu perfil olfativo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meu Perfil Olfativo</Text>

        <Text style={styles.sectionTitle}>Famílias olfativas</Text>
        <View style={styles.familyGrid}>
          {FAMILIES.map((family) => (
            <OlfactoryFamilyCard
              key={family}
              name={family}
              isSelected={selectedFamilies.includes(family)}
              onPress={() => toggleFamily(family)}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Notas favoritas (máx. 10)</Text>
        {Object.entries(NOTES).map(([category, notes]) => (
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
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counterText}>
          {selectedNotes.length}/10 notas selecionadas
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, selectedNotes.length === 0 && styles.disabledButton]}
          onPress={handleSave}
          disabled={selectedNotes.length === 0 || loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3E9',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3446',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3446',
    marginBottom: 12,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546347',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  counterText: {
    fontSize: 12,
    color: '#63666A',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1E3446',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});