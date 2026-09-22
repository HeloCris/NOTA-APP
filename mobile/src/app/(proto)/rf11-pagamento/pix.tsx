import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProtoPix() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { alignSelf: 'flex-start' }]}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Protótipo PIX</Text>
      <View style={styles.qrBox}>
        <Text style={styles.qrMock}>[ QR CODE ESTÁTICO MOCK ]</Text>
      </View>
      <Text style={styles.codeText}>00020126580014BR.GOV.BCB.PIX... (Copia e cola)</Text>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.push('./rf11-pagamento/sucesso' as any)}
      >
        <Text style={styles.btnText}>Simular Pagamento PIX Aprovado</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 24 },
  backText: { fontSize: 16, color: '#333', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 24 },
  qrBox: { width: 200, height: 200, borderWidth: 1, borderColor: '#999', justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#f3f4f6' },
  qrMock: { fontSize: 12, color: '#666' },
  codeText: { fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#0f766e', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' }
});