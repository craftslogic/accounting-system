import { useColorScheme } from 'react-native';
import { COLORS } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const isDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme === 'dark';

  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors,
    scheme: isDark ? 'dark' : 'light',
  };
}

export type Theme = ReturnType<typeof useTheme>;
