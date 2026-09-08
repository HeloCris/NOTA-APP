import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ToastAndroid, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OlfactoryFamilyCard } from '../../../components/common/OlfactoryFamilyCard';

const FAMILIES = ['Amadeirado', 'Cítrico', 'Oriental', 'Floral', 'Fougère', 'Aquático', 'Gourmand'];

export default function FamiliesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleFamily = (family: string) => {
    setSelected(prev => prev.includes(family) ? prev.filter(f => f !== family) : [...prev, family]);
  };

  const handleSkip = () => {
    const msg = "Tudo bem! Você pode completar seu perfil olfativo depois em 'Minha Conta'.";
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.LONG);
    } else {
      Alert.alert("Aviso", msg);
    }
    router.replace('/(shop)');
  };

  const handleNext = () => {
    router.push({ pathname: '/(auth)/onboarding/notes', params: { families: JSON.stringify(selected) } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quais famílias te conquistam?</Text>
      <FlatList
        data={FAMILIES}
        numColumns={2}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <OlfactoryFamilyCard name={item} isSelected={selected.includes(item)} onPress={() => toggleFamily(item)} />
        )}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextText}>Próximo →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3E9', paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3446', marginBottom: 24, textAlign: 'center' },
  list: { paddingBottom: 100 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F5F3E9' },
  skipButton: { padding: 16, justifyContent: 'center' },
  skipText: { color: '#63666A', fontWeight: '600' },
  nextButton: { backgroundColor: '#1E3446', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  nextText: { color: '#FFF', fontWeight: '600' }
});