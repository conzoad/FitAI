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
