import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useINCoinsStore } from '../../store/incoinsStore';
import { computeRewardsInsights } from '../../utils/rewardsInsights';
import { RewardsCard } from '../RewardsCard';
import { walletStyles as s } from './walletStyles';

export function CustomerRewardsSummary() {
  const router = useRouter();
  const { balance, transactions, loading, balanceError, historyError, refresh } = useINCoinsStore();
  const totalEarned = transactions.reduce((sum, item) => sum + Math.max(0, item.coins), 0);
  const stats = balance ? {
    ...computeRewardsInsights(transactions.map(item => ({ points: item.coins, createdAt: item.created }))),
    balance: balance.inCoins,
    totalEarned,
    transactionCount: transactions.length,
    averagePoints: transactions.length ? Math.round(totalEarned / transactions.length) : 0,
  } : null;
  const openRewards = () => router.push({ pathname: '/rewards', params: { from: 'customer' } });
  return <View>
    <RewardsCard stats={stats} loading={loading} error={!!balanceError || !!historyError}
      onOpen={openRewards} onRedeem={openRewards}
      onHistory={() => router.push('/incoins-history')} testIDPrefix="customer-rewards" />
    {!!(balanceError || historyError) && <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <Text style={s.error}>{balanceError || historyError}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.button} disabled={loading} onPress={() => void refresh()}><Text style={s.buttonText}>Retry rewards</Text></TouchableOpacity>
    </View>}
  </View>;
}
