import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { usePeopleStore } from '@/store/peopleStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const PRESET_TYPES = ['friend', 'family', 'client', 'colleague'] as const;

export default function PeopleScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { contacts, balances, isLoading, fetchContacts, fetchBalances, addContact } = usePeopleStore();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  // 'custom' means user chose "Other"
  const [type, setType] = useState<string>('friend');
  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchBalances();
  }, []);

  const onRefresh = () => {
    fetchContacts();
    fetchBalances();
  };

  const openModal = () => {
    setName('');
    setType('friend');
    setIsCustom(false);
    setCustomType('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a name.');
      return;
    }
    const finalType = isCustom ? (customType.trim() || 'other') : type;
    setIsSaving(true);
    const res = await addContact(name.trim(), finalType);
    setIsSaving(false);
    if (res.success) {
      setShowModal(false);
    } else {
      Alert.alert('Error', res.error ?? 'Failed to add contact.');
    }
  };

  // Compute stats
  const { totalPayable, totalReceivable, contactsWithBal } = useMemo(() => {
    let tp = 0;
    let tr = 0;
    const cMap = new Map();

    contacts.forEach(c => {
      cMap.set(c.id, { ...c, total_payable: 0, total_receivable: 0, balance: 0 });
    });

    balances.forEach(b => {
      const c = cMap.get(b.contact_id);
      if (c) {
        if (b.type === 'payable' || b.type === 'opening_payable') {
          c.total_payable += b.amount;
          c.balance -= b.amount;
          tp += b.amount;
        } else if (b.type === 'receivable' || b.type === 'opening_receivable') {
          c.total_receivable += b.amount;
          c.balance += b.amount;
          tr += b.amount;
        }
      }
    });

    return {
      totalPayable: tp,
      totalReceivable: tr,
      contactsWithBal: Array.from(cMap.values()),
    };
  }, [contacts, balances]);

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>People</Text>
        <TouchableOpacity onPress={openModal} style={[styles.addBtn, { backgroundColor: `${COLORS.primary}18` }]}>
          <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBanner, { backgroundColor: isDark ? COLORS.dark.bgCard : COLORS.primary }]}>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>You Owe (Payable)</Text>
          <Text style={[styles.statsValue, { color: '#EF4444' }]}>{formatCurrency(totalPayable)}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>You are Owed (Receivable)</Text>
          <Text style={[styles.statsValue, { color: '#10B981' }]}>{formatCurrency(totalReceivable)}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {contactsWithBal.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: `${COLORS.primary}18` }]}>
              <Ionicons name="people-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No people added</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add contacts to track shared expenses, loans, and IOUs.
            </Text>
            <TouchableOpacity onPress={openModal} style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.emptyBtnText}>Add Person</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contactsWithBal.map(c => {
            const isNeutral = c.balance === 0;
            const isPositive = c.balance > 0;
            const balColor = isNeutral ? colors.textMuted : (isPositive ? COLORS.success : COLORS.danger);

            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => router.push(`/contact/${c.id}`)}
                activeOpacity={0.8}
                style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.avatar, { backgroundColor: `${COLORS.primary}15` }]}>
                    <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 18 }}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>{c.name}</Text>
                    <Text style={[styles.contactType, { color: colors.textMuted }]}>{c.type.charAt(0).toUpperCase() + c.type.slice(1)}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.balanceAmount, { color: balColor }]}>
                    {isNeutral ? 'Settled up' : `${isPositive ? 'Owes you' : 'You owe'} ${formatCurrency(Math.abs(c.balance))}`}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <View style={[styles.sheet, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Person</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>RELATIONSHIP</Text>
            <View style={styles.typeGrid}>
              {PRESET_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setType(t); setIsCustom(false); }}
                  style={[styles.typeBtn, {
                    backgroundColor: (!isCustom && type === t) ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                    borderColor: (!isCustom && type === t) ? COLORS.primary : 'transparent',
                  }]}
                >
                  <Text style={{ color: (!isCustom && type === t) ? COLORS.primary : colors.textMuted, fontWeight: (!isCustom && type === t) ? '700' : '500', fontSize: 13 }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Other / Custom */}
              <TouchableOpacity
                onPress={() => { setIsCustom(true); }}
                style={[styles.typeBtn, {
                  backgroundColor: isCustom ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                  borderColor: isCustom ? COLORS.primary : 'transparent',
                }]}
              >
                <Text style={{ color: isCustom ? COLORS.primary : colors.textMuted, fontWeight: isCustom ? '700' : '500', fontSize: 13 }}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom relationship input – shown only when "Other" is selected */}
            {isCustom && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: 8 }]}>CUSTOM RELATIONSHIP</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: COLORS.primary, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
                  placeholder="e.g. Mentor, Business Partner…"
                  placeholderTextColor={colors.textMuted}
                  value={customType}
                  onChangeText={setCustomType}
                  autoFocus
                />
              </>
            )}

            <View style={styles.sheetBtns}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving} style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Add'}</Text>
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
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsBanner: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16 },
  statsItem: { flex: 1, alignItems: 'center', gap: 4 },
  statsLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  statsValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },
  scroll: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { gap: 2 },
  contactName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  contactType: { fontSize: 13 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  balanceAmount: { fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
