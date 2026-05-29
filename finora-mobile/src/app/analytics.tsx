import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Card } from '@/components/ui';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const { width } = Dimensions.get('window');

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function shortAmount(v: number | string): string {
  const num = typeof v === 'string' ? Number(v) : v;
  if (isNaN(num)) return String(v);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
  return String(num);
}

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

type Period = 'month' | '3months' | 'year';

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { transactions } = useTransactionStore();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();

  function isInPeriod(dateStr: string): boolean {
    const d = new Date(dateStr);
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === '3months') {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 2);
      cutoff.setDate(1);
      return d >= cutoff;
    }
    // year
    return d.getFullYear() === now.getFullYear();
  }

  const periodTx = transactions.filter((t) => isInPeriod(t.date));

  const totalIncome = periodTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = periodTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Bar chart data – Income vs Expenses vs Net Savings
  const barData = [
    {
      value: totalIncome,
      label: 'Income',
      frontColor: COLORS.accent,
      topLabelComponent: () => (
        <Text style={{ color: COLORS.accent, fontSize: 9, fontWeight: '700', marginBottom: 4 }}>
          {shortAmount(totalIncome)}
        </Text>
      ),
    },
    {
      value: totalExpenses,
      label: 'Expense',
      frontColor: COLORS.danger,
      topLabelComponent: () => (
        <Text style={{ color: COLORS.danger, fontSize: 9, fontWeight: '700', marginBottom: 4 }}>
          {shortAmount(totalExpenses)}
        </Text>
      ),
    },
    {
      value: Math.max(0, netSavings),
      label: 'Saved',
      frontColor: '#2563EB',
      topLabelComponent: () => (
        <Text style={{ color: '#2563EB', fontSize: 9, fontWeight: '700', marginBottom: 4 }}>
          {shortAmount(Math.max(0, netSavings))}
        </Text>
      ),
    },
  ];

  // Category breakdown for pie chart
  const categoryMap: Record<string, { amount: number; color?: string }> = {};
  periodTx
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const name = t.category?.name ?? 'Other';
      const color = t.category?.color;
      if (!categoryMap[name]) categoryMap[name] = { amount: 0, color };
      categoryMap[name].amount += t.amount;
    });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, val], i) => ({
      name,
      amount: val.amount,
      color: val.color ?? CHART_COLORS[i % CHART_COLORS.length],
      pct: totalExpenses > 0 ? Math.round((val.amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const pieData = categoryBreakdown.map((cat, i) => ({
    value: cat.amount,
    color: cat.color ?? CHART_COLORS[i % CHART_COLORS.length],
    text: `${cat.pct}%`,
  }));

  const PERIOD_OPTIONS: { key: Period; label: string }[] = [
    { key: 'month', label: 'This Month' },
    { key: '3months', label: '3 Months' },
    { key: 'year', label: 'This Year' },
  ];

  const noData = totalIncome === 0 && totalExpenses === 0;

  return (
    <ScreenWrapper withBottomInset>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                styles.periodChip,
                period === p.key && {
                  backgroundColor: `${COLORS.primary}18`,
                  borderColor: COLORS.primary,
                },
                period !== p.key && {
                  borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
                },
              ]}
            >
              <Text style={[
                styles.periodLabel,
                { color: period === p.key ? COLORS.primary : colors.textSecondary },
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Income', value: totalIncome, color: COLORS.accent, icon: 'arrow-down-circle' as const, bg: COLORS.accentLight },
            { label: 'Expenses', value: totalExpenses, color: COLORS.danger, icon: 'arrow-up-circle' as const, bg: `${COLORS.danger}15` },
            { label: 'Saved', value: netSavings, color: '#2563EB', icon: 'trending-up' as const, bg: '#DBEAFE' },
          ].map((s) => (
            <Card key={s.label} style={styles.summaryCard} elevated padding={14}>
              <View style={[styles.summaryIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              <Text style={[styles.summaryValue, { color: s.color }]}>{formatCurrency(s.value)}</Text>
            </Card>
          ))}
        </View>

        {noData ? (
          <View style={styles.noData}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.noDataText, { color: colors.textMuted }]}>
              No data for this period
            </Text>
          </View>
        ) : (
          <>
            {/* Bar Chart – Monthly Summary */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Summary</Text>
            <Card elevated style={styles.chartCard}>
              <BarChart
                data={barData}
                barWidth={52}
                spacing={24}
                roundedTop
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                noOfSections={4}
                maxValue={Math.max(totalIncome, totalExpenses, 1) * 1.2}
                formatYLabel={shortAmount}
                isAnimated
                animationDuration={600}
                showValuesAsTopLabel={false}
                barBorderRadius={8}
                width={width - 100}
                height={180}
              />
            </Card>

            {/* Pie Chart – Expense Breakdown */}
            {categoryBreakdown.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Expense Breakdown</Text>
                <Card elevated style={styles.chartCard}>
                  <View style={styles.pieRow}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={80}
                      innerRadius={50}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: colors.textMuted, fontSize: 10 }}>Budget</Text>
                          <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 14 }}>
                            {savingsRate >= 0 ? `${100 - savingsRate}%` : '100%'}
                          </Text>
                          <Text style={{ color: colors.textMuted, fontSize: 9 }}>used</Text>
                        </View>
                      )}
                      isAnimated
                      animationDuration={800}
                    />
                    {/* Legend */}
                    <View style={styles.legend}>
                      {categoryBreakdown.slice(0, 6).map((cat) => (
                        <View key={cat.name} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                          <Text style={[styles.legendName, { color: colors.textSecondary }]} numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <Text style={[styles.legendPct, { color: colors.text }]}>
                            {cat.pct}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Card>

                {/* Category List */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
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
                      <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                      <View style={styles.catRight}>
                        <View style={[styles.barBg, { backgroundColor: colors.bgMuted ?? '#eee' }]}>
                          <View
                            style={[styles.barFill, { width: `${cat.pct}%`, backgroundColor: cat.color }]}
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
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  periodLabel: { fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, gap: 6 },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, marginBottom: 12 },
  chartCard: { padding: 16, marginBottom: 24, alignItems: 'center' },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontSize: 11, fontWeight: '500' },
  legendPct: { fontSize: 11, fontWeight: '700' },
  noData: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  noDataText: { fontSize: 15, fontWeight: '500' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 13, fontWeight: '600', width: 80 },
  catRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 11, fontWeight: '500', width: 28, textAlign: 'right' },
  catAmt: { fontSize: 12, fontWeight: '700', width: 55, textAlign: 'right', letterSpacing: -0.2 },
});
