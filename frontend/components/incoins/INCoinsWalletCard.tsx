import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useINCoinsStore } from '../../store/incoinsStore';
import { GradientSectionHeading } from '../GradientSectionHeading';
import { MerchantCardAccent, merchantCardSurface } from '../MerchantCardAccent';
import { ReferralRewardsCard } from './ReferralRewardsCard';
import { INCoinsHistoryList } from './INCoinsHistoryList';
import { walletStyles as s } from './walletStyles';
import { MerchantWalletSummary } from './MerchantWalletSummary';
import { CustomerRewardsSummary } from './CustomerRewardsSummary';
export function INCoinsWalletCard({ history = false, role }: { history?: boolean; role?: 'customer' | 'merchant' }) {
  const router = useRouter();
  const { user, token, isAuthenticated, isGuest } = useAuthStore();
  const { balance, loading, balanceError, refresh } = useINCoinsStore();
  const [showReferral, setShowReferral] = useState(true);
  useFocusEffect(useCallback(() => {
    if (isAuthenticated && !isGuest && user?.phone && token) void refresh();
  }, [refresh, user?.phone, token, isAuthenticated, isGuest]));
  if (!history && (role === 'merchant' || (!role && user?.userType === 'merchant'))) return <MerchantWalletSummary />;
  if (!history) return <CustomerRewardsSummary />;
  return <View style={[s.card, merchantCardSurface]} testID="incoins-wallet-card"><MerchantCardAccent />
    <GradientSectionHeading>My INCoins Wallet</GradientSectionHeading>
    <Text style={s.caption}>Available INCoins</Text>
    {loading && !balance ? <ActivityIndicator color="#FF7900" /> : <Text style={s.amount} testID="incoins-wallet-balance">{balance ? balance.inCoins.toFixed(2) : '—'}</Text>}
    {!!balance?.lastUpdated && <Text style={s.caption}>Last updated: {new Date(balance.lastUpdated).toLocaleString()}</Text>}
    {!!balanceError && <Text style={s.error}>{balanceError}</Text>}
    {(!isAuthenticated || isGuest || !token) && <Text style={s.copy}>Please sign in to view your INCoins wallet.</Text>}
    <View style={s.row}>
      <TouchableOpacity style={s.button} accessibilityRole="button" disabled={loading} onPress={() => void refresh()}><Text style={s.buttonText}>{loading ? 'Refreshing…' : balanceError ? 'Retry wallet' : 'Refresh'}</Text></TouchableOpacity>
      {!history && <TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => router.push('/incoins-history')}><Text style={s.buttonText}>View History</Text></TouchableOpacity>}
      <TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => setShowReferral(value => !value)}><Text style={s.buttonText}>Referral Rewards</Text></TouchableOpacity>
      {!history && <TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => router.push({ pathname: '/rewards', params: { from: role ?? (user?.userType === 'merchant' ? 'merchant' : 'customer') } })}><Text style={s.buttonText}>Check INCoins</Text></TouchableOpacity>}
    </View>
    {showReferral && <ReferralRewardsCard />}
    <View style={s.section}><GradientSectionHeading>{history ? 'INCoins History' : 'Recent INCoins Activity'}</GradientSectionHeading><INCoinsHistoryList limit={history ? undefined : 3} /></View>
    {!history && <TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => router.push('/incoins-history')}><Text style={s.buttonText}>View All Transactions</Text></TouchableOpacity>}
  </View>;
}
