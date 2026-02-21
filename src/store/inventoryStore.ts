import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

interface InventoryStore {
  items: InventoryEntry[];
  addItem: (itemId: string, quantity?: number) => void;
  clearInventory: () => void;
}

export const useInventoryStore = create(
  persist<InventoryStore>(
    (set, get) => ({
      items: [],
      addItem: (itemId, quantity = 1) => {
        if (quantity <= 0) return;
        const existing = get().items.find(entry => entry.itemId === itemId);
        if (!existing) {
          set({ items: [...get().items, { itemId, quantity }] });
          return;
        }
        set({
          items: get().items.map(entry =>
            entry.itemId === itemId
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry
          ),
        });
      },
      clearInventory: () => set({ items: [] }),
    }),
    {
      name: 'solitaire:inventory-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
