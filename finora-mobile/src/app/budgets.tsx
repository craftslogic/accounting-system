import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useBudgetStore } from '@/store/budgetStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { budgets, fetchBudgets, createBudget, deleteBudget, isLoading } = useBudgetStore();

  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }

    setIsSaving(true);
    const result = await createBudget({
      amount: parsedAmount,
      period: 'monthly',
    });
    setIsSaving(false);

    if (result.success) {
      setAmount('');
      Alert.alert('Success', 'Monthly budget set successfully!');
    } else {
      Alert.alert('Error', result.error ?? 'Failed to set budget.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to remove this budget limit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteBudget(id);
            if (!res.success) {
              Alert.alert('Error', res.error ?? 'Failed to delete budget.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage Budgets</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF', borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Set Monthly Budget</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Define an overall monthly spending limit to track your progress and avoid overspending.
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>MONTHLY LIMIT</Text>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 50000"
              leftIcon="wallet-outline"
              keyboardType="numeric"
            />

            <Button
              onPress={handleSave}
              loading={isSaving}
              style={{ marginTop: 24 }}
            >
              Set Budget
            </Button>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Budgets</Text>
          {budgets.length > 0 ? (
            budgets.map((b) => (
              <View key={b.id} style={[styles.budgetRow, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF', borderColor: colors.border }]}>
                <View style={styles.budgetInfo}>
                  <View style={[styles.budgetIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={[styles.budgetName, { color: colors.text }]}>
                      {b.period.charAt(0).toUpperCase() + b.period.slice(1)} Budget
                    </Text>
                    <Text style={[styles.budgetLimit, { color: colors.textSecondary }]}>
                      Limit: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(b.amount)}</Text>
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(b.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
              No budgets set. Create one above.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  budgetInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  budgetIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  budgetLimit: { fontSize: 13 },
  deleteBtn: { padding: 8 },
});
