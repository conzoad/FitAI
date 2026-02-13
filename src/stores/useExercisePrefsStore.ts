import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../models/types';
import { generateId } from '../utils/calculations';

interface ExercisePrefsState {
  favorites: string[];
  colorTags: Record<string, string>;
  customExercises: Exercise[];

  toggleFavorite: (exerciseId: string) => void;
  setColorTag: (exerciseId: string, color: string | null) => void;
  addCustomExercise: (exercise: Omit<Exercise, 'id' | 'isCustom'>) => void;
  removeCustomExercise: (exerciseId: string) => void;
  updateCustomExercise: (exerciseId: string, updates: Partial<Exercise>) => void;
}

export const useExercisePrefsStore = create<ExercisePrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      colorTags: {},
      customExercises: [],

      toggleFavorite: (exerciseId) => {
        set((state) => {
          const isFav = state.favorites.includes(exerciseId);
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== exerciseId)
              : [...state.favorites, exerciseId],
          };
        });
      },

      setColorTag: (exerciseId, color) => {
        set((state) => {
          const next = { ...state.colorTags };
          if (color) {
            next[exerciseId] = color;
          } else {
            delete next[exerciseId];
          }
          return { colorTags: next };
        });
      },

      addCustomExercise: (exercise) => {
        set((state) => ({
          customExercises: [
            ...state.customExercises,
            { ...exercise, id: `custom-${generateId()}`, isCustom: true },
          ],
        }));
      },

      removeCustomExercise: (exerciseId) => {
        set((state) => ({
          customExercises: state.customExercises.filter((e) => e.id !== exerciseId),
          favorites: state.favorites.filter((id) => id !== exerciseId),
          colorTags: Object.fromEntries(
            Object.entries(state.colorTags).filter(([key]) => key !== exerciseId)
          ),
        }));
      },

      updateCustomExercise: (exerciseId, updates) => {
        set((state) => ({
          customExercises: state.customExercises.map((e) =>
            e.id === exerciseId ? { ...e, ...updates, id: exerciseId, isCustom: true } : e
          ),
        }));
      },
    }),
    {
      name: 'exercise-prefs-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
