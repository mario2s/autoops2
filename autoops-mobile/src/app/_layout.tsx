import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/Toast';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';

function AppShell() {
  const { resolvedScheme } = useThemePreference();
  return (
    <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </ToastProvider>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePreferenceProvider>
          <AppShell />
        </ThemePreferenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
