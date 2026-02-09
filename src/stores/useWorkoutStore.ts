import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Exercise, WorkoutExercise, WorkoutSession, WorkoutSet, WorkoutProgram, ProgramExercise } from '../models/types';
import { generateId } from '../utils/calculations';

interface WorkoutState {
  sessions: Record<string, WorkoutSession[]>;
  activeWorkout: WorkoutSession | null;
  programs: WorkoutProgram[];

  startWorkout: () => void;
  startWorkoutFromProgram: (program: WorkoutProgram, exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, weight: number, reps: number, isWarmup?: boolean) => void;
  updateSet: (workoutExerciseId: string, setId: string, weight: number, reps: number) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: (notes?: string) => void;
  cancelWorkout: () => void;
  deleteSession: (date: string, sessionId: string) => void;
  addProgram: (name: string, exercises: ProgramExercise[]) => void;
  deleteProgram: (programId: string) => void;
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
      programs: [],

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

      startWorkoutFromProgram: (program, exercises) => {
        const now = Date.now();
        const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
        const workoutExercises: WorkoutExercise[] = [];

        for (const pe of program.exercises) {
          const ex = exerciseMap.get(pe.exerciseId);
          if (ex) {
            workoutExercises.push({
              id: generateId(),
              exerciseId: ex.id,
              exerciseName: ex.name,
              sets: [] as WorkoutSet[],
              notes: `${pe.targetSets}\u00d7${pe.targetReps}`,
            });
          }
        }

        set({
          activeWorkout: {
            id: generateId(),
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: now,
            exercises: workoutExercises,
            totalVolume: 0,
            duration: 0,
          },
        });
      },

      addProgram: (name, exercises) => {
        set((state) => ({
          programs: [
            ...state.programs,
            {
              id: generateId(),
              name,
              exercises,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      deleteProgram: (programId) => {
        set((state) => ({
          programs: state.programs.filter((p) => p.id !== programId),
        }));
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeWorkout: state.activeWorkout,
        programs: state.programs,
      }),
    }
  )
);
