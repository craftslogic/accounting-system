import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { useAuthStore } from '@/store/authStore';

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
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Not signed in → redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      // Signed in → redirect to home
      router.replace('/(tabs)/home');
    }
  }, [user, isInitialized, segments]);

  if (!isInitialized) {
    // Could show a splash/loader here
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}
