import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CrewMemberId } from '../types/crew';

interface CrewStore {
  unlockedIds: CrewMemberId[];
  consecutiveHeists: Record<string, number>;
  restHeistsRemaining: Record<string, number>;
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
      restHeistsRemaining: {},
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
        const { unlockedIds, activeHeistCrew, consecutiveHeists, restHeistsRemaining } = get();
        const updatedStreaks: Record<string, number> = { ...consecutiveHeists };
        const updatedRest: Record<string, number>    = { ...restHeistsRemaining };

        for (const id of unlockedIds) {
          const wasActive = activeHeistCrew.includes(id);
          const streak    = updatedStreaks[id] ?? 0;
          const restLeft  = updatedRest[id]   ?? 0;

          if (wasActive) {
            const newStreak = streak + 1;
            updatedStreaks[id] = newStreak;
            if (newStreak >= 2) {
              updatedRest[id] = 2; // must rest for 2 heists
            }
          } else {
            // Any heist where crew is not taken counts as a rest heist
            if (restLeft > 0) {
              // Currently in mandatory rest — decrement counter
              const newRestLeft = restLeft - 1;
              updatedRest[id] = newRestLeft;
              if (newRestLeft === 0) {
                updatedStreaks[id] = 0; // fully rested, reset streak
              }
            } else {
              // Not resting — voluntary skip resets streak
              updatedStreaks[id] = 0;
            }
          }
        }

        set({
          consecutiveHeists:   updatedStreaks,
          restHeistsRemaining: updatedRest,
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
