import { Macros } from '../models/types';

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
