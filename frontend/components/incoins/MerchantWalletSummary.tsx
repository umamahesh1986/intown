import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useINCoinsStore } from '../../store/incoinsStore';
import { referralShareMessage } from '../../utils/incoins';
import { MerchantCardAccent } from '../MerchantCardAccent';

export function MerchantWalletSummary() {
  const router = useRouter();
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const { balance, transactions, historyError, balanceError, loading, refresh } = useINCoinsStore();
  const now = new Date();
  const monthly = transactions.filter(item => {
    const date = new Date(item.created || '');
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && item.coins > 0;
  }).reduce((sum, item) => sum + item.coins, 0);
  const share = async () => {
    try { if (isAuthenticated && !isGuest && user?.phone) await Share.share({ message: referralShareMessage(user.phone) }); }
    catch { Alert.alert('Unable to share', 'Please try again.'); }
  };
  return <View style={s.wrap} testID="merchant-wallet-summary">
    <LinearGradient colors={['#0E192D', '#101A2D', '#38251F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
      <MerchantCardAccent />
      <View style={s.header}><View style={s.icon}><Ionicons name="wallet" color="#FFF" size={18} /></View><View style={s.copy}><Text style={s.title}>MERCHANT INCOINS WALLET</Text><Text style={s.subtitle}>Live Ledger &amp; Settlement</Text></View><View style={s.badge}><View style={s.dot} /><Text style={s.badgeText}>WALLET</Text></View></View>
      <View style={s.balancePanel}><View style={s.copy}><Text style={s.label}>AVAILABLE BALANCE</Text><View style={s.amountRow}>{loading && !balance ? <ActivityIndicator color="#FFB500" /> : <Text style={s.amount} testID="incoins-wallet-balance">{balance ? balance.inCoins.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}</Text>}<Text style={s.unit}>INCoins</Text></View></View><View style={s.right}>{!historyError && balance && <Text style={s.month}>+{monthly.toLocaleString('en-IN', { maximumFractionDigits: 2 })} this month</Text>}<Text style={s.sync}>{loading ? 'Syncing…' : balance ? 'Wallet synced' : 'Awaiting sync'}</Text></View></View>
      {!!balanceError && <TouchableOpacity accessibilityRole="button" onPress={() => void refresh()}><Text style={s.error}>{balanceError} Tap to retry.</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" testID="merchant-wallet-manage" onPress={() => router.push('/merchant-incoin-wallet')} activeOpacity={0.85}>
        <LinearGradient colors={['#FF8A00', '#FF5900']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.manage}><Text style={s.manageText}>View &amp; Manage Wallet <Text style={s.manageHint}>(Redeem, Refer &amp; History)</Text></Text><View style={s.arrow}><Ionicons name="chevron-forward" color="#FFF" size={15} /></View></LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
    <View style={s.referral}><MerchantCardAccent /><View style={s.referralIcon}><Text style={s.rupee}>₹</Text></View><View style={s.copy}><Text style={s.referralTitle}>Refer &amp; Earn INCoins</Text><Text style={s.referralSub}>Earn up to 1,000 INCoins per merchant referral</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Share referral number" testID="merchant-wallet-share" onPress={share} disabled={!isAuthenticated || isGuest} style={s.share}><Text style={s.shareText}>Share</Text></TouchableOpacity></View>
  </View>;
}
const s = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 16, gap: 16 },
  card: { overflow: 'hidden', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#263448', shadowColor: '#673C24', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, copy: { flex: 1, minWidth: 0 },
  icon: { backgroundColor: '#FF8A00', borderRadius: 12, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 12, fontWeight: '800' }, subtitle: { color: '#93B1D3', fontSize: 10, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#45351D', borderColor: '#8B5D10', borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 4 }, badgeText: { color: '#FFBB18', fontSize: 9, fontWeight: '800' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFBB18' },
  balancePanel: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 6 }, amountRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 5 }, amount: { color: '#FFF', fontSize: 23, fontWeight: '800' }, unit: { color: '#FFBD00', fontSize: 12, fontWeight: '700' },
  right: { alignItems: 'flex-end' }, month: { color: '#16C999', backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '700' }, sync: { color: '#94A3B8', fontSize: 9, marginTop: 5 },
  manage: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 6 }, manageText: { color: '#FFF', fontSize: 12, fontWeight: '800', flex: 1 }, manageHint: { fontSize: 10, fontWeight: '500' }, arrow: { width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  referral: { overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFAEC', borderColor: '#FED6A8', borderWidth: 1, padding: 14, borderRadius: 17 }, referralIcon: { width: 36, height: 36, backgroundColor: '#FF7510', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, rupee: { color: '#FFF', fontWeight: '800', fontSize: 18 }, referralTitle: { color: '#101C32', fontWeight: '800', fontSize: 12 }, referralSub: { color: '#768398', fontSize: 10, lineHeight: 15 }, share: { minHeight: 44, borderWidth: 1, borderColor: '#FF7200', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, shareText: { color: '#FF6500', fontSize: 12, fontWeight: '700' }, error: { color: '#FFD0B1', fontSize: 11, lineHeight: 17, marginBottom: 10 },
});
