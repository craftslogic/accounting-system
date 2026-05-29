import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { transactions, deleteTransaction, updateTransaction } = useTransactionStore();
  const tx = transactions.find((t) => t.id === id);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = () => {
    if (!tx) return;
    setEditAmount(String(tx.amount));
    setEditNote(tx.note ?? '');
    setEditDate(tx.date ? new Date(tx.date) : new Date());
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    const amt = parseFloat(editAmount.replace(/,/g, ''));
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setIsSaving(true);
    const res = await updateTransaction(id, {
      amount: amt,
      note: editNote.trim() || undefined,
      transaction_date: editDate.toISOString().split('T')[0],
    });
    setIsSaving(false);
    if (res.success) {
      setShowEdit(false);
      Alert.alert('Updated', 'Transaction has been updated.');
    } else {
      Alert.alert('Error', res.error ?? 'Failed to update.');
    }
  };

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
          },
        },
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
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openEdit} style={styles.editButton}>
            <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
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
            {isIncome ? '+' : '-'}
            {formatCurrency(tx.amount)}
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
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border },
          ]}
        >
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

      {/* ── Edit Modal ─────────────────────────────── */}
      <Modal visible={showEdit} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Transaction</Text>

            {/* Amount */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
                },
              ]}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />

            {/* Note */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NOTE</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
                },
              ]}
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Optional note…"
              placeholderTextColor={colors.textMuted}
            />

            {/* Date */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DATE</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.text, fontSize: 15 }}>
                {editDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) setEditDate(d);
                }}
              />
            )}

            {/* Buttons */}
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                onPress={() => setShowEdit(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isSaving}
                style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerActions: { flexDirection: 'row', gap: 4 },
  editButton: { padding: 8 },
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
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 15, fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  // Edit modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 4 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 4 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 4 },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
