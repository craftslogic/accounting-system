import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useFundStore } from '@/store/fundStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const FUND_TYPES = [
  { id: 'savings', label: 'Savings', icon: 'save-outline' as const },
  { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' as const },
  { id: 'vacation', label: 'Vacation', icon: 'airplane-outline' as const },
  { id: 'investment', label: 'Investment', icon: 'trending-up-outline' as const },
  { id: 'education', label: 'Education', icon: 'school-outline' as const },
  { id: 'custom', label: 'Custom', icon: 'ellipsis-horizontal-outline' as const },
];

const COLORS_LIST = [
  '#208AEF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const ICONS_LIST: Array<keyof typeof Ionicons.glyphMap> = [
  'wallet-outline', 'home-outline', 'car-outline', 'airplane-outline',
  'school-outline', 'medkit-outline', 'game-controller-outline',
  'gift-outline', 'heart-outline', 'star-outline',
];

export default function CreateFundScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { createFund } = useFundStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS_LIST[0]);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('wallet-outline');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a fund name.');
      return;
    }

    setIsSaving(true);
    const res = await createFund({
      name: name.trim(),
      type,
      target_amount: targetAmount ? parseFloat(targetAmount) : undefined,
      initial_balance: initialBalance ? parseFloat(initialBalance) : undefined,
      color: selectedColor,
      icon: selectedIcon,
      description: description.trim() || undefined,
    });
    setIsSaving(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert('Error', res.error ?? 'Failed to create fund.');
    }
  };

  return (
    <ScreenWrapper withBottomInset>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Fund</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Preview icon */}
          <View style={styles.preview}>
            <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
              <Ionicons name={selectedIcon} size={40} color={selectedColor} />
            </View>
            <Text style={[styles.previewName, { color: colors.text }]}>{name || 'Fund Name'}</Text>
          </View>

          <Label text="FUND NAME" colors={colors} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
            placeholder="e.g. Emergency Fund"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Label text="FUND TYPE" colors={colors} />
          <View style={styles.typeGrid}>
            {FUND_TYPES.map(t => {
              const active = type === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setType(t.id)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: active ? `${selectedColor}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                      borderColor: active ? selectedColor : 'transparent',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon} size={18} color={active ? selectedColor : colors.textMuted} />
                  <Text style={[styles.typeBtnLabel, { color: active ? selectedColor : colors.textSecondary }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label text="TARGET AMOUNT (optional)" colors={colors} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
            placeholder="e.g. 100000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />

          <Label text="OPENING BALANCE (optional)" colors={colors} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
            placeholder="e.g. 50000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={initialBalance}
            onChangeText={setInitialBalance}
          />
          <Text style={[styles.hint, { color: colors.textMuted, marginTop: -12, marginBottom: 16, fontSize: 12, marginLeft: 2 }]}>
            Enter the amount already available before using Finora.
          </Text>

          <Label text="COLOR" colors={colors} />
          <View style={styles.colorRow}>
            {COLORS_LIST.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorSwatchActive,
                ]}
              >
                {selectedColor === c && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </View>

          <Label text="ICON" colors={colors} />
          <View style={styles.iconGrid}>
            {ICONS_LIST.map(ic => {
              const active = selectedIcon === ic;
              return (
                <TouchableOpacity
                  key={ic}
                  onPress={() => setSelectedIcon(ic)}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: active ? `${selectedColor}18` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                      borderColor: active ? selectedColor : 'transparent',
                    },
                  ]}
                >
                  <Ionicons name={ic} size={22} color={active ? selectedColor : colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Label text="DESCRIPTION (optional)" colors={colors} />
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
            placeholder="What is this fund for?"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSaving}
            style={[styles.createBtn, { backgroundColor: selectedColor }]}
          >
            <Text style={styles.createBtnText}>{isSaving ? 'Creating…' : 'Create Fund'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Label({ text, colors }: { text: string; colors: any }) {
  return (
    <Text style={[styles.label, { color: colors.textSecondary }]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  preview: { alignItems: 'center', marginBottom: 24, gap: 10 },
  previewIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeBtn: {
    width: '30%', flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1.5,
  },
  typeBtnLabel: { fontSize: 12, fontWeight: '600' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorSwatch: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  colorSwatchActive: { transform: [{ scale: 1.15 }] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  iconBtn: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  createBtn: {
    padding: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
