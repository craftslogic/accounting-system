import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { COLORS } from '@/constants/colors';
import { useFundStore } from '@/store/fundStore';
import { ScreenWrapper } from '@/components/ScreenWrapper';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function FundsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { funds, isLoading, fetchFunds, getTotalReserved } = useFundStore();

  useEffect(() => { fetchFunds(); }, []);

  const totalReserved = getTotalReserved();

  return (
    <ScreenWrapper withBottomInset>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Funds</Text>
        <TouchableOpacity
          onPress={() => router.push('/create-fund')}
          style={[styles.addBtn, { backgroundColor: `${COLORS.primary}18` }]}
        >
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats banner */}
      <View style={[styles.statsBanner, { backgroundColor: isDark ? COLORS.dark.bgCard : COLORS.primary }]}>
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>Total Reserved</Text>
          <Text style={styles.statsValue}>{formatCurrency(totalReserved)}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Text style={styles.statsLabel}>Active Funds</Text>
          <Text style={styles.statsValue}>{funds.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchFunds} tintColor={COLORS.primary} />
        }
      >
        {/* Loading */}
        {isLoading && funds.length === 0 && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}

        {/* Empty */}
        {!isLoading && funds.length === 0 && (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: `${COLORS.primary}18` }]}>
              <Ionicons name="wallet-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No funds yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create your first fund to start saving towards a goal
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/create-fund')}
              style={[styles.emptyBtn, { backgroundColor: COLORS.primary }]}
            >
              <Text style={styles.emptyBtnText}>Create Fund</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fund cards */}
        {funds.map((fund) => (
          <TouchableOpacity
            key={fund.id}
            onPress={() => router.push(`/fund/${fund.id}`)}
            activeOpacity={0.8}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? COLORS.dark.bgCard : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={[styles.fundIcon, { backgroundColor: `${fund.color}20` }]}>
                <Ionicons name={fund.icon as any} size={22} color={fund.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.fundName, { color: colors.text }]}>{fund.name}</Text>
                <Text style={[styles.fundType, { color: colors.textMuted }]}>
                  {fund.type.charAt(0).toUpperCase() + fund.type.slice(1)}
                </Text>
              </View>
              <View style={styles.cardAmounts}>
                <Text style={[styles.fundCurrent, { color: fund.color }]}>
                  {formatCurrency(fund.current_amount)}
                </Text>
                {fund.target_amount !== null && (
                  <Text style={[styles.fundTarget, { color: colors.textMuted }]}>
                    of {formatCurrency(fund.target_amount)}
                  </Text>
                )}
              </View>
            </View>

            {/* Progress bar */}
            {fund.target_amount !== null && (
              <View style={styles.progressRow}>
                <View style={[styles.progressBg, { backgroundColor: `${fund.color}20` }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${fund.progress_percentage}%`, backgroundColor: fund.color },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPct, { color: colors.textMuted }]}>
                  {fund.progress_percentage}%
                </Text>
              </View>
            )}

            {/* Description */}
            {fund.description && (
              <Text style={[styles.fundDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                {fund.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statsBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsItem: { flex: 1, alignItems: 'center', gap: 4 },
  statsLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  statsValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fundIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  fundName: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  fundType: { fontSize: 12 },
  cardAmounts: { alignItems: 'flex-end', gap: 2 },
  fundCurrent: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  fundTarget: { fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'right' },
  fundDesc: { fontSize: 13 },
});
