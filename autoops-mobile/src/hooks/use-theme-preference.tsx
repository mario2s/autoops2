import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme_preference';

async function loadPreference(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(STORAGE_KEY);
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function savePreference(value: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(STORAGE_KEY, value); return; }
  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

type ContextValue = {
  preference: ThemePreference;
  resolvedScheme: 'light' | 'dark';
  setPreference: (p: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ContextValue>({
  preference: 'system',
  resolvedScheme: 'light',
  setPreference: () => {},
});

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    loadPreference().then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
    });
  }, []);

  function setPreference(p: ThemePreference) {
    setPreferenceState(p);
    savePreference(p);
  }

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemePreferenceContext.Provider value={{ preference, resolvedScheme, setPreference }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}
