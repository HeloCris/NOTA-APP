import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/use-theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const colors = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(shop)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}