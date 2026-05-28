import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTransactionStore } from '@/store/transactionStore';
import type { Transaction } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function groupByDate(transactions: Transaction[]): { title: string; data: Transaction[] }[] {
  const map: Record<string, Transaction[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const tx of transactions) {
    const d = new Date(tx.date).toDateString();
    const label =
      d === today ? 'Today' :
      d === yesterday ? 'Yesterday' :
      new Date(tx.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });

    if (!map[label]) map[label] = [];
    map[label].push(tx);
  }

  return Object.entries(map).map(([title, data]) => ({ title, data }));
}

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { transactions, isLoading, fetchAll } = useTransactionStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const onRefresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const groups = groupByDate(transactions);

  // Summary
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/add')}
          style={[styles.addBtn, { backgroundColor: `${COLORS.primary}18` }]}
        >
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      {transactions.length > 0 && (
        <View style={[styles.summary, { borderBottomColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="arrow-down-circle" size={14} color={COLORS.accent} />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accent }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Ionicons name="arrow-up-circle" size={14} color={COLORS.danger} />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Ionicons name="trending-up" size={14} color={COLORS.primary} />
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Net</Text>
            <Text style={[styles.summaryValue, { color: totalIncome - totalExpenses >= 0 ? COLORS.accent : COLORS.danger }]}>
              {formatCurrency(totalIncome - totalExpenses)}
            </Text>
          </View>
        </View>
      )}

      {/* Loading */}
      {isLoading && transactions.length === 0 && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading transactions…
          </Text>
        </View>
      )}

      {/* Empty */}
      {!isLoading && transactions.length === 0 && (
        <EmptyState
          icon="receipt-outline"
          title="No transactions yet"
          subtitle="Tap the + button to add your first income or expense"
        />
      )}

      {/* Transaction list grouped by date */}
      {transactions.length > 0 && (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.title}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>
                {group.title}
              </Text>
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF',
                    borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
                  },
                ]}
              >
                {group.data.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    isLast={i === group.data.length - 1}
                  />
                ))}
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 2,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
});
