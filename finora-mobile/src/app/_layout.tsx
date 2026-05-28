import 'react-native-reanimated';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useTheme } from '@/hooks/useTheme';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, isInitialized, segments]);

  if (!isInitialized) {
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { loadMode } = useThemeStore();
  const { isDark } = useTheme();

  useEffect(() => {
    loadMode();
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="transaction/[id]" />
          <Stack.Screen name="add-account" />
          <Stack.Screen name="funds" />
          <Stack.Screen name="fund/[id]" />
          <Stack.Screen name="create-fund" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="privacy-security" />
          <Stack.Screen name="people" />
          <Stack.Screen name="contact/[id]" />
        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}

