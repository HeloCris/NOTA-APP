import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ToastAndroid, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NoteChip } from '../../../components/common/NoteChip';
import { useAuth } from '../../../context/AuthContext';

const NOTES = {
  'Saída': ['Bergamota', 'Limão', 'Pimenta Rosa', 'Mandarina'],
  'Corpo': ['Jasmim', 'Lavanda', 'Rosa', 'Íris'],
  'Fundo': ['Baunilha', 'Âmbar', 'Sândalo', 'Vetiver', 'Patchouli']
};

export default function NotesScreen() {
  const router = useRouter();
  const { families } = useLocalSearchParams<{ families: string }>();
  const { updateOlfactoryProfile } = useAuth();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const parsedFamilies = families ? JSON.parse(families) : [];

  const toggleNote = (note: string) => {
    setSelectedNotes(prev => {
      if (prev.includes(note)) return prev.filter(n => n !== note);
      if (prev.length >= 10) return prev;
      return [...prev, note];
    });
  };

  const handleSkip = () => {
    const msg = "Tudo bem! Você pode completar seu perfil olfativo depois em 'Minha Conta'.";
    Platform.OS === 'android' ? ToastAndroid.show(msg, ToastAndroid.LONG) : Alert.alert("Aviso", msg);
    router.replace('/(shop)');
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateOlfactoryProfile({ olfactory_families: parsedFamilies, preferred_notes: selectedNotes });
      router.replace('/(shop)');
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar seu perfil olfativo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suas notas favoritas</Text>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {Object.entries(NOTES).map(([category, items]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.chipContainer}>
              {items.map(note => (
                <NoteChip key={note} note={note} isSelected={selectedNotes.includes(note)} onPress={() => toggleNote(note)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.counterText}>{selectedNotes.length}/10 notas selecionadas</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleFinish} 
            style={[styles.nextButton, selectedNotes.length === 0 && styles.disabledButton]}
            disabled={selectedNotes.length === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextText}>Criar conta ✓</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3E9', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3446', marginBottom: 24, paddingHorizontal: 24 },
  scroll: { paddingHorizontal: 24, paddingBottom: 120 },
  categoryContainer: { marginBottom: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#546347', marginBottom: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  footerTop: { marginBottom: 16, alignItems: 'center' },
  counterText: { fontSize: 12, color: '#63666A', fontWeight: '600' },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between' },
  skipButton: { padding: 16, justifyContent: 'center' },
  skipText: { color: '#63666A', fontWeight: '600' },
  nextButton: { backgroundColor: '#1E3446', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  disabledButton: { opacity: 0.5 },
  nextText: { color: '#FFF', fontWeight: '600' }
});