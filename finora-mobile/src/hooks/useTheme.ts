import { useColorScheme } from 'react-native';
import { COLORS } from '@/constants/colors';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors,
    scheme: isDark ? 'dark' : 'light',
  };
}

export type Theme = ReturnType<typeof useTheme>;
