import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  // Exibe um loading enquanto verifica o SecureStore
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3E9' }}>
        <ActivityIndicator size="large" color="#1E3446" />
      </View>
    );
  }

  // Se tem usuário logado, vai para a loja. Se não, vai para o cadastro.
  if (user) {
    return <Redirect href="/(shop)" />;
  }

  return <Redirect href="/(auth)/register" />;
}