import { MealType, Goal, ActivityLevel, Gender, ExerciseCategory, Equipment, ExerciseForce, ExerciseLevel } from '../models/types';

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

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Грудь',
  upperBack: 'Верх спины',
  lats: 'Широчайшие',
  shoulders: 'Плечи',
  frontDelts: 'Передние дельты',
  sideDelts: 'Средние дельты',
  rearDelts: 'Задние дельты',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  abs: 'Пресс',
  obliques: 'Косые мышцы',
  lowerBack: 'Поясница',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  'hip-flexors': 'Сгибатели бедра',
  cardio: 'Сердце (кардио)',
};

// ===== Exercise Metadata Labels =====

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Силовое',
  cardio: 'Кардио',
  stretching: 'Растяжка',
  plyometric: 'Плиометрическое',
  powerlifting: 'Пауэрлифтинг',
  weightlifting: 'Тяжёлая атлетика',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  none: 'Без оборудования',
  barbell: 'Штанга',
  dumbbells: 'Гантели',
  dumbbell: 'Гантель',
  kettlebell: 'Гиря',
  machine: 'Тренажёр',
  cable: 'Тросовый тренажёр',
  band: 'Эспандер',
  fitball: 'Фитбол',
  pullUpBar: 'Турник',
  parallelBars: 'Брусья',
  ezBar: 'EZ-гриф',
  treadmill: 'Беговая дорожка',
  stationaryBike: 'Велотренажёр',
  jumpRope: 'Скакалка',
};

export const EXERCISE_FORCE_LABELS: Record<ExerciseForce, string> = {
  push: 'Жим',
  pull: 'Тяга',
  static: 'Статическое',
  other: 'Другое',
};

export const EXERCISE_LEVEL_LABELS: Record<ExerciseLevel, string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export const COLOR_TAG_PALETTE: string[] = [
  '#A29BFE',
  '#74B9FF',
  '#55EFC4',
  '#FECA57',
  '#FF6B6B',
  '#FD79A8',
  '#FFB74D',
  '#81ECEC',
];
