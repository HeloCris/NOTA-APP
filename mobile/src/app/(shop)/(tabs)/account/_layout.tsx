import React from 'react';
import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F3E9' },
      }}
    >
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