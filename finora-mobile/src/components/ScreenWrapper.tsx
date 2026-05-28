import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Include bottom inset (use false for tab screens where tab bar handles it) */
  withBottomInset?: boolean;
  /** Override background color */
  bgColor?: string;
}

/**
 * Wraps a screen and pads it using useSafeAreaInsets so content
 * is never hidden behind the camera notch or gesture/nav bar.
 */
export function ScreenWrapper({
  children,
  withBottomInset = false,
  bgColor,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: withBottomInset ? insets.bottom : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: bgColor ?? colors.bg,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
