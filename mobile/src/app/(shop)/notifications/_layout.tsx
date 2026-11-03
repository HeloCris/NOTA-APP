import React from 'react';
import { Stack } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F1EA' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
