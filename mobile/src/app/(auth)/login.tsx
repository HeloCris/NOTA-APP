import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3E9' }}>
      <Text style={{ fontSize: 20, marginBottom: 20, color: '#1E3446' }}>Tela de Login</Text>
      <Button 
        title="Ir para Cadastro" 
        onPress={() => router.push('/(auth)/register')} 
      />
    </View>
  );
}