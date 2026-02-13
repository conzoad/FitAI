import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedFoodItem, FoodItem } from '../models/types';

function normalizeId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

interface FoodLibraryState {
  items: Record<string, SavedFoodItem>;

  addItems: (foodItems: FoodItem[], source: 'ai' | 'barcode' | 'manual') => void;
  removeItem: (id: string) => void;
  searchItems: (query: string) => SavedFoodItem[];
  getAllItems: () => SavedFoodItem[];
}

export const useFoodLibraryStore = create<FoodLibraryState>()(
  persist(
    (set, get) => ({
      items: {},

      addItems: (foodItems, source) => {
        set((state) => {
          const updated = { ...state.items };
          for (const fi of foodItems) {
            const id = normalizeId(fi.name);
            const existing = updated[id];
            updated[id] = {
              id,
              name: fi.name,
              amount: fi.amount,
              macros: { ...fi.macros },
              source,
              addedAt: existing?.addedAt || new Date().toISOString(),
              usageCount: (existing?.usageCount || 0) + 1,
            };
          }
          return { items: updated };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const updated = { ...state.items };
          delete updated[id];
          return { items: updated };
        });
      },

      searchItems: (query) => {
        const { items } = get();
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return Object.values(items)
          .filter((item) => item.name.toLowerCase().includes(q))
          .sort((a, b) => b.usageCount - a.usageCount);
      },

      getAllItems: () => {
        return Object.values(get().items).sort(
          (a, b) => b.usageCount - a.usageCount
        );
      },
    }),
    {
      name: 'food-library-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
