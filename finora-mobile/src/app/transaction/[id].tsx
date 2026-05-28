import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const { transactions, deleteTransaction } = useTransactionStore();
  const tx = transactions.find(t => t.id === id);

  if (!tx) {
    return (
      <ScreenWrapper withBottomInset>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={{ color: colors.textSecondary }}>Transaction not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const isIncome = tx.type === 'income';
  const cat = tx.category;

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const res = await deleteTransaction(tx.id);
            if (res.success) {
              router.back();
            } else {
              Alert.alert('Error', res.error ?? 'Failed to delete transaction.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper withBottomInset>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Big Amount */}
        <View style={styles.hero}>
          <View
            style={[
              styles.iconLg,
              { backgroundColor: isDark ? `${cat?.color}22` : `${cat?.color}18` },
            ]}
          >
            <Ionicons
              name={(cat?.icon as any) ?? 'ellipse'}
              size={40}
              color={cat?.color ?? COLORS.primary}
            />
          </View>
          <Text style={[styles.amount, { color: isIncome ? COLORS.success : colors.text }]}>
            {isIncome ? '+' : '-'}{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tx.amount)}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {cat?.name ?? 'Transaction'}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {new Date(tx.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Details Card */}
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          <DetailRow label="Type" value={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DetailRow label="Account" value={tx.account?.name ?? 'Unknown'} colors={colors} />
          
          {tx.note && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <DetailRow label="Note" value={tx.note} colors={colors} />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  deleteButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 32 },
  iconLg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amount: { fontSize: 42, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 14, fontWeight: '500' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 15, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
});
