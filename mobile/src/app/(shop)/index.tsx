import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ShopIndex() {
  const { user, signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Bem-vindo à Loja!</Text>
      <Text style={{ marginBottom: 20 }}>Perfil: {user?.olfactory_families?.join(', ')}</Text>
      <Button title="Sair" onPress={signOut} />
    </View>
  );
}