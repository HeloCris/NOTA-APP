import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { useTheme } from '../hooks/use-theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const colors = useTheme();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding =
      pathname.startsWith('/onboarding') || (segments as string[]).includes('onboarding');
    const inShopGroup = segments[0] === '(shop)';

    if (!isAuthenticated && inShopGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !inOnboarding) {
      router.replace('/(shop)');
    }
  }, [isLoading, isAuthenticated, segments, pathname, router]);

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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(shop)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
    </Stack>
  );
}