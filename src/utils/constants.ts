import { MealType, Goal, ActivityLevel, Gender } from '../models/types';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export const GOAL_LABELS: Record<Goal, string> = {
  loss: 'Похудение',
  maintenance: 'Поддержание веса',
  gain: 'Набор массы',
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Сидячий образ жизни',
  light: 'Лёгкая активность',
  moderate: 'Умеренная активность',
  active: 'Высокая активность',
  very_active: 'Очень высокая активность',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Мужской',
  female: 'Женский',
};

export const EMPTY_MACROS = { calories: 0, proteins: 0, fats: 0, carbs: 0 };

// ===== Workout Constants =====

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  legs: 'Ноги',
  glutes: 'Ягодицы',
  abs: 'Пресс',
  cardio: 'Кардио',
  fullBody: 'Всё тело',
};

export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  chest: '🏋️',
  back: '🔙',
  shoulders: '💪',
  biceps: '💪',
  triceps: '💪',
  legs: '🦵',
  glutes: '🍑',
  abs: '🎯',
  cardio: '🏃',
  fullBody: '⚡',
};
