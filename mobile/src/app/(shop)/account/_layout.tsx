import React from 'react';
import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F1EA' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="addresses"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-olfactory-profile"
        options={{
          headerShown: true,
          title: 'Meu Perfil Olfativo',
          headerBackTitle: 'Conta',
        }}
      />
    </Stack>
  );
}