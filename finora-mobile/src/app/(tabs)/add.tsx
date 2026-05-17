import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';

const ACTION_TYPES = [
  {
    id: 'expense',
    label: 'Add Expense',
    subtitle: 'Record a spending',
    icon: 'remove-circle' as const,
    color: COLORS.danger,
    bg: `${COLORS.danger}15`,
  },
  {
    id: 'income',
    label: 'Add Income',
    subtitle: 'Record earnings',
    icon: 'add-circle' as const,
    color: COLORS.accent,
    bg: COLORS.accentLight,
  },
  {
    id: 'transfer',
    label: 'Transfer',
    subtitle: 'Move between accounts',
    icon: 'swap-horizontal' as const,
    color: COLORS.primary,
    bg: COLORS.primaryMuted,
  },
];

export default function AddScreen() {
  const { colors, isDark } = useTheme();

  const handleAction = (id: string) => {
    Alert.alert('Coming Soon', `${id} form will be implemented soon.`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Add Record</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          What would you like to record?
        </Text>

        <View style={styles.options}>
          {ACTION_TYPES.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.option,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleAction(action.label)}
            >
              <View style={[styles.optionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  optionSub: {
    fontSize: 12,
    fontWeight: '400',
  },
});
