import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';
import {
  DailyEntry,
  FoodItem,
  Macros,
  Meal,
  MealType,
} from '../models/types';
import { EMPTY_MACROS } from '../utils/constants';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const sumItemMacros = (items: FoodItem[]): Macros => {
  const base = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories,
      proteins: acc.proteins + item.macros.proteins,
      fats: acc.fats + item.macros.fats,
      carbs: acc.carbs + item.macros.carbs,
    }),
    { ...EMPTY_MACROS }
  );

  const hasSugar = items.some(i => i.macros.sugar != null);
  const hasSalt = items.some(i => i.macros.salt != null);

  return {
    ...base,
    ...(hasSugar && { sugar: Math.round(items.reduce((s, i) => s + (i.macros.sugar || 0), 0) * 10) / 10 }),
    ...(hasSalt && { salt: Math.round(items.reduce((s, i) => s + (i.macros.salt || 0), 0) * 10) / 10 }),
  };
};

const sumMealMacros = (meals: Meal[]): Macros => {
  const base = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalMacros.calories,
      proteins: acc.proteins + meal.totalMacros.proteins,
      fats: acc.fats + meal.totalMacros.fats,
      carbs: acc.carbs + meal.totalMacros.carbs,
    }),
    { ...EMPTY_MACROS }
  );

  const hasSugar = meals.some(m => m.totalMacros.sugar != null);
  const hasSalt = meals.some(m => m.totalMacros.salt != null);

  return {
    ...base,
    ...(hasSugar && { sugar: Math.round(meals.reduce((s, m) => s + (m.totalMacros.sugar || 0), 0) * 10) / 10 }),
    ...(hasSalt && { salt: Math.round(meals.reduce((s, m) => s + (m.totalMacros.salt || 0), 0) * 10) / 10 }),
  };
};

const createEmptyEntry = (date: string): DailyEntry => ({
  date,
  meals: [],
  totalMacros: { ...EMPTY_MACROS },
});

interface DiaryState {
  entries: Record<string, DailyEntry>;
  addMeal: (
    date: string,
    type: MealType,
    items: FoodItem[],
    source: 'text' | 'photo' | 'manual',
    photoUri?: string
  ) => void;
  removeMeal: (date: string, mealId: string) => void;
  updateMealItem: (
    date: string,
    mealId: string,
    itemId: string,
    newAmount: string,
    newMacros: Macros
  ) => void;
  removeMealItem: (date: string, mealId: string, itemId: string) => void;
  getEntry: (date: string) => DailyEntry;
  getTodayEntry: () => DailyEntry;
  getWeekEntries: () => DailyEntry[];
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: {},

      addMeal: (date, type, items, source, photoUri?) => {
        const totalMacros = sumItemMacros(items);

        const meal: Meal = {
          id: generateId(),
          type,
          items,
          totalMacros,
          timestamp: new Date().toISOString(),
          source,
          ...(photoUri && { photoUri }),
        };

        set((state) => {
          const existing = state.entries[date] || createEmptyEntry(date);
          const updatedMeals = [...existing.meals, meal];

          return {
            entries: {
              ...state.entries,
              [date]: {
                date,
                meals: updatedMeals,
                totalMacros: sumMealMacros(updatedMeals),
              },
            },
          };
        });
      },

      removeMeal: (date, mealId) => {
        set((state) => {
          const existing = state.entries[date];
          if (!existing) return state;

          const updatedMeals = existing.meals.filter((m) => m.id !== mealId);

          return {
            entries: {
              ...state.entries,
              [date]: {
                date,
                meals: updatedMeals,
                totalMacros: sumMealMacros(updatedMeals),
              },
            },
          };
        });
      },

      updateMealItem: (date, mealId, itemId, newAmount, newMacros) => {
        set((state) => {
          const existing = state.entries[date];
          if (!existing) return state;

          const updatedMeals = existing.meals.map((meal) => {
            if (meal.id !== mealId) return meal;

            const updatedItems = meal.items.map((item) => {
              if (item.id !== itemId) return item;
              return { ...item, amount: newAmount, macros: newMacros };
            });

            return {
              ...meal,
              items: updatedItems,
              totalMacros: sumItemMacros(updatedItems),
            };
          });

          return {
            entries: {
              ...state.entries,
              [date]: {
                date,
                meals: updatedMeals,
                totalMacros: sumMealMacros(updatedMeals),
              },
            },
          };
        });
      },

      removeMealItem: (date, mealId, itemId) => {
        set((state) => {
          const existing = state.entries[date];
          if (!existing) return state;

          const updatedMeals = existing.meals.map((meal) => {
            if (meal.id !== mealId) return meal;
            const updatedItems = meal.items.filter((item) => item.id !== itemId);
            return {
              ...meal,
              items: updatedItems,
              totalMacros: sumItemMacros(updatedItems),
            };
          }).filter((meal) => meal.items.length > 0);

          return {
            entries: {
              ...state.entries,
              [date]: {
                date,
                meals: updatedMeals,
                totalMacros: sumMealMacros(updatedMeals),
              },
            },
          };
        });
      },

      getEntry: (date) => {
        const { entries } = get();
        return entries[date] || createEmptyEntry(date);
      },

      getTodayEntry: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().getEntry(today);
      },

      getWeekEntries: () => {
        const { getEntry } = get();
        const today = new Date();

        return Array.from({ length: 7 }, (_, i) => {
          const date = format(subDays(today, 6 - i), 'yyyy-MM-dd');
          return getEntry(date);
        });
      },
    }),
    {
      name: 'diary-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
