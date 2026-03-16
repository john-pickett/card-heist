import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CrewMemberId } from '../types/crew';

interface CrewStore {
  unlockedIds: CrewMemberId[];
  consecutiveHeists: Record<string, number>;
  lastHeistCrew: CrewMemberId[];
  activeHeistCrew: CrewMemberId[];

  purchaseCrew: (id: CrewMemberId) => void;
  setActiveHeistCrew: (ids: CrewMemberId[]) => void;
  recordHeistEnd: () => void;
}

export const useCrewStore = create(
  persist<CrewStore>(
    (set, get) => ({
      unlockedIds: [],
      consecutiveHeists: {},
      lastHeistCrew: [],
      activeHeistCrew: [],

      purchaseCrew: (id) => {
        if (get().unlockedIds.includes(id)) return;
        set({ unlockedIds: [...get().unlockedIds, id] });
      },

      setActiveHeistCrew: (ids) => {
        set({ activeHeistCrew: ids });
      },

      recordHeistEnd: () => {
        const { unlockedIds, activeHeistCrew, consecutiveHeists } = get();
        const updated: Record<string, number> = { ...consecutiveHeists };

        for (const id of unlockedIds) {
          const wasActive = activeHeistCrew.includes(id);
          const currentCount = updated[id] ?? 0;

          if (wasActive) {
            updated[id] = currentCount + 1;
          } else if (currentCount >= 2) {
            // Was resting, skipped this heist — reset
            updated[id] = 0;
          }
          // If not active and not resting, count stays (partial streak preserved)
        }

        set({
          consecutiveHeists: updated,
          lastHeistCrew: activeHeistCrew,
          activeHeistCrew: [],
        });
      },
    }),
    {
      name: 'solitaire:crew-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function isCrewAvailable(
  id: CrewMemberId,
  unlockedIds: CrewMemberId[],
  consecutiveHeists: Record<string, number>
): boolean {
  return unlockedIds.includes(id) && (consecutiveHeists[id] ?? 0) < 2;
}
