import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type RelaxGameId = 'pattern-recognition' | 'getaway' | 'drop';

interface SettingsStore {
  soundEnabled: boolean;
  blackMarketIntroSeen: boolean;
  blackMarketUnlockedStorySeen: boolean;
  hideoutPurchased: boolean;
  relaxUnlocked: Record<RelaxGameId, boolean>;
  setSoundEnabled: (enabled: boolean) => void;
  setBlackMarketIntroSeen: (seen: boolean) => void;
  setBlackMarketUnlockedStorySeen: (seen: boolean) => void;
  setHideoutPurchased: (purchased: boolean) => void;
  unlockRelaxGame: (id: RelaxGameId) => void;
}

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set, get) => ({
      soundEnabled: true,
      blackMarketIntroSeen: false,
      blackMarketUnlockedStorySeen: false,
      hideoutPurchased: false,
      relaxUnlocked: { 'pattern-recognition': false, 'getaway': false, 'drop': false },
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBlackMarketIntroSeen: (seen) => set({ blackMarketIntroSeen: seen }),
      setBlackMarketUnlockedStorySeen: (seen) => set({ blackMarketUnlockedStorySeen: seen }),
      setHideoutPurchased: (purchased) => set({ hideoutPurchased: purchased }),
      unlockRelaxGame: (id) => set({
        relaxUnlocked: { ...get().relaxUnlocked, [id]: true },
      }),
    }),
    {
      name: 'solitaire:settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsStore>),
        // Ensure relaxUnlocked always has all three keys even for existing saves
        relaxUnlocked: {
          'pattern-recognition': false,
          'getaway': false,
          'drop': false,
          ...((persisted as Partial<SettingsStore>)?.relaxUnlocked ?? {}),
        },
      }),
    }
  )
);
