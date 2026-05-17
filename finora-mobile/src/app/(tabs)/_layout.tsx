import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IconName;
  focused: boolean;
  label: string;
  isDark: boolean;
  colors: any;
}

function TabIcon({ name, focused, label, isDark, colors }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.tabIconBg,
          focused && {
            backgroundColor: isDark ? `${COLORS.primary}25` : COLORS.primaryMuted,
          },
        ]}
      >
        <Ionicons
          name={name}
          size={21}
          color={focused ? COLORS.primary : colors.textMuted}
        />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? COLORS.primary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              label="Home"
              isDark={isDark}
              colors={colors}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'list' : 'list-outline'}
              focused={focused}
              label="Txns"
              isDark={isDark}
              colors={colors}
            />
          ),
        }}
      />

      {/* Floating Add Button */}
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => (
            <View style={styles.addBtnWrapper}>
              <View
                style={[
                  styles.addBtn,
                  { shadowColor: COLORS.primary },
                ]}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              focused={focused}
              label="Stats"
              isDark={isDark}
              colors={colors}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'wallet' : 'wallet-outline'}
              focused={focused}
              label="Accounts"
              isDark={isDark}
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 48,
  },
  tabIconBg: {
    width: 42,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  addBtnWrapper: {
    width: 56,
    height: 56,
    marginTop: -24,
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
