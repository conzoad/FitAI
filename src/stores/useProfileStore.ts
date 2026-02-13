import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ActivityLevel, Goal, WeightEntry } from '../models/types';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  loss: -500,
  maintenance: 0,
  gain: 300,
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 25,
  gender: 'male',
  heightCm: 175,
  weightKg: 70,
  goal: 'maintenance',
  activityLevel: 'moderate',
  targetCalories: 2000,
  targetProteins: 150,
  targetFats: 56,
  targetCarbs: 225,
  isOnboarded: false,
  weightHistory: [],
};

interface ProfileState {
  profile: UserProfile;
  _hasHydrated: boolean;
  setProfile: (partial: Partial<UserProfile>) => void;
  calculateTargets: () => void;
  resetProfile: () => void;
  addWeightEntry: (weight: number) => void;
  removeWeightEntry: (date: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: { ...DEFAULT_PROFILE },
      _hasHydrated: false,

      setProfile: (partial) =>
        set((state) => ({
          profile: { ...state.profile, ...partial },
        })),

      calculateTargets: () => {
        const { profile } = get();
        const { gender, weightKg, heightCm, age, activityLevel, goal } = profile;

        // Mifflin-St Jeor BMR formula
        let bmr: number;
        if (gender === 'male') {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }

        // Apply activity multiplier
        const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

        // Apply goal adjustment
        const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[goal]);

        // Macro split: protein 30%, fat 25%, carbs 45%
        const targetProteins = Math.round((targetCalories * 0.3) / 4);
        const targetFats = Math.round((targetCalories * 0.25) / 9);
        const targetCarbs = Math.round((targetCalories * 0.45) / 4);

        set((state) => ({
          profile: {
            ...state.profile,
            targetCalories,
            targetProteins,
            targetFats,
            targetCarbs,
          },
        }));
      },

      resetProfile: () =>
        set({ profile: { ...DEFAULT_PROFILE } }),

      addWeightEntry: (weight: number) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const history = state.profile.weightHistory || [];
          const filtered = history.filter((e) => e.date !== today);
          const updated = [...filtered, { date: today, weight }].sort(
            (a, b) => a.date.localeCompare(b.date)
          );
          return {
            profile: {
              ...state.profile,
              weightKg: weight,
              weightHistory: updated,
            },
          };
        }),

      removeWeightEntry: (date: string) =>
        set((state) => ({
          profile: {
            ...state.profile,
            weightHistory: (state.profile.weightHistory || []).filter((e) => e.date !== date),
          },
        })),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        useProfileStore.setState({ _hasHydrated: true });
      },
    }
  )
);
