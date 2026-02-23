import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsStore {
  soundEnabled: boolean;
  blackMarketIntroSeen: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setBlackMarketIntroSeen: (seen: boolean) => void;
}

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set) => ({
      soundEnabled: true,
      blackMarketIntroSeen: false,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBlackMarketIntroSeen: (seen) => set({ blackMarketIntroSeen: seen }),
    }),
    {
      name: 'solitaire:settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
