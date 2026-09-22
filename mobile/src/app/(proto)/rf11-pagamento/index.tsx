import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProtoRF11Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>[PROTÓTIPO] RF-11: Pagamento</Text>
      <Text style={styles.sub}>Total simulado: R$ 374,90</Text>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.push('./rf11-pagamento/cartao' as any)}
      >
        <Text style={styles.btnText}>Etapa 1: Pagar com Cartão (Estático)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btn, styles.btnPix]} 
        onPress={() => router.push('./rf11-pagamento/pix' as any)}
      >
        <Text style={styles.btnText}>Etapa 1 (Alt): Pagar via PIX (Estático)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  sub: { fontSize: 16, marginBottom: 32, color: '#666' },
  btn: { backgroundColor: '#111', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  btnPix: { backgroundColor: '#0f766e' },
  btnText: { color: '#fff', fontWeight: '600' }
});