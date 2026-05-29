import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const CATEGORY_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'fast-food-outline','car-outline','bag-outline','flash-outline','medkit-outline',
  'game-controller-outline','school-outline','briefcase-outline','laptop-outline',
  'home-outline','airplane-outline','gift-outline','heart-outline','cafe-outline',
  'fitness-outline','book-outline','musical-notes-outline','restaurant-outline',
];

const COLOR_OPTIONS = [
  '#F59E0B','#EF4444','#10B981','#3B82F6','#8B5CF6','#EC4899',
  '#06B6D4','#84CC16','#F97316','#6366F1','#14B8A6','#64748B',
];

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { categories, fetchCategories, addCategory } = useTransactionStore();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('fast-food-outline');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter(c => c.type === activeTab);

  const openModal = () => {
    setType(activeTab);
    setName('');
    setSelectedColor(COLOR_OPTIONS[0]);
    setSelectedIcon('fast-food-outline');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }
    setIsSaving(true);
    const res = await addCategory({ name: name.trim(), type, color: selectedColor, icon: selectedIcon });
    setIsSaving(false);
    if (res.success) {
      setShowModal(false);
    } else {
      Alert.alert('Error', res.error ?? 'Failed to create category.');
    }
  };

  return (
    <ScreenWrapper withBottomInset>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
        <TouchableOpacity onPress={openModal} style={[styles.addBtn, { backgroundColor: `${COLORS.primary}18` }]}>
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Type tabs */}
      <View style={[styles.tabs, { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}>
        {(['expense', 'income'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tab, activeTab === t && { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}
          >
            <Text style={[styles.tabText, { color: activeTab === t ? colors.text : colors.textMuted }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {filtered.map(cat => (
            <View
              key={cat.id}
              style={[styles.chip, {
                backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF',
                borderColor: colors.border,
              }]}
            >
              <View style={[styles.chipIcon, { backgroundColor: `${cat.color}20` }]}>
                <Ionicons name={cat.icon as any} size={20} color={cat.color} />
              </View>
              <Text style={[styles.chipName, { color: colors.text }]}>{cat.name}</Text>
            </View>
          ))}
        </View>
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No {activeTab} categories yet
            </Text>
            <TouchableOpacity onPress={openModal}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Add one →</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <View style={[styles.sheet, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>New Category</Text>

            {/* Type toggle */}
            <View style={[styles.typeTabs, { backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}>
              {(['expense', 'income'] as const).map(t => (
                <TouchableOpacity
                  key={t} onPress={() => setType(t)}
                  style={[styles.typeTab, type === t && { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF' }]}
                >
                  <Text style={{ color: type === t ? colors.text : colors.textMuted, fontWeight: '600', fontSize: 13 }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted }]}
              placeholder="e.g. Groceries"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c} onPress={() => setSelectedColor(c)}
                  style={[styles.swatch, { backgroundColor: c }, selectedColor === c && styles.swatchActive]}
                >
                  {selectedColor === c && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>ICON</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map(ic => (
                <TouchableOpacity
                  key={ic} onPress={() => setSelectedIcon(ic)}
                  style={[styles.iconBtn, {
                    backgroundColor: selectedIcon === ic ? `${selectedColor}20` : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                    borderColor: selectedIcon === ic ? selectedColor : 'transparent',
                  }]}
                >
                  <Ionicons name={ic} size={20} color={selectedIcon === ic ? selectedColor : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetBtns}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Create'}</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  chipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipName: { fontSize: 14, fontWeight: '600', flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  typeTabs: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 16 },
  typeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  swatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { transform: [{ scale: 1.15 }] },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
