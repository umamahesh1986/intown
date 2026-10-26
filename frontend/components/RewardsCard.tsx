import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tierFor, RewardsInsights } from '../utils/rewardsInsights';

export interface RewardsCardStats extends Partial<RewardsInsights> {
  totalEarned: number;
  transactionCount: number;
  averagePoints: number;
  balance?: number;
}

interface RewardsCardProps {
  stats: RewardsCardStats | null;
  loading?: boolean;
  error?: boolean;
  onOpen: () => void;
  onHistory: () => void;
  onRedeem: () => void;
  testIDPrefix?: string;
}

const fmt = (n: number | null | undefined) => (n == null ? '--' : Math.round(n).toLocaleString('en-IN'));

export const RewardsCard = ({ stats, loading, error, onOpen, onHistory, onRedeem, testIDPrefix = 'rewards' }: RewardsCardProps) => {
  const total = stats?.totalEarned ?? 0;
  const balance = stats?.balance ?? total;
  const { current, next } = tierFor(total);
  const progress = next ? Math.min(1, Math.max(0, (total - current.min) / (next.min - current.min))) : 1;
  const toGo = next ? Math.max(0, next.min - total) : 0;
  const unavailable = loading || error || !stats;

  const monthDelta =
    stats?.thisMonthEarned != null && stats?.lastMonthEarned != null && stats.lastMonthEarned > 0
      ? Math.round(((stats.thisMonthEarned - stats.lastMonthEarned) / stats.lastMonthEarned) * 100)
      : null;
  const yesterday = stats?.yesterdayEarned ?? null;

  return (
    <View style={styles.card} testID={`${testIDPrefix}-card`}>
      <TouchableOpacity style={styles.header} onPress={onOpen} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Open My Rewards" testID={`${testIDPrefix}-open`}>
        <Text style={styles.title}>My Rewards</Text>
        {!unavailable && (
          <View style={styles.tierPill} testID={`${testIDPrefix}-tier`}>
            <Ionicons name="star" size={11} color="#B36B00" />
            <Text style={styles.tierText}>{current.name} Tier</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <LinearGradient colors={['#FF7A00', '#FF9F2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
        <View style={styles.balanceGlow} />
        <View style={{ flex: 1 }}>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <View style={styles.liveDot} />
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue} testID={`${testIDPrefix}-balance`}>{loading ? '…' : error ? '--' : fmt(balance)}</Text>
            <Text style={styles.balanceUnit}>INPoints</Text>
          </View>
          <Text style={styles.balanceSub}>≈ ₹{unavailable ? '--' : balance.toFixed(2)} Cashback Value</Text>
        </View>
        <TouchableOpacity style={styles.redeemBtn} onPress={onRedeem} disabled={unavailable} activeOpacity={0.85} testID={`${testIDPrefix}-redeem`}>
          <Text style={styles.redeemText}>Redeem</Text>
          <Ionicons name="arrow-forward" size={14} color="#FF7A00" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons name="trending-up-outline" size={18} color="#FF8C00" />
          </View>
          <Text style={styles.metricValue}>{unavailable ? '--' : fmt(total)}</Text>
          <Text style={styles.metricLabel}>Total earned</Text>
          <Text style={[styles.metricHint, monthDelta != null && monthDelta < 0 && styles.metricHintNeg]}>
            {monthDelta == null ? `${fmt(stats?.transactionCount)} transactions` : `${monthDelta >= 0 ? '+' : ''}${monthDelta}% mo`}
          </Text>
        </View>
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons name="sparkles-outline" size={18} color="#FF8C00" />
          </View>
          <Text style={styles.metricValue}>{unavailable ? '--' : fmt(stats?.averagePoints)}</Text>
          <Text style={styles.metricLabel}>Avg. points</Text>
          <Text style={[styles.metricHint, styles.metricHintOrange]}>Per spend</Text>
        </View>
      </View>

      <View style={styles.goal} testID={`${testIDPrefix}-goal`}>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>
            Goal: <Text style={styles.goalTier}>{next ? `${next.name} Tier` : 'Top tier reached'}</Text>
          </Text>
          <Text style={styles.goalToGo}>{next ? `${toGo} pts to go` : '🎉'}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.goalRow}>
          <Text style={styles.goalMeta}>{fmt(total)} earned</Text>
          {next && <Text style={styles.goalMeta}>{next.min} pts target</Text>}
        </View>
      </View>

      <TouchableOpacity style={styles.history} onPress={onHistory} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Open INPoints history" testID={`${testIDPrefix}-history`}>
        <View style={styles.historyIcon}>
          <Ionicons name="time-outline" size={18} color="#FF8C00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.historyTitle}>INPoints History</Text>
          <Text style={styles.historySub}>View points earned & claimed</Text>
        </View>
        {yesterday != null && yesterday > 0 && (
          <View style={styles.yesterdayPill}>
            <Text style={styles.yesterdayText}>+{fmt(yesterday)} pts yesterday</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color="#9AA3B2" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  tierText: { fontSize: 11.5, fontWeight: '800', color: '#B36B00' },
  chevron: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  balance: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, overflow: 'hidden' },
  balanceGlow: { position: 'absolute', right: -30, top: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.14)' },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceLabel: { color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '800', letterSpacing: 0.9 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFE08A' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  balanceValue: { color: '#FFF', fontSize: 34, fontWeight: '900', lineHeight: 38 },
  balanceUnit: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  balanceSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, marginLeft: 10 },
  redeemText: { color: '#FF7A00', fontSize: 14, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  metric: { flex: 1, backgroundColor: '#FFF9F2', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FFEBD6' },
  metricIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF1E0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  metricHint: { fontSize: 11.5, fontWeight: '700', color: '#2E7D32', marginTop: 6 },
  metricHintNeg: { color: '#C62828' },
  metricHintOrange: { color: '#FF8C00' },
  goal: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { fontSize: 13.5, color: '#1A1A1A', fontWeight: '600' },
  goalTier: { fontWeight: '800' },
  goalToGo: { fontSize: 13, color: '#FF8C00', fontWeight: '800' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#F0F2F5', marginVertical: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: '#FF8C00' },
  goalMeta: { fontSize: 11.5, color: '#8A94A6' },
  history: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  historyIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF1E0', alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  historySub: { fontSize: 11.5, color: '#8A94A6', marginTop: 1 },
  yesterdayPill: { backgroundColor: '#E8F5E9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  yesterdayText: { fontSize: 11, fontWeight: '800', color: '#2E7D32' },
});
