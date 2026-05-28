import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTransactionStore } from '@/store/transactionStore';
import type { Category } from '@/types';

type TxType = 'expense' | 'income' | 'transfer';

const TYPE_CONFIG = {
  expense: {
    label: 'Expense',
    color: COLORS.danger,
    bg: `${COLORS.danger}18`,
    icon: 'remove-circle' as const,
  },
  income: {
    label: 'Income',
    color: COLORS.accent,
    bg: `${COLORS.accent}18`,
    icon: 'add-circle' as const,
  },
  transfer: {
    label: 'Transfer',
    color: COLORS.primary,
    bg: `${COLORS.primary}18`,
    icon: 'swap-horizontal' as const,
  },
};

export default function AddScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { accounts, categories, fetchAll, addTransaction, isLoading } = useTransactionStore();

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedToAccountId, setSelectedToAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAll();
  }, []);

  // When accounts load, pre-select first
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  // When categories load or type changes, pre-select first matching category
  useEffect(() => {
    const filtered = categories.filter(c =>
      type === 'transfer' ? false : c.type === type
    );
    if (filtered.length > 0) setSelectedCategoryId(filtered[0].id);
    else setSelectedCategoryId('');
  }, [categories, type]);

  const filteredCategories = categories.filter(c =>
    type === 'transfer' ? false : c.type === type
  );

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('No Account', 'Please select an account.');
      return;
    }
    if (type === 'transfer' && !selectedToAccountId) {
      Alert.alert('No Destination', 'Please select a destination account.');
      return;
    }

    setIsSaving(true);
    const result = await addTransaction({
      type,
      amount: parsedAmount,
      account_id: selectedAccountId,
      to_account_id: type === 'transfer' ? selectedToAccountId : undefined,
      category_id: selectedCategoryId || undefined,
      note: note.trim() || undefined,
      transaction_date: today,
    });
    setIsSaving(false);

    if (result.success) {
      // Reset form
      setAmount('');
      setNote('');
      Alert.alert('✅ Saved!', 'Transaction added successfully.', [
        { text: 'Add Another' },
        { text: 'View Transactions', onPress: () => router.push('/(tabs)/transactions') },
      ]);
    } else {
      Alert.alert('Error', result.error ?? 'Failed to save transaction.');
    }
  };

  const cfg = TYPE_CONFIG[type];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Add Record</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Record income, expense or transfer
          </Text>

          {/* ── Type Selector ──────────────────────────── */}
          <View style={styles.typeRow}>
            {(Object.keys(TYPE_CONFIG) as TxType[]).map((t) => {
              const c = TYPE_CONFIG[t];
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: active ? c.bg : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                      borderColor: active ? c.color : 'transparent',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={c.icon} size={18} color={active ? c.color : colors.textMuted} />
                  <Text
                    style={[
                      styles.typeBtnLabel,
                      { color: active ? c.color : colors.textSecondary },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Amount ─────────────────────────────────── */}
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: cfg.color }]}>PKR</Text>
            <Text style={[styles.amountInput, { color: cfg.color }]}>
              {amount || '0'}
            </Text>
          </View>

          {/* Numpad */}
          <NumPad
            value={amount}
            onChange={setAmount}
            accentColor={cfg.color}
            isDark={isDark}
            colors={colors}
          />

          {/* ── Account Selector ───────────────────────── */}
          <SectionLabel label={type === 'transfer' ? 'From Account' : 'Account'} colors={colors} />
          {accounts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No accounts yet. Create one in the web app.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {accounts.map((acc) => {
                const active = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                        borderColor: active ? COLORS.primary : (isDark ? COLORS.dark.border : COLORS.light.border),
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipLabel, { color: active ? COLORS.primary : colors.textSecondary }]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* To Account (transfer only) */}
          {type === 'transfer' && (
            <>
              <SectionLabel label="To Account" colors={colors} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {accounts
                  .filter((a) => a.id !== selectedAccountId)
                  .map((acc) => {
                    const active = selectedToAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedToAccountId(acc.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                            borderColor: active ? COLORS.primary : (isDark ? COLORS.dark.border : COLORS.light.border),
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipLabel, { color: active ? COLORS.primary : colors.textSecondary }]}>
                          {acc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </>
          )}

          {/* ── Category (income/expense only) ─────────── */}
          {type !== 'transfer' && filteredCategories.length > 0 && (
            <>
              <SectionLabel label="Category" colors={colors} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {filteredCategories.map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.chip,
                        styles.catChip,
                        {
                          backgroundColor: active ? `${cat.color}22` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                          borderColor: active ? cat.color : (isDark ? COLORS.dark.border : COLORS.light.border),
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={active ? cat.color : colors.textMuted}
                      />
                      <Text style={[styles.chipLabel, { color: active ? cat.color : colors.textSecondary }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── Note ───────────────────────────────────── */}
          <SectionLabel label="Note (optional)" colors={colors} />
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Dinner at restaurant…"
            leftIcon="create-outline"
            maxLength={200}
          />

          {/* ── Save ───────────────────────────────────── */}
          <Button
            onPress={handleSave}
            loading={isSaving || isLoading}
            style={{ marginTop: 24, backgroundColor: cfg.color } as any}
          >
            Save {cfg.label}
          </Button>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[secLabelStyles.label, { color: colors.textSecondary }]}>
      {label}
    </Text>
  );
}

const secLabelStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 2,
  },
});

interface NumPadProps {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  isDark: boolean;
  colors: any;
}

function NumPad({ value, onChange, accentColor, isDark, colors }: NumPadProps) {
  const pad = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

  const press = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === '.' && value.includes('.')) {
      // Don't allow double dot
    } else if (key === '.' && value === '') {
      onChange('0.');
    } else {
      // Max 2 decimal places
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1].length >= 0 && key !== '.') {
          onChange(value + key);
        }
      } else {
        onChange(value + key);
      }
    }
  };

  return (
    <View style={numStyles.grid}>
      {pad.map((key) => (
        <TouchableOpacity
          key={key}
          onPress={() => press(key)}
          style={[
            numStyles.key,
            {
              backgroundColor: key === '⌫'
                ? (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted)
                : (isDark ? COLORS.dark.bgCard : '#FFFFFF'),
              borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[numStyles.keyLabel, { color: key === '⌫' ? accentColor : colors.text }]}>
            {key}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const numStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  key: {
    width: '30%',
    aspectRatio: 2.4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
});

// ─── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  typeBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  catChip: {
    gap: 5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  emptyBox: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
