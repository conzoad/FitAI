export const darkColors = {
  // Primary palette
  primary: '#6C5CE7',
  primaryDark: '#5A4BD1',
  primaryLight: '#A29BFE',
  accent: '#A29BFE',

  // Gradient pairs
  gradientStart: '#6C5CE7',
  gradientEnd: '#A29BFE',
  gradientWarm: '#FD79A8',

  // Macro colors (vibrant for dark bg)
  calories: '#FF6B6B',
  proteins: '#74B9FF',
  fats: '#FECA57',
  carbs: '#55EFC4',

  // Backgrounds
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#242442',
  surfaceElevated: '#2A2A4A',

  // Text
  text: '#EAEAF5',
  textSecondary: '#8888A8',
  textMuted: '#5A5A7A',

  // Borders
  border: '#2A2A4A',
  borderLight: '#3A3A5A',

  // Semantic
  error: '#FF6B6B',
  success: '#55EFC4',
  warning: '#FECA57',

  // Chat
  chatUser: '#6C5CE7',
  chatUserText: '#FFFFFF',
  chatAssistant: '#1E1E38',
  chatAssistantBorder: '#2A2A4A',

  // Workout
  workout: '#A29BFE',
  workoutDark: '#6C5CE7',
  workoutLight: 'rgba(108, 92, 231, 0.15)',
  warmup: '#FFB74D',
  volume: '#55EFC4',
  personalRecord: '#FECA57',

  // Overlay & Glass
  overlay: 'rgba(15, 15, 26, 0.85)',
  glass: 'rgba(26, 26, 46, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Tab bar
  tabBarBg: 'rgba(15, 15, 26, 0.92)',
};

export const lightColors: typeof darkColors = {
  // Primary palette
  primary: '#6C5CE7',
  primaryDark: '#5A4BD1',
  primaryLight: '#A29BFE',
  accent: '#A29BFE',

  // Gradient pairs
  gradientStart: '#6C5CE7',
  gradientEnd: '#A29BFE',
  gradientWarm: '#FD79A8',

  // Macro colors (slightly muted for light bg)
  calories: '#E74C3C',
  proteins: '#3498DB',
  fats: '#F39C12',
  carbs: '#27AE60',

  // Backgrounds
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F8',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#1A1A2E',
  textSecondary: '#6B6B8D',
  textMuted: '#9999B3',

  // Borders
  border: '#E0E0EE',
  borderLight: '#D0D0E0',

  // Semantic
  error: '#E74C3C',
  success: '#27AE60',
  warning: '#F39C12',

  // Chat
  chatUser: '#6C5CE7',
  chatUserText: '#FFFFFF',
  chatAssistant: '#F0F0F8',
  chatAssistantBorder: '#E0E0EE',

  // Workout
  workout: '#6C5CE7',
  workoutDark: '#5A4BD1',
  workoutLight: 'rgba(108, 92, 231, 0.1)',
  warmup: '#E67E22',
  volume: '#27AE60',
  personalRecord: '#F39C12',

  // Overlay & Glass
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',

  // Tab bar
  tabBarBg: 'rgba(255, 255, 255, 0.95)',
};

// Default export for backward compatibility
export const colors = darkColors;
