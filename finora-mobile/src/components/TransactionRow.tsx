import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Transaction } from '@/types';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useTransactionStore } from '@/store/transactionStore';

interface TransactionRowProps {
  transaction: Transaction;
  isLast?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TransactionRow({ transaction, isLast = false }: TransactionRowProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { deleteTransaction } = useTransactionStore();
  
  const isIncome = transaction.type === 'income';
  const cat = transaction.category;

  const handleLongPress = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(transaction.id);
          }
        }
      ]
    );
  };

  const handlePress = () => {
    router.push(`/transaction/${transaction.id}`);
  };

  return (
    <TouchableOpacity 
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconBg,
          { backgroundColor: isDark ? `${cat?.color}22` : `${cat?.color}18` },
        ]}
      >
        <Ionicons
          name={(cat?.icon as keyof typeof Ionicons.glyphMap) ?? 'ellipse'}
          size={18}
          color={cat?.color ?? COLORS.primary}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {cat?.name ?? 'Transaction'}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {transaction.account?.name} · {formatDate(transaction.date)}
        </Text>
      </View>

      {/* Amount */}
      <Text
        style={[
          styles.amount,
          { color: isIncome ? COLORS.success : COLORS.danger },
        ]}
      >
        {isIncome ? '+' : '-'}{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '400',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
