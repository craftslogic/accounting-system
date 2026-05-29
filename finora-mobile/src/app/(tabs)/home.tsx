import React, { useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { Card } from '@/components/ui';
import { TransactionRow } from '@/components/TransactionRow';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useFundStore } from '@/store/fundStore';
import { usePeopleStore } from '@/store/peopleStore';
import { useBudgetStore } from '@/store/budgetStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const { width } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();

  const { accounts, transactions, isLoading: txLoading, fetchAll } = useTransactionStore();
  const { funds, fetchFunds, getTotalReserved, isLoading: fundsLoading } = useFundStore();
  const { contacts, balances, fetchContacts, fetchBalances, isLoading: peopleLoading } = usePeopleStore();
  const { fetchBudgets, getTotalMonthlyLimit, isLoading: budgetsLoading } = useBudgetStore();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';
  const isLoading = txLoading || fundsLoading || peopleLoading || budgetsLoading;

  useEffect(() => {
    fetchAll();
    fetchFunds();
    fetchContacts();
    fetchBalances();
    fetchBudgets();
  }, []);

  const onRefresh = () => {
    fetchAll();
    fetchFunds();
    fetchContacts();
    fetchBalances();
    fetchBudgets();
  };

  // ── Computed Stats ──────────────────────────────
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalReserved = getTotalReserved();

  let totalPayable = 0;
  let totalReceivable = 0;
  balances.forEach(b => {
    if (b.type === 'payable' || b.type === 'opening_payable') totalPayable += b.amount;
    else if (b.type === 'receivable' || b.type === 'opening_receivable') totalReceivable += b.amount;
  });

  // Available Balance = All Accounts - Reserved Funds - Money Held For Others (Payable) + Receivable
  const availableBalance = totalBalance - totalReserved - totalPayable + totalReceivable;

  // Monthly Txs
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthlyTxs = transactions.filter(t => t.date >= monthStart);
  const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = monthlyIncome - monthlyExpenses;

  // Budget
  const totalMonthlyLimit = getTotalMonthlyLimit();
  const budgetUsedPct = totalMonthlyLimit > 0 ? Math.min(100, Math.round((monthlyExpenses / totalMonthlyLimit) * 100)) : 0;

  const quickActions = [
    { label: 'Add Expense', icon: 'remove-circle-outline' as const, color: COLORS.danger, route: '/(tabs)/add' },
    { label: 'Add Income', icon: 'add-circle-outline' as const, color: COLORS.accent, route: '/(tabs)/add' },
    { label: 'Transfer', icon: 'swap-horizontal-outline' as const, color: COLORS.primary, route: '/(tabs)/add' },
    { label: 'Allocate Funds', icon: 'wallet-outline' as const, color: '#8B5CF6', route: '/funds' },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 1. Big Card: Available Balance */}
        <LinearGradient
          colors={isDark ? GRADIENTS.dark : GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardCircle1} />
          <View style={styles.cardCircle2} />
          <View style={styles.balanceInner}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
            <Text style={styles.balanceSub}>
              {formatCurrency(totalBalance)} Total - {formatCurrency(totalReserved)} Reserved - {formatCurrency(totalPayable)} Payables
            </Text>
          </View>
        </LinearGradient>

        {/* 2. 4 Quick Cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Monthly Income', value: monthlyIncome, color: COLORS.accent, icon: 'arrow-down-circle' as const },
            { label: 'Monthly Expenses', value: monthlyExpenses, color: COLORS.danger, icon: 'arrow-up-circle' as const },
            { label: 'Monthly Savings', value: savings, color: '#2563EB', icon: 'trending-up' as const },
            { label: 'Receivables', value: totalReceivable, color: '#8B5CF6', icon: 'people' as const },
          ].map((s, i) => (
            <Card key={i} style={styles.statCard} elevated padding={12}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}18` }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{formatCurrency(s.value)}</Text>
            </Card>
          ))}
        </View>

        {/* 3. Budget Progress Bar */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Budget</Text>
          <TouchableOpacity onPress={() => router.push('/budgets')}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Manage</Text>
          </TouchableOpacity>
        </View>
        <Card elevated padding={16} style={{ marginBottom: 24 }}>
          {totalMonthlyLimit > 0 ? (
            <>
              <View style={styles.budgetRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Spent</Text>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>
                  {formatCurrency(monthlyExpenses)} of {formatCurrency(totalMonthlyLimit)}
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${budgetUsedPct}%`,
                      backgroundColor: budgetUsedPct >= 100 ? COLORS.danger : (budgetUsedPct > 80 ? COLORS.warning : COLORS.primary),
                    },
                  ]}
                />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                {budgetUsedPct}% Used
              </Text>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No monthly budget set</Text>
              <TouchableOpacity
                onPress={() => router.push('/budgets')}
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: `${COLORS.primary}18`, borderRadius: 8 }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Set Budget</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* 6. Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((qa, i) => (
            <TouchableOpacity key={i} style={styles.qaBtn} onPress={() => router.push(qa.route as any)}>
              <View style={[styles.qaIcon, { backgroundColor: `${qa.color}15` }]}>
                <Ionicons name={qa.icon} size={22} color={qa.color} />
              </View>
              <Text style={[styles.qaLabel, { color: colors.textSecondary }]}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Funds Snapshot */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Funds Snapshot</Text>
          <TouchableOpacity onPress={() => router.push('/funds')}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>View All</Text>
          </TouchableOpacity>
        </View>
        <Card elevated padding={16} style={{ marginBottom: 24 }}>
          {funds.length > 0 ? (
            funds.slice(0, 3).map((f, i) => (
              <View key={f.id} style={[styles.snapshotRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[styles.snapshotIcon, { backgroundColor: `${f.color}22` }]}>
                  <Ionicons name={f.icon as any} size={18} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{f.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{f.progress_percentage}% achieved</Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(f.current_amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No funds created yet.</Text>
          )}
        </Card>

        {/* 5. People Snapshot */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>People Snapshot</Text>
          <TouchableOpacity onPress={() => router.push('/people')}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>View All</Text>
          </TouchableOpacity>
        </View>
        <Card elevated padding={16} style={{ marginBottom: 24 }}>
          {balances.length > 0 ? (
            balances.slice(0, 3).map((b, i) => (
              <View key={b.id} style={[styles.snapshotRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[styles.snapshotIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{b.contact?.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{b.contact?.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>
                    {b.type === 'payable' ? 'Money Held For Them' : 'Owes You'}
                  </Text>
                </View>
                <Text style={{ color: b.type === 'payable' ? COLORS.danger : COLORS.success, fontWeight: '700' }}>
                  {formatCurrency(b.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No people balances.</Text>
          )}
        </Card>

        {/* 7. Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>See All</Text>
          </TouchableOpacity>
        </View>
        <Card elevated padding={0} style={{ marginBottom: 40, overflow: 'hidden' }}>
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((t, i) => (
              <View key={t.id} style={{ paddingHorizontal: 16 }}>
                <TransactionRow transaction={t} isLast={i === 4 || i === transactions.length - 1} />
              </View>
            ))
          ) : (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted }}>No recent transactions</Text>
            </View>
          )}
        </Card>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  avatarBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 24, overflow: 'hidden' },
  cardCircle1: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardCircle2: { position: 'absolute', bottom: -60, right: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
  balanceInner: { zIndex: 1 },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  balanceSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: (width - 52) / 2, gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  qaBtn: { alignItems: 'center', width: (width - 40) / 4 },
  qaIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qaLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  snapshotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  snapshotIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
