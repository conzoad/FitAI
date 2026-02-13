import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Exercise, WorkoutExercise, WorkoutSession, WorkoutSet, WorkoutProgram, ProgramExercise, ScheduledWorkout, ScheduleStatus } from '../models/types';
import { generateId } from '../utils/calculations';

interface WorkoutState {
  sessions: Record<string, WorkoutSession[]>;
  activeWorkout: WorkoutSession | null;
  programs: WorkoutProgram[];
  schedule: Record<string, ScheduledWorkout>;

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
  addScheduledWorkout: (date: string, programId: string, programName: string) => void;
  removeScheduledWorkout: (date: string) => void;
  updateScheduleStatus: (date: string, status: ScheduleStatus, sessionId?: string) => void;
  markMissedWorkouts: () => void;
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
      schedule: {},

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
          const updatedSchedule = { ...state.schedule };
          if (updatedSchedule[dateKey] && updatedSchedule[dateKey].status !== 'completed') {
            updatedSchedule[dateKey] = {
              ...updatedSchedule[dateKey],
              status: 'completed',
              sessionId: completed.id,
            };
          }
          return {
            activeWorkout: null,
            sessions: {
              ...state.sessions,
              [dateKey]: [...existing, completed],
            },
            schedule: updatedSchedule,
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
        const today = format(new Date(), 'yyyy-MM-dd');
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

        const state = get();
        const updatedSchedule = { ...state.schedule };
        if (updatedSchedule[today] && updatedSchedule[today].status === 'planned') {
          updatedSchedule[today] = {
            ...updatedSchedule[today],
            status: 'inProgress',
          };
        }

        set({
          activeWorkout: {
            id: generateId(),
            date: today,
            startTime: now,
            exercises: workoutExercises,
            totalVolume: 0,
            duration: 0,
          },
          schedule: updatedSchedule,
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

      addScheduledWorkout: (date, programId, programName) => {
        set((state) => ({
          schedule: {
            ...state.schedule,
            [date]: {
              id: generateId(),
              date,
              programId,
              programName,
              status: 'planned' as const,
            },
          },
        }));
      },

      removeScheduledWorkout: (date) => {
        set((state) => {
          const next = { ...state.schedule };
          delete next[date];
          return { schedule: next };
        });
      },

      updateScheduleStatus: (date, status, sessionId) => {
        set((state) => {
          const entry = state.schedule[date];
          if (!entry) return state;
          return {
            schedule: {
              ...state.schedule,
              [date]: { ...entry, status, ...(sessionId ? { sessionId } : {}) },
            },
          };
        });
      },

      markMissedWorkouts: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        set((state) => {
          let changed = false;
          const next = { ...state.schedule };
          for (const [date, entry] of Object.entries(next)) {
            if (date < today && entry.status === 'planned') {
              next[date] = { ...entry, status: 'missed' };
              changed = true;
            }
          }
          return changed ? { schedule: next } : state;
        });
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeWorkout: state.activeWorkout,
        programs: state.programs,
        schedule: state.schedule,
      }),
    }
  )
);
