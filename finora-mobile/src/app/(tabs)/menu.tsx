import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailySummary, cancelAllNotifications } from '@/lib/notifications';
import { ScreenWrapper } from '@/components/ScreenWrapper';

type ThemeMode = 'system' | 'light' | 'dark';

export default function MenuScreen() {
  const { colors, isDark } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user, signOut, isLoading } = useAuthStore();
  const router = useRouter();
  const [dailyReminder, setDailyReminder] = useState(false);

  // Load saved preference
  React.useEffect(() => {
    AsyncStorage.getItem('finora_daily_reminder').then(val => {
      setDailyReminder(val === 'true');
    });
  }, []);

  const avatarLetter = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? '?';

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User';
  const email = user?.email ?? '';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const toggleDailyReminder = async (value: boolean) => {
    setDailyReminder(value);
    await AsyncStorage.setItem('finora_daily_reminder', String(value));
    if (value) {
      await scheduleDailySummary();
    } else {
      await cancelAllNotifications();
    }
  };

  const themeOptions: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { id: 'light', label: 'Light', icon: 'sunny-outline' },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  type MenuRow = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sublabel: string;
    color: string;
    onPress: () => void;
  };

  const featureRows: MenuRow[] = [
    {
      icon: 'pie-chart-outline',
      label: 'Stats & Analytics',
      sublabel: 'View spending breakdown',
      color: COLORS.primary,
      onPress: () => router.push('/analytics'),
    },
    {
      icon: 'layers-outline' as const,
      label: 'Funds',
      sublabel: 'Manage your savings goals',
      color: '#10B981',
      onPress: () => router.push('/funds'),
    },
    {
      icon: 'grid-outline',
      label: 'Categories',
      sublabel: 'Manage income & expense categories',
      color: '#F59E0B',
      onPress: () => router.push('/categories'),
    },
  ];

  const supportRows: MenuRow[] = [
    {
      icon: 'lock-closed-outline',
      label: 'Privacy & Security',
      sublabel: 'Manage your data',
      color: '#8B5CF6',
      onPress: () => router.push('/privacy-security'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      sublabel: 'FAQs and contact',
      color: '#F59E0B',
      onPress: () => router.push('/help-support'),
    },
  ];

  return (
    <ScreenWrapper>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Menu</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.avatarCard, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${COLORS.primary}20` }]}>
            <Text style={[styles.avatarLetter, { color: COLORS.primary }]}>{avatarLetter}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            style={[styles.editBtn, { backgroundColor: `${COLORS.primary}18` }]}
          >
            <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* App Features */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APP FEATURES</Text>
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          {featureRows.map((row, i) => (
            <View key={row.label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIcon, { backgroundColor: `${row.color}18` }]}>
                  <Ionicons name={row.icon} size={18} color={row.color} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{row.label}</Text>
                  <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>{row.sublabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          
          {/* Daily Reminder */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: `${COLORS.primary}18` }]}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Spending Reminder</Text>
              <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>Get a check-in at 8 PM every day</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={toggleDailyReminder}
              trackColor={{ false: '#D1D5DB', true: `${COLORS.primary}60` }}
              thumbColor={dailyReminder ? COLORS.primary : '#F3F4F6'}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Theme */}
          <View style={{ paddingTop: 8 }}>
            <Text style={[styles.cardLabel, { color: colors.text, marginBottom: 12 }]}>Theme</Text>
            <View style={styles.themeRow}>
              {themeOptions.map((opt, i) => {
                const active = mode === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setMode(opt.id)}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: active
                          ? `${COLORS.primary}18`
                          : (isDark ? COLORS.dark.bgMuted : COLORS.light.bgMuted),
                        borderColor: active ? COLORS.primary : 'transparent',
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={active ? COLORS.primary : colors.textMuted}
                    />
                    <Text style={[styles.themeBtnLabel, { color: active ? COLORS.primary : colors.textSecondary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Support & Security */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT & SECURITY</Text>
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF', borderColor: colors.border }]}>
          {supportRows.map((row, i) => (
            <View key={row.label}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity
                style={styles.settingRow}
                onPress={row.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIcon, { backgroundColor: `${row.color}18` }]}>
                  <Ionicons name={row.icon} size={18} color={row.color} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{row.label}</Text>
                  <Text style={[styles.settingSubLabel, { color: colors.textMuted }]}>{row.sublabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: `${COLORS.danger}40`, backgroundColor: `${COLORS.danger}0a` }]}
          activeOpacity={0.75}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={[styles.signOutText, { color: COLORS.danger }]}>
            {isLoading ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>Finora v1.0.0</Text>

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  header: { marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
  },
  avatarInfo: { flex: 1 },
  editBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  displayName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: { height: 1, marginVertical: 4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSubLabel: { fontSize: 12, marginTop: 1 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 4,
  },
});
