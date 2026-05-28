import React, { useState } from 'react';
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
import { ScreenWrapper } from '@/components/ScreenWrapper';

const ACCOUNT_TYPES = [
  { id: 'bank', label: 'Bank Account', icon: 'business-outline' as const },
  { id: 'cash', label: 'Cash', icon: 'cash-outline' as const },
  { id: 'wallet', label: 'Mobile Wallet', icon: 'wallet-outline' as const },
  { id: 'investment', label: 'Investment', icon: 'trending-up-outline' as const },
];

export default function AddAccountScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { addAccount } = useTransactionStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [currency, setCurrency] = useState('PKR');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter an account name.');
      return;
    }

    setIsSaving(true);
    const result = await addAccount({
      name: name.trim(),
      type,
      currency,
    });
    setIsSaving(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error ?? 'Failed to create account.');
    }
  };

  return (
    <ScreenWrapper withBottomInset>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Account</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Account Name */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>ACCOUNT NAME</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Meezan Bank"
            leftIcon="business-outline"
            maxLength={50}
          />

          {/* Account Type */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>ACCOUNT TYPE</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map((t) => {
              const active = type === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setType(t.id)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: active ? `${COLORS.primary}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                      borderColor: active ? COLORS.primary : 'transparent',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon} size={20} color={active ? COLORS.primary : colors.textMuted} />
                  <Text style={[styles.typeBtnLabel, { color: active ? COLORS.primary : colors.textSecondary }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Currency */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>CURRENCY</Text>
          <Input
            value={currency}
            onChangeText={setCurrency}
            placeholder="e.g. PKR"
            leftIcon="cash-outline"
            maxLength={3}
            autoCapitalize="characters"
          />

          {/* Save Button */}
          <Button
            onPress={handleSave}
            loading={isSaving}
            style={{ marginTop: 32 }}
          >
            Create Account
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  typeBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
