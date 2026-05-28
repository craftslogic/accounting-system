import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadMode: () => Promise<void>;
}

const STORAGE_KEY = 'finora_theme_mode';

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: 'system',

  loadMode: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ mode: stored });
      }
    } catch {
      // fallback to system
    }
  },

  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage error
    }
  },
}));
