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

export interface SavedFoodItem {
  id: string;
  name: string;
  amount: string;
  macros: Macros;
  source: 'ai' | 'barcode' | 'manual';
  addedAt: string;
  usageCount: number;
}

export type HomeStackParamList = {
  Home: undefined;
  Stats: undefined;
  MealDetail: { mealId: string; date: string };
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

export type MuscleId =
  | 'chest'
  | 'upperBack'
  | 'lats'
  | 'shoulders'
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lowerBack'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'hip-flexors'
  | 'cardio';

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'stretching'
  | 'plyometric'
  | 'powerlifting'
  | 'weightlifting';

export type Equipment =
  | 'none'
  | 'barbell'
  | 'dumbbells'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'band'
  | 'fitball'
  | 'pullUpBar'
  | 'parallelBars'
  | 'ezBar'
  | 'treadmill'
  | 'stationaryBike'
  | 'jumpRope';

export type ExerciseForce = 'push' | 'pull' | 'static' | 'other';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  category: ExerciseCategory;
  force: ExerciseForce;
  level: ExerciseLevel;
  description: string;
  isCompound: boolean;
  isCustom?: boolean;
  gifUrl?: string;
  targetMuscles?: {
    primary: MuscleId[];
    secondary: MuscleId[];
  };
}

export interface GeminiExerciseResponse {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  category: ExerciseCategory;
  force: ExerciseForce;
  level: ExerciseLevel;
  description: string;
  isCompound: boolean;
  targetMuscles: {
    primary: MuscleId[];
    secondary: MuscleId[];
  };
  confidence: 'high' | 'medium' | 'low';
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
  CreateExercise: undefined;
};

export type AddMealStackParamList = {
  AddMeal: undefined;
  BarcodeScanner: undefined;
};
