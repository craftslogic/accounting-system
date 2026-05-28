import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const PRIVACY_SECTIONS = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Data Storage',
    body: 'All your financial data is stored securely in Supabase with row-level security. Only you can access your records — not even the app team can read your transactions.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Authentication',
    body: 'We use Google OAuth managed by Supabase Auth. We never store your Google password. Sessions are secured with short-lived JWT tokens.',
  },
  {
    icon: 'eye-off-outline' as const,
    title: 'No Ads or Tracking',
    body: 'Finora does not run ads and does not sell your data to third parties. We do not use any third-party analytics SDKs.',
  },
  {
    icon: 'trash-outline' as const,
    title: 'Data Deletion',
    body: 'You can request full deletion of your account and all associated data at any time by contacting support@finora.app.',
  },
];

export default function PrivacySecurityScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.\n\nPlease email support@finora.app to complete account deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => {} },
      ]
    );
  };

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: `${'#8B5CF6'}12` }]}>
          <Ionicons name="shield-checkmark-outline" size={40} color="#8B5CF6" />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Your privacy matters</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Here's how Finora handles and protects your data.
          </Text>
        </View>

        {/* Privacy sections */}
        {PRIVACY_SECTIONS.map((s, i) => (
          <View
            key={i}
            style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF', borderColor: colors.border }]}
          >
            <View style={[styles.cardIcon, { backgroundColor: `${'#8B5CF6'}18` }]}>
              <Ionicons name={s.icon} size={22} color="#8B5CF6" />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{s.title}</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary }]}>{s.body}</Text>
            </View>
          </View>
        ))}

        {/* Danger zone */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DANGER ZONE</Text>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[styles.dangerBtn, { borderColor: `${COLORS.danger}40`, backgroundColor: `${COLORS.danger}08` }]}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={[styles.dangerText, { color: COLORS.danger }]}>Delete My Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20 },
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24 },
  heroTitle: { fontSize: 20, fontWeight: '800' },
  heroSub: { fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, alignItems: 'flex-start' },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardText: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  dangerText: { fontSize: 15, fontWeight: '700' },
});
