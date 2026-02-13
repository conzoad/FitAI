import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/useThemeStore';
import { darkColors, lightColors } from './colors';

export type ColorPalette = typeof darkColors;

export function useColors(): ColorPalette {
  const theme = useThemeStore((s) => s.theme);
  const systemScheme = useColorScheme();

  if (theme === 'system') {
    return systemScheme === 'light' ? lightColors : darkColors;
  }
  return theme === 'light' ? lightColors : darkColors;
}

export function getColors(): ColorPalette {
  const theme = useThemeStore.getState().theme;
  return theme === 'light' ? lightColors : darkColors;
}
