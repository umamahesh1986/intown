import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useINCoinsStore } from '../store/incoinsStore';
import { INCoinsHistoryList } from '../components/incoins/INCoinsHistoryList';
import { MerchantCardAccent } from '../components/MerchantCardAccent';
export default function INCoinsHistoryScreen() {
  const router = useRouter();
  const { user, token, isAuthenticated, isGuest, isHydrated } = useAuthStore();
  const { balance, balanceError, loading, refresh } = useINCoinsStore();
  const signedIn = isAuthenticated && !isGuest && !!token && !!user?.phone;
  useFocusEffect(useCallback(() => {
    if (signedIn && user?.phone && token) void refresh();
  }, [signedIn, user?.phone, token, refresh]));
  const back = () => router.canGoBack() ? router.back() : router.replace(user?.userType === 'dual' ? '/dual-dashboard' : user?.userType === 'merchant' ? '/merchant-dashboard' : '/member-dashboard');
  return <SafeAreaView style={s.page}>
    <View style={s.nav}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={s.back}><Ionicons name="chevron-back" size={21} color="#334155" /></TouchableOpacity><Text style={s.navTitle}>INCoins History</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh INCoins history" onPress={() => void refresh()} disabled={loading || !signedIn} style={s.back}><Ionicons name="refresh-outline" size={20} color="#64748B" /></TouchableOpacity></View>
    {!isHydrated ? <ActivityIndicator color="#FF7900" style={{ marginTop: 24 }} /> : !signedIn ? <Text style={s.notice}>Please sign in to view your INCoins history.</Text> :
      <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor="#FF7900" />}>
        <View style={s.balanceRow}><Text style={s.balanceLabel}>Available INCoins</Text><Text style={s.balance}>{balance ? balance.inCoins.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}</Text></View>
        {!!balanceError && <View><Text style={s.error}>{balanceError}</Text><TouchableOpacity accessibilityRole="button" onPress={() => void refresh()} style={s.retry}><Text style={s.retryText}>Retry wallet</Text></TouchableOpacity></View>}
        <View style={s.card} testID="incoins-history-activity-card"><MerchantCardAccent />
          <View style={s.headingRow}><View style={s.headingCopy}><Text style={s.heading}>Recent INCoins Activity</Text><Text style={s.subtitle}>Live ledger of your cashback &amp; referrals</Text></View><Text style={s.pill}>All Activity</Text></View>
          <INCoinsHistoryList />
          <Text style={s.footnote}>All amounts shown in INCoins</Text>
        </View>
      </ScrollView>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F7FB' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F3F8' },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#14223B', flex: 1 },
  content: { padding: 14, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 8 },
  balanceLabel: { color: '#71829B', fontSize: 12 }, balance: { fontWeight: '800', fontSize: 18, color: '#14223B' },
  card: { backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, overflow: 'hidden', shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 12, elevation: 2 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingHorizontal: 3 },
  headingCopy: { flex: 1 }, heading: { color: '#14223B', fontSize: 16, lineHeight: 21, fontWeight: '800' },
  subtitle: { color: '#71829B', fontSize: 10, lineHeight: 15, marginTop: 2 },
  pill: { backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, color: '#64748B', fontSize: 10 },
  footnote: { color: '#94A3B8', fontSize: 10, textAlign: 'right', paddingTop: 8 },
  notice: { color: '#64748B', padding: 20, fontSize: 13 }, error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12 }, retryText: { color: '#EA580C', fontWeight: '700', fontSize: 12 },
});
