import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const storage = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}));

export type AppTheme = 'light' | 'dark';

interface SettingsState {
  language: string;
  theme: AppTheme;
  setLanguage: (lang: string) => void;
  setTheme: (theme: AppTheme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'pt',
      theme: 'light',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        Appearance.setColorScheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'wandered-settings',
      storage,
      onRehydrateStorage: () => (state) => {
        if (state?.theme) Appearance.setColorScheme(state.theme);
      },
    },
  ),
);
