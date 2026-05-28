import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
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
  const { accounts, transactions, isLoading, fetchAll } = useTransactionStore();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    fetchAll();
  }, []);

  // Computed stats from real data
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthlyTxs = transactions.filter(t => t.date >= monthStart);
  const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = monthlyIncome - monthlyExpenses;

  const accountTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    cash: 'cash-outline',
    bank: 'business-outline',
    wallet: 'wallet-outline',
    savings: 'wallet-outline',
    custom: 'card-outline',
    investment: 'trending-up-outline',
  };

  const accountTypeColors: Record<string, string> = {
    cash: COLORS.accent,
    bank: COLORS.primary,
    wallet: '#8B5CF6',
    savings: '#06B6D4',
    investment: '#F59E0B',
    custom: '#64748B',
  };

  const quickActions = [
    {
      label: 'Add Expense',
      icon: 'remove-circle-outline' as const,
      color: COLORS.danger,
      bg: `${COLORS.danger}18`,
      route: '/(tabs)/add',
    },
    {
      label: 'Add Income',
      icon: 'add-circle-outline' as const,
      color: COLORS.accent,
      bg: COLORS.accentLight,
      route: '/(tabs)/add',
    },
    {
      label: 'Transfer',
      icon: 'swap-horizontal-outline' as const,
      color: COLORS.primary,
      bg: COLORS.primaryMuted,
      route: '/(tabs)/add',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAll}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {firstName} 👋
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.avatarBtn,
              { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted },
            ]}
            onPress={() => {}}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Balance Card ────────────────────────── */}
        <LinearGradient
          colors={isDark ? GRADIENTS.dark : GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardCircle1} />
          <View style={styles.cardCircle2} />

          <View style={styles.balanceInner}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>

            <View style={styles.balanceMeta}>
              <View style={styles.balanceMetaItem}>
                <View style={[styles.metaDot, { backgroundColor: COLORS.accent }]} />
                <View>
                  <Text style={styles.metaLabel}>Monthly Savings</Text>
                  <Text style={styles.metaValue}>{formatCurrency(savings)}</Text>
                </View>
              </View>
              <View style={styles.balanceMetaItem}>
                <View style={[styles.metaDot, { backgroundColor: '#F59E0B' }]} />
                <View>
                  <Text style={styles.metaLabel}>Budget Used</Text>
                  <Text style={styles.metaValue}>
                    {monthlyIncome > 0 ? Math.round((monthlyExpenses / monthlyIncome) * 100) : 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Stats ─────────────────────────── */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} elevated>
            <View style={[styles.statIcon, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIcon, { backgroundColor: `${COLORS.danger}18` }]}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.danger} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(monthlyExpenses)}
            </Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primaryMuted }]}>
              <Ionicons name="trending-up" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Savings</Text>
            <Text style={[styles.statValue, { color: savings >= 0 ? COLORS.accent : COLORS.danger }]}>
              {formatCurrency(savings)}
            </Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="wallet" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accounts</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {accounts.length}
            </Text>
          </Card>
        </View>

        {/* ── Quick Actions ───────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>

        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.quickAction,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Accounts ────────────────────────────── */}
        {accounts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Accounts</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
                <Text style={[styles.seeAll, { color: COLORS.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsScroll}
            >
              {accounts.map((account) => {
                const iconColor = accountTypeColors[account.type] ?? COLORS.primary;
                return (
                  <View
                    key={account.id}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isDark ? `${iconColor}18` : `${iconColor}12`,
                        borderColor: isDark ? `${iconColor}30` : `${iconColor}25`,
                      },
                    ]}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: `${iconColor}25` }]}>
                      <Ionicons
                        name={accountTypeIcons[account.type] ?? 'wallet-outline'}
                        size={18}
                        color={iconColor}
                      />
                    </View>
                    <Text style={[styles.accountName, { color: colors.text }]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.accountBalance, { color: iconColor }]}>
                      {formatCurrency(account.balance)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Recent Transactions ─────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={[styles.seeAll, { color: COLORS.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={[styles.emptyTxCard, {
            backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF',
            borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
          }]}>
            <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyTxText, { color: colors.textMuted }]}>
              No transactions yet
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/add')}>
              <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
                Add your first one →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Card elevated>
            {transactions.slice(0, 5).map((tx, i) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                isLast={i === Math.min(transactions.length, 5) - 1}
              />
            ))}
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 2,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 160,
  },
  cardCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -40,
    right: -30,
  },
  cardCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -20,
    left: 30,
  },
  balanceInner: { gap: 8 },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginTop: 2,
  },
  balanceMeta: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  balanceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 50) / 2,
    gap: 8,
    padding: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  accountsScroll: {
    gap: 12,
    paddingRight: 4,
    marginBottom: 24,
  },
  accountCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    width: 140,
    gap: 8,
  },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  emptyTxCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTxText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
