import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { usePeopleStore } from '@/store/peopleStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const { contacts, balances, addBalance, clearBalances } = usePeopleStore();
  const contact = contacts.find(c => c.id === id);
  const contactBalances = balances.filter(b => b.contact_id === id);

  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!contact) {
    return (
      <ScreenWrapper withBottomInset>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={{ color: colors.textSecondary }}>Contact not found.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  let totalPayable = 0;
  let totalReceivable = 0;
  contactBalances.forEach(b => {
    if (b.type === 'payable') totalPayable += b.amount;
    else totalReceivable += b.amount;
  });
  const netBalance = totalReceivable - totalPayable;
  const isNeutral = netBalance === 0;
  const isPositive = netBalance > 0;
  const balColor = isNeutral ? colors.textMuted : (isPositive ? COLORS.success : COLORS.danger);

  const openModal = (t: 'payable' | 'receivable') => {
    setType(t);
    setAmount('');
    setNote('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setIsSaving(true);
    const res = await addBalance(contact.id, type, amt, note.trim());
    setIsSaving(false);
    if (res.success) setShowModal(false);
    else Alert.alert('Error', res.error ?? 'Failed to add record.');
  };

  const handleClear = () => {
    if (isNeutral) return;
    Alert.alert(
      'Clear Balances',
      `Are you sure you want to settle all balances with ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settle Up', 
          style: 'destructive',
          onPress: async () => {
            const res = await clearBalances(contact.id);
            if (!res.success) Alert.alert('Error', res.error ?? 'Failed to clear balances.');
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{contact.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: `${COLORS.primary}15` }]}>
            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 32 }}>{contact.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.netBalance, { color: balColor }]}>
            {isNeutral ? 'Settled up' : `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(netBalance))}`}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isNeutral ? 'No outstanding balances' : (isPositive ? `${contact.name} owes you` : `You owe ${contact.name}`)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openModal('payable')} style={[styles.actionBtn, { backgroundColor: `${COLORS.danger}15` }]}>
            <Ionicons name="arrow-down-outline" size={20} color={COLORS.danger} />
            <Text style={[styles.actionText, { color: COLORS.danger }]}>You Borrowed</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openModal('receivable')} style={[styles.actionBtn, { backgroundColor: `${COLORS.success}15` }]}>
            <Ionicons name="arrow-up-outline" size={20} color={COLORS.success} />
            <Text style={[styles.actionText, { color: COLORS.success }]}>You Lent</Text>
          </TouchableOpacity>
        </View>

        {!isNeutral && (
          <TouchableOpacity onPress={handleClear} style={[styles.settleBtn, { borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
            <Text style={[styles.settleText, { color: colors.text }]}>Settle All Balances</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>History</Text>
        
        {contactBalances.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={{ color: colors.textMuted }}>No records found.</Text>
          </View>
        ) : (
          <View style={[styles.historyCard, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
            {contactBalances.map((b, i) => {
              const isRec = b.type === 'receivable';
              return (
                <View key={b.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.historyRow}>
                    <View style={styles.histInfo}>
                      <Text style={[styles.histType, { color: colors.text }]}>{isRec ? 'Lent' : 'Borrowed'}</Text>
                      <Text style={[styles.histDate, { color: colors.textMuted }]}>
                        {new Date(b.transaction_date).toLocaleDateString()} {b.note ? `· ${b.note}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.histAmt, { color: isRec ? COLORS.success : COLORS.danger }]}>
                      {isRec ? '+' : '-'}{formatCurrency(b.amount)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.sheet, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {type === 'payable' ? 'Record Borrowed Money' : 'Record Lent Money'}
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>AMOUNT</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="What was this for?"
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.sheetBtns}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: type === 'payable' ? COLORS.danger : COLORS.success }]}>
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Record'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  netBalance: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  subtitle: { fontSize: 15, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14 },
  actionText: { fontWeight: '700', fontSize: 15 },
  settleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 32 },
  settleText: { fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  historyCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  histInfo: { gap: 2 },
  histType: { fontSize: 16, fontWeight: '600' },
  histDate: { fontSize: 13 },
  histAmt: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1 },
  emptyHistory: { paddingVertical: 20, alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
