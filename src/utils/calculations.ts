import { Macros, WorkoutSet } from '../models/types';

export function remainingMacros(consumed: Macros, target: Macros): Macros {
  return {
    calories: Math.max(0, target.calories - consumed.calories),
    proteins: Math.max(0, target.proteins - consumed.proteins),
    fats: Math.max(0, target.fats - consumed.fats),
    carbs: Math.max(0, target.carbs - consumed.carbs),
  };
}

export function macroPercentage(consumed: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

export function isOverTarget(consumed: number, target: number): boolean {
  return consumed > target;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ===== Exercise Analytics =====

export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface ExerciseRecords {
  maxWeight: { value: number; reps: number; date: string } | null;
  best1RM: { value: number; weight: number; reps: number; date: string } | null;
  maxTonnageAllSets: { value: number; date: string } | null;
  maxTonnage1Set: { value: number; weight: number; reps: number; date: string } | null;
  maxReps1Set: { value: number; weight: number; date: string } | null;
  maxRepsAllSets: { value: number; date: string } | null;
}

export function computeExerciseRecords(
  history: { date: string; sets: WorkoutSet[] }[]
): ExerciseRecords {
  const records: ExerciseRecords = {
    maxWeight: null,
    best1RM: null,
    maxTonnageAllSets: null,
    maxTonnage1Set: null,
    maxReps1Set: null,
    maxRepsAllSets: null,
  };

  for (const h of history) {
    const workingSets = h.sets.filter((s) => !s.isWarmup);
    if (workingSets.length === 0) continue;

    const sessionTonnage = workingSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const sessionTotalReps = workingSets.reduce((sum, s) => sum + s.reps, 0);

    if (!records.maxTonnageAllSets || sessionTonnage > records.maxTonnageAllSets.value) {
      records.maxTonnageAllSets = { value: sessionTonnage, date: h.date };
    }

    if (!records.maxRepsAllSets || sessionTotalReps > records.maxRepsAllSets.value) {
      records.maxRepsAllSets = { value: sessionTotalReps, date: h.date };
    }

    for (const s of workingSets) {
      if (!records.maxWeight || s.weight > records.maxWeight.value) {
        records.maxWeight = { value: s.weight, reps: s.reps, date: h.date };
      }

      const oneRM = calculate1RM(s.weight, s.reps);
      if (!records.best1RM || oneRM > records.best1RM.value) {
        records.best1RM = { value: oneRM, weight: s.weight, reps: s.reps, date: h.date };
      }

      const setTonnage = s.weight * s.reps;
      if (!records.maxTonnage1Set || setTonnage > records.maxTonnage1Set.value) {
        records.maxTonnage1Set = { value: setTonnage, weight: s.weight, reps: s.reps, date: h.date };
      }

      if (!records.maxReps1Set || s.reps > records.maxReps1Set.value) {
        records.maxReps1Set = { value: s.reps, weight: s.weight, date: h.date };
      }
    }
  }

  return records;
}

export interface SessionMetrics {
  date: string;
  maxWeight: number;
  best1RM: number;
  totalTonnage: number;
  totalReps: number;
}

export function computeSessionMetrics(
  history: { date: string; sets: WorkoutSet[] }[]
): SessionMetrics[] {
  return history.map((h) => {
    const workingSets = h.sets.filter((s) => !s.isWarmup);
    const maxWeight = workingSets.length > 0
      ? Math.max(...workingSets.map((s) => s.weight))
      : 0;
    const best1RM = workingSets.length > 0
      ? Math.max(...workingSets.map((s) => calculate1RM(s.weight, s.reps)))
      : 0;
    const totalTonnage = workingSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    const totalReps = workingSets.reduce((sum, s) => sum + s.reps, 0);
    return { date: h.date, maxWeight, best1RM, totalTonnage, totalReps };
  });
}
