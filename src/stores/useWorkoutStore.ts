import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Exercise, WorkoutExercise, WorkoutSession, WorkoutSet } from '../models/types';
import { generateId } from '../utils/calculations';

interface WorkoutState {
  sessions: Record<string, WorkoutSession[]>;
  activeWorkout: WorkoutSession | null;

  startWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, weight: number, reps: number, isWarmup?: boolean) => void;
  updateSet: (workoutExerciseId: string, setId: string, weight: number, reps: number) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: (notes?: string) => void;
  cancelWorkout: () => void;
  deleteSession: (date: string, sessionId: string) => void;
}

function calculateVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => {
    return total + ex.sets
      .filter((s) => !s.isWarmup)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
  }, 0);
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessions: {},
      activeWorkout: null,

      startWorkout: () => {
        const now = Date.now();
        set({
          activeWorkout: {
            id: generateId(),
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: now,
            exercises: [],
            totalVolume: 0,
            duration: 0,
          },
        });
      },

      addExercise: (exercise) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          const workoutExercise: WorkoutExercise = {
            id: generateId(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: [],
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, workoutExercise],
            },
          };
        });
      },

      removeExercise: (workoutExerciseId) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.filter((e) => e.id !== workoutExerciseId),
            },
          };
        });
      },

      addSet: (workoutExerciseId, weight, reps, isWarmup = false) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          const newSet: WorkoutSet = {
            id: generateId(),
            weight,
            reps,
            isWarmup,
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) =>
                ex.id === workoutExerciseId
                  ? { ...ex, sets: [...ex.sets, newSet] }
                  : ex
              ),
            },
          };
        });
      },

      updateSet: (workoutExerciseId, setId, weight, reps) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) =>
                ex.id === workoutExerciseId
                  ? {
                      ...ex,
                      sets: ex.sets.map((s) =>
                        s.id === setId ? { ...s, weight, reps } : s
                      ),
                    }
                  : ex
              ),
            },
          };
        });
      },

      removeSet: (workoutExerciseId, setId) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) =>
                ex.id === workoutExerciseId
                  ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
                  : ex
              ),
            },
          };
        });
      },

      finishWorkout: (notes) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          const now = Date.now();
          const completed: WorkoutSession = {
            ...state.activeWorkout,
            endTime: now,
            duration: Math.round((now - state.activeWorkout.startTime) / 60000),
            totalVolume: calculateVolume(state.activeWorkout.exercises),
            notes,
          };
          const dateKey = completed.date;
          const existing = state.sessions[dateKey] || [];
          return {
            activeWorkout: null,
            sessions: {
              ...state.sessions,
              [dateKey]: [...existing, completed],
            },
          };
        });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      deleteSession: (date, sessionId) => {
        set((state) => {
          const existing = state.sessions[date];
          if (!existing) return state;
          const updated = existing.filter((s) => s.id !== sessionId);
          return {
            sessions: {
              ...state.sessions,
              [date]: updated,
            },
          };
        });
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeWorkout: state.activeWorkout,
      }),
    }
  )
);
