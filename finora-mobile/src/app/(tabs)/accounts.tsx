import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { Card } from '@/components/ui';
import { useTransactionStore } from '@/store/transactionStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const accountTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  bank: 'business-outline',
  wallet: 'wallet-outline',
  investment: 'trending-up-outline',
};

const accountTypeColors: Record<string, string> = {
  cash: COLORS.accent,
  bank: COLORS.primary,
  wallet: '#8B5CF6',
  investment: '#F59E0B',
};

export default function AccountsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const accounts = useTransactionStore((state) => state.accounts);
  
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  return (
    <ScreenWrapper>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>

        {/* Net Worth */}
        <Card
          style={[styles.netWorthCard, { borderColor: `${COLORS.primary}30` }]}
          elevated
          padding={20}
        >
          <Text style={[styles.netWorthLabel, { color: colors.textSecondary }]}>
            Net Worth
          </Text>
          <Text style={[styles.netWorthValue, { color: COLORS.primary }]}>
            {formatCurrency(totalBalance)}
          </Text>
          <Text style={[styles.netWorthSub, { color: colors.textMuted }]}>
            Across {accounts.length} accounts
          </Text>
        </Card>

        {/* Accounts List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          All Accounts
        </Text>

        {accounts.map((account) => {
          const iconColor = accountTypeColors[account.type] ?? COLORS.primary;
          const icon = accountTypeIcons[account.type] ?? 'wallet-outline';

          return (
            <TouchableOpacity key={account.id} activeOpacity={0.8}>
              <Card
                style={styles.accountCard}
                elevated
              >
                <View style={[styles.accountIcon, { backgroundColor: `${iconColor}18` }]}>
                  <Ionicons name={icon} size={22} color={iconColor} />
                </View>

                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {account.name}
                  </Text>
                  <Text
                    style={[styles.accountType, { color: colors.textMuted }]}
                  >
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </Text>
                </View>

                <View style={styles.accountRight}>
                  <Text style={[styles.accountBalance, { color: colors.text }]}>
                    {formatCurrency(account.balance)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textMuted}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Add Account */}
        <TouchableOpacity
          onPress={() => router.push('/add-account')}
          style={[
            styles.addAccount,
            {
              borderColor: isDark ? COLORS.dark.border : COLORS.light.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.addIcon, { backgroundColor: COLORS.primaryMuted }]}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.addLabel, { color: COLORS.primary }]}>
            Add Account
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  netWorthCard: {
    gap: 4,
    borderWidth: 1.5,
  },
  netWorthLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  netWorthValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 4,
  },
  netWorthSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  accountType: {
    fontSize: 12,
    fontWeight: '400',
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  addAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
