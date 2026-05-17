import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  fullWidth = true,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    ...styles.base,
    ...(size === 'sm' && styles.sizeSm),
    ...(size === 'md' && styles.sizeMd),
    ...(size === 'lg' && styles.sizeLg),
    ...(fullWidth && { width: '100%' }),
    ...(variant === 'primary' && {
      backgroundColor: COLORS.primary,
    }),
    ...(variant === 'secondary' && {
      backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...(variant === 'danger' && {
      backgroundColor: COLORS.danger,
    }),
    ...((disabled || loading) && { opacity: 0.6 }),
  };

  const labelStyle: TextStyle = {
    ...styles.label,
    ...(size === 'sm' && { fontSize: 13 }),
    ...(size === 'md' && { fontSize: 15 }),
    ...(size === 'lg' && { fontSize: 17 }),
    ...(variant === 'primary' && { color: '#FFFFFF' }),
    ...(variant === 'secondary' && { color: colors.text }),
    ...(variant === 'outline' && { color: colors.text }),
    ...(variant === 'ghost' && { color: COLORS.primary }),
    ...(variant === 'danger' && { color: '#FFFFFF' }),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style as ViewStyle]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFF' : COLORS.primary}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sizeSm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  sizeMd: { paddingVertical: 14, paddingHorizontal: 20 },
  sizeLg: { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16 },
  label: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
