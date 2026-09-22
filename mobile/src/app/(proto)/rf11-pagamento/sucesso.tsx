import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProtoSucesso() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Pagamento Aprovado (Protótipo)</Text>
      <Text style={styles.sub}>Order #PROTO-105 gerada com status estático PAID.</Text>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => router.push('./rf11-pagamento/index' as any)}
      >
        <Text style={styles.btnText}>Reiniciar Protótipo RF-11</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#111', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' }
});