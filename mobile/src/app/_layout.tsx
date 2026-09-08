import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/use-theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useTheme();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = inAuthGroup && segments.includes('onboarding');
    const inShopGroup = segments[0] === '(shop)';

    if (!isAuthenticated && inShopGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !inOnboarding) {
      router.replace('/(shop)');
    }
  }, [isLoading, isAuthenticated, segments, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return <Slot />;
}