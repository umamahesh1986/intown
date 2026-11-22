import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { INTOWN_API_BASE } from '../utils/api';
import { merchantRecord } from '../utils/merchantProfile';

type MerchantServices = { isPickupEnabled: boolean | null; isSlotBookingEnabled: boolean | null; merchantSubscriptionPlan: string | null };

export function MerchantServiceSettings({ merchantId, token, from = 'merchant' }: { merchantId: string | null; token: string | null; from?: 'merchant' | 'dual-merchant' }) {
  const router = useRouter();
  const [profile, setProfile] = useState<MerchantServices | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!merchantId || !token) throw new Error('Sign in to manage your services.');
    const response = await fetch(`${INTOWN_API_BASE}/merchant/${encodeURIComponent(merchantId)}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Unable to load service settings.');
    const data = merchantRecord(await response.json());
    if (!data || String(data.id) !== merchantId) throw new Error('Service settings are unavailable.');
    return { isPickupEnabled: typeof data.isPickupEnabled === 'boolean' ? data.isPickupEnabled : null, isSlotBookingEnabled: typeof data.isSlotBookingEnabled === 'boolean' ? data.isSlotBookingEnabled : null, merchantSubscriptionPlan: typeof data.merchantSubscriptionPlan === 'string' ? data.merchantSubscriptionPlan : null };
  }, [merchantId, token]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setProfile(null); setError('');
    void load().then(data => { if (active) setProfile(data); }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [load]));

  if (!profile && !error) return <View style={styles.card}><ActivityIndicator color="#FF7900" /></View>;
  return <View style={styles.card}>
    <View style={styles.row}><Text style={styles.title}>Customer services</Text><TouchableOpacity accessibilityRole="link" accessibilityLabel="Update customer services" style={styles.updateButton} onPress={() => router.push({ pathname: '/account', params: { from, section: 'services' } })}><Ionicons name="create-outline" size={14} color="#EA6A00" /><Text style={styles.update}>Update</Text><Ionicons name="chevron-forward" size={13} color="#EA6A00" /></TouchableOpacity></View>
    {profile?.merchantSubscriptionPlan && profile.merchantSubscriptionPlan.toUpperCase() !== 'LAUNCH' && <Text style={styles.copy}>Available with the LAUNCH plan.</Text>}
    {profile && ([['isPickupEnabled', 'Pick @ Shop'], ['isSlotBookingEnabled', 'Book a slot']] as const).map(([key, label]) => <View key={key} style={styles.row}><Text style={styles.label}>{label}</Text><View style={[styles.badge, profile[key] === true ? styles.enabledBadge : styles.disabledBadge]}><Text style={profile[key] === true ? styles.enabled : styles.disabled}>{profile[key] === null ? 'Unavailable' : profile[key] ? 'Enabled' : 'Disabled'}</Text></View></View>)}
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
  </View>;
}

const styles = StyleSheet.create({ card: { marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#FFE0BC' }, title: { fontSize: 15, fontWeight: '700', color: '#17243B', marginBottom: 4 }, updateButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6 }, update: { color: '#EA6A00', fontSize: 12, fontWeight: '700' }, copy: { color: '#64748B', fontSize: 12, marginTop: 4 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }, label: { color: '#334155', fontSize: 14, fontWeight: '600' }, badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 }, enabledBadge: { backgroundColor: '#ECFDF5' }, disabledBadge: { backgroundColor: '#F1F5F9' }, enabled: { color: '#059669', fontSize: 12, fontWeight: '600' }, disabled: { color: '#64748B', fontSize: 12, fontWeight: '600' }, error: { color: '#B42318', fontSize: 12, marginTop: 8 } });
