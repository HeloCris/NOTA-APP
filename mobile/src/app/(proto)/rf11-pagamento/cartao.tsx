import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProtoCartao() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Protótipo Cartão de Crédito</Text>
      <TextInput style={styles.input} placeholder="Número do Cartão (Mock)" editable={false} value="4532 •••• •••• 1234" />
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Validade" editable={false} value="12/28" />
        <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="CVV" editable={false} value="321" />
      </View>
      <TextInput style={styles.input} placeholder="Nome do Titular" editable={false} value="JOÃO DA SILVA (MOCK)" />

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.push('./rf11-pagamento/sucesso' as any)}
      >
        <Text style={styles.btnText}>Simular Aprovação (Estático)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#333', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#f9f9f9' },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' }
});