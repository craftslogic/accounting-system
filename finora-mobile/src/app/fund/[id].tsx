import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useFundStore } from '@/store/fundStore';
import { useTransactionStore } from '@/store/transactionStore';
import type { FundTransaction } from '@/types';
import { scheduleFundReminder } from '@/lib/notifications';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function FundDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { funds, fetchFundTransactions, addFundTransaction } = useFundStore();
  const { accounts } = useTransactionStore();
  const fund = funds.find(f => f.id === id);

  const [txHistory, setTxHistory] = useState<FundTransaction[]>([]);
  const [modalType, setModalType] = useState<'allocate' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFundTransactions(id).then(setTxHistory);
    }
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
  }, [id, accounts]);

  if (!fund) {
    return (
      <ScreenWrapper withBottomInset>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Fund not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const handleTransaction = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (modalType === 'withdraw' && parsed > fund.current_amount) {
      Alert.alert('Insufficient Balance', `This fund only has ${formatCurrency(fund.current_amount)}.`);
      return;
    }

    setIsSaving(true);
    const res = await addFundTransaction({
      fund_id: fund.id,
      account_id: selectedAccountId || undefined,
      type: modalType!,
      amount: parsed,
      note: note.trim() || undefined,
      transaction_date: new Date().toISOString().split('T')[0],
    });
    setIsSaving(false);

    if (res.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Schedule a reminder 7 days from now after adding money
      if (modalType === 'allocate') {
        scheduleFundReminder({
          fundName: fund.name,
          targetAmount: fund.target_amount,
          currentAmount: fund.current_amount + parsed,
        });
      }
      setModalType(null);
      setAmount('');
      setNote('');
      // Refresh history
      fetchFundTransactions(id).then(setTxHistory);
    } else {
      Alert.alert('Error', res.error ?? 'Failed to process transaction.');
    }
  };

  return (
    <ScreenWrapper withBottomInset>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {fund.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          <View style={[styles.fundIcon, { backgroundColor: `${fund.color}20` }]}>
            <Ionicons name={fund.icon as any} size={36} color={fund.color} />
          </View>
          <Text style={[styles.heroAmount, { color: fund.color }]}>
            {formatCurrency(fund.current_amount)}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {fund.target_amount
              ? `${formatCurrency(fund.current_amount)} of ${formatCurrency(fund.target_amount)} goal`
              : 'Current balance'}
          </Text>

          {/* Progress */}
          {fund.target_amount !== null && (
            <View style={styles.progressRow}>
              <View style={[styles.progressBg, { backgroundColor: `${fund.color}20` }]}>
                <View style={[styles.progressFill, { width: `${fund.progress_percentage}%`, backgroundColor: fund.color }]} />
              </View>
              <Text style={[styles.progressPct, { color: fund.color }]}>{fund.progress_percentage}%</Text>
            </View>
          )}

          {fund.description && (
            <Text style={[styles.heroDesc, { color: colors.textMuted }]}>{fund.description}</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => setModalType('allocate')}
            style={[styles.actionBtn, { backgroundColor: `${COLORS.accent}15`, borderColor: `${COLORS.accent}40` }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down-circle-outline" size={24} color={COLORS.accent} />
            <Text style={[styles.actionBtnLabel, { color: COLORS.accent }]}>Add Money</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModalType('withdraw')}
            style={[styles.actionBtn, { backgroundColor: `${COLORS.danger}15`, borderColor: `${COLORS.danger}40` }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.danger} />
            <Text style={[styles.actionBtnLabel, { color: COLORS.danger }]}>Use Money</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction history */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>History</Text>

        {txHistory.length === 0 ? (
          <Text style={[styles.emptyHist, { color: colors.textMuted }]}>
            No transactions yet for this fund.
          </Text>
        ) : (
          <View style={[styles.histCard, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
            {txHistory.map((tx, i) => {
              const isAlloc = tx.type === 'allocate';
              const color = isAlloc ? COLORS.accent : COLORS.danger;
              return (
                <View
                  key={tx.id}
                  style={[styles.histRow, i < txHistory.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.histIcon, { backgroundColor: `${color}18` }]}>
                    <Ionicons name={isAlloc ? 'arrow-down' : 'arrow-up'} size={16} color={color} />
                  </View>
                  <View style={styles.histInfo}>
                    <Text style={[styles.histType, { color: colors.text }]}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </Text>
                    <Text style={[styles.histDate, { color: colors.textMuted }]}>
                      {new Date(tx.transaction_date).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                      {tx.note ? ` · ${tx.note}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.histAmount, { color }]}>
                    {isAlloc ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom sheet modal */}
      <Modal visible={!!modalType} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior="padding"
        >
          <View style={[styles.sheet, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {modalType === 'allocate' ? '💰 Add Money to Fund' : '💸 Use Money from Fund'}
            </Text>

            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>AMOUNT (PKR)</Text>
            <TextInput
              style={[styles.sheetInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {accounts.length > 0 && (
              <>
                <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {accounts.map(acc => {
                    const active = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedAccountId(acc.id)}
                        style={[
                          styles.accChip,
                          {
                            backgroundColor: active ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                            borderColor: active ? COLORS.primary : (isDark ? COLORS.dark.border : COLORS.light.border),
                          },
                        ]}
                      >
                        <Text style={{ color: active ? COLORS.primary : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={[styles.sheetLabel, { color: colors.textSecondary }]}>NOTE (optional)</Text>
            <TextInput
              style={[styles.sheetInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="Add a note…"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.sheetBtns}>
              <TouchableOpacity
                onPress={() => { setModalType(null); setAmount(''); setNote(''); }}
                style={[styles.sheetCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTransaction}
                disabled={isSaving}
                style={[styles.sheetConfirmBtn, {
                  backgroundColor: modalType === 'allocate' ? COLORS.accent : COLORS.danger,
                }]}
              >
                <Text style={styles.sheetConfirmText}>{isSaving ? 'Saving…' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  hero: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 16,
  },
  fundIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroAmount: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  heroSub: { fontSize: 14, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 4 },
  progressBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  heroDesc: { fontSize: 13, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 14,
    borderRadius: 14, borderWidth: 1.5,
  },
  actionBtnLabel: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },
  emptyHist: { textAlign: 'center', fontSize: 14, paddingVertical: 24 },
  histCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, overflow: 'hidden' },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  histIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  histInfo: { flex: 1, gap: 2 },
  histType: { fontSize: 14, fontWeight: '600' },
  histDate: { fontSize: 12 },
  histAmount: { fontSize: 14, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 4 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, letterSpacing: -0.4 },
  sheetLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  sheetInput: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, marginBottom: 12,
  },
  accChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, marginRight: 8,
  },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetCancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetConfirmBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetConfirmText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
