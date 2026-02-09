export interface Macros {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface FoodItem {
  id: string;
  name: string;
  amount: string;
  macros: Macros;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  type: MealType;
  items: FoodItem[];
  totalMacros: Macros;
  timestamp: string;
  source: 'text' | 'photo' | 'manual';
  photoUri?: string;
}

export interface DailyEntry {
  date: string;
  meals: Meal[];
  totalMacros: Macros;
}

export type Gender = 'male' | 'female';
export type Goal = 'loss' | 'maintenance' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  targetCalories: number;
  targetProteins: number;
  targetFats: number;
  targetCarbs: number;
  isOnboarded: boolean;
  weightHistory: WeightEntry[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface GeminiNutritionResponse {
  items: {
    name: string;
    amount: string;
    calories: number;
    proteins: number;
    fats: number;
    carbs: number;
  }[];
  totalCalories: number;
  totalProteins: number;
  totalFats: number;
  totalCarbs: number;
  confidence: 'high' | 'medium' | 'low';
}

export type RootTabParamList = {
  HomeTab: undefined;
  DiaryTab: undefined;
  AddMealTab: undefined;
  WorkoutTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Stats: undefined;
};

export type DiaryStackParamList = {
  Diary: undefined;
  MealDetail: { mealId: string; date: string };
};

// ===== Workout Types =====

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'abs'
  | 'cardio'
  | 'fullBody';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  description: string;
  isCompound: boolean;
  gifUrl?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  isWarmup: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  startTime: number;
  endTime?: number;
  exercises: WorkoutExercise[];
  notes?: string;
  totalVolume: number;
  duration: number;
}

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSize: string;
  macros: Macros;
  imageUrl?: string;
}

// ===== Workout Programs =====

export interface ProgramExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  createdAt: string;
}

// ===== Navigation =====

export type WorkoutStackParamList = {
  Workouts: undefined;
  StartWorkout: { programId?: string } | undefined;
  ExerciseList: { onSelect?: boolean };
  ExerciseDetail: { exerciseId: string };
  WorkoutDetail: { sessionId: string; date: string };
  CreateProgram: undefined;
  ProgramDetail: { programId: string };
};

export type AddMealStackParamList = {
  AddMeal: undefined;
  BarcodeScanner: undefined;
};
