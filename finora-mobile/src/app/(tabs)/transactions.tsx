import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_TRANSACTIONS } from '@/constants/mockData';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();

  // Group by date label
  const today = MOCK_TRANSACTIONS.filter(
    (t) => new Date(t.date).toDateString() === new Date().toDateString()
  );
  const earlier = MOCK_TRANSACTIONS.filter(
    (t) => new Date(t.date).toDateString() !== new Date().toDateString()
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {MOCK_TRANSACTIONS.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No transactions yet"
            subtitle="Start by adding your first income or expense"
          />
        ) : (
          <>
            {today.length > 0 && (
              <>
                <Text style={[styles.group, { color: colors.textSecondary }]}>Today</Text>
                <Card elevated>
                  {today.map((tx, i) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      isLast={i === today.length - 1}
                    />
                  ))}
                </Card>
              </>
            )}

            {earlier.length > 0 && (
              <>
                <Text style={[styles.group, { color: colors.textSecondary }]}>Earlier</Text>
                <Card elevated>
                  {earlier.map((tx, i) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      isLast={i === earlier.length - 1}
                    />
                  ))}
                </Card>
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  group: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
});
