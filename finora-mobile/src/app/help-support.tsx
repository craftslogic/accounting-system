import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { ScreenWrapper } from '@/components/ScreenWrapper';

const FAQS = [
  {
    q: 'How do I add a transaction?',
    a: 'Tap the + button in the centre of the bottom navigation bar. Choose Income, Expense, or Transfer, fill in the amount and details, then tap Save.',
  },
  {
    q: 'Can I delete a transaction?',
    a: 'Yes — long-press any transaction row to get a delete confirmation, or open the transaction detail and tap the trash icon.',
  },
  {
    q: 'What are Funds?',
    a: 'Funds are virtual savings buckets. You set a goal amount, then allocate money into the fund. The balance is deducted from your available balance on the home screen.',
  },
  {
    q: 'How does dark mode work?',
    a: 'Go to Profile → Theme and select Light, Dark, or System. Your choice is saved and persists across app restarts.',
  },
  {
    q: 'My balance looks wrong — why?',
    a: 'Your available balance = total account balances minus total reserved in funds. Check your accounts and fund balances for discrepancies.',
  },
];

export default function HelpSupportScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <ScreenWrapper withBottomInset>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: `${COLORS.primary}12` }]}>
          <Ionicons name="help-buoy-outline" size={40} color={COLORS.primary} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>How can we help?</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Find answers below or reach out directly.
          </Text>
        </View>

        {/* Contact */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT US</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:support@finora.app')}
          style={[styles.contactCard, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF', borderColor: colors.border }]}
        >
          <View style={[styles.contactIcon, { backgroundColor: `${COLORS.primary}18` }]}>
            <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: colors.text }]}>Email Support</Text>
            <Text style={[styles.contactSub, { color: colors.textMuted }]}>support@finora.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED</Text>
        {FAQS.map((faq, i) => (
          <FAQ key={i} q={faq.q} a={faq.a} colors={colors} isDark={isDark} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function FAQ({ q, a, colors, isDark }: { q: string; a: string; colors: any; isDark: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen(!open)}
      style={[styles.faq, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFF', borderColor: colors.border }]}
      activeOpacity={0.8}
    >
      <View style={styles.faqRow}>
        <Text style={[styles.faqQ, { color: colors.text, flex: 1 }]}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </View>
      {open && <Text style={[styles.faqA, { color: colors.textSecondary }]}>{a}</Text>}
    </TouchableOpacity>
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
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12, marginBottom: 24 },
  contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 15, fontWeight: '600' },
  contactSub: { fontSize: 12, marginTop: 2 },
  faq: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 20, marginTop: 10 },
});
