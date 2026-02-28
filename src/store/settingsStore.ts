import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsStore {
  soundEnabled: boolean;
  blackMarketIntroSeen: boolean;
  blackMarketUnlockedStorySeen: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setBlackMarketIntroSeen: (seen: boolean) => void;
  setBlackMarketUnlockedStorySeen: (seen: boolean) => void;
}

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set) => ({
      soundEnabled: true,
      blackMarketIntroSeen: false,
      blackMarketUnlockedStorySeen: false,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBlackMarketIntroSeen: (seen) => set({ blackMarketIntroSeen: seen }),
      setBlackMarketUnlockedStorySeen: (seen) => set({ blackMarketUnlockedStorySeen: seen }),
    }),
    {
      name: 'solitaire:settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
