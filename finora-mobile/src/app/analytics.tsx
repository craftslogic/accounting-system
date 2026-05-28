import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Card } from '@/components/ui';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const { width } = Dimensions.get('window');

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const transactions = useTransactionStore((state) => state.transactions);

  // Filter for this month
  const now = new Date();
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = currentMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  currentMonthTx.filter((t) => t.type === 'expense').forEach((t) => {
    const name = t.category?.name ?? 'Other';
    categoryMap[name] = (categoryMap[name] ?? 0) + t.amount;
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount, pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard} elevated padding={14}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.accent} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accent }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </Card>

          <Card style={styles.summaryCard} elevated padding={14}>
            <View style={[styles.summaryIcon, { backgroundColor: `${COLORS.danger}15` }]}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.danger} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </Card>

          <Card style={styles.summaryCard} elevated padding={14}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.primaryMuted }]}>
              <Ionicons name="trending-up" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saved</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
              {savingsRate}%
            </Text>
          </Card>
        </View>

        {/* Expense Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Expense Breakdown
        </Text>

        <Card elevated>
          {categoryBreakdown.map((cat, i) => (
            <View
              key={cat.name}
              style={[
                styles.catRow,
                i < categoryBreakdown.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.catName, { color: colors.text }]}>
                {cat.name}
              </Text>
              <View style={styles.catRight}>
                {/* Bar */}
                <View style={[styles.barBg, { backgroundColor: colors.bgMuted }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${cat.pct}%`,
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catPct, { color: colors.textSecondary }]}>
                  {cat.pct}%
                </Text>
                <Text style={[styles.catAmt, { color: colors.text }]}>
                  {formatCurrency(cat.amount)}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={{ height: 100 }} />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    gap: 6,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  catRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  catPct: {
    fontSize: 11,
    fontWeight: '500',
    width: 28,
    textAlign: 'right',
  },
  catAmt: {
    fontSize: 13,
    fontWeight: '700',
    width: 44,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
});
