import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTION_HEADING_TYPOGRAPHY } from './GradientSectionHeading';
import { useRouter } from 'expo-router';
import { formatOfferValidTill, getActiveSpecialOffers, isSpecialOfferExpired, SpecialOfferSource } from '../utils/specialOffer';

export function MerchantOfferSummary({ merchant, from }: { merchant: SpecialOfferSource | null; from: 'merchant' | 'dual-merchant' }) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const offers = getActiveSpecialOffers(merchant, now);
  const expired = isSpecialOfferExpired(merchant, now);
  const active = offers.length > 0;
  return <View style={styles.card} testID="merchant-offer-summary">
    <LinearGradient colors={['#FFC22C', '#FF7900', '#FF3868']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topLine} />
    <View style={styles.row}>
      <LinearGradient colors={['#FF9B0B', '#FF7900']} style={styles.icon}><Ionicons name="pricetag-outline" size={21} color="#FFF" /></LinearGradient>
      <View style={styles.heading}><Text style={styles.title}>Seasonal special offer</Text><Text style={styles.status}>{expired ? 'Ended · hidden from customers' : active ? 'Live for customers' : 'No active special offer'}</Text></View>
      <View style={[styles.badge, active && styles.activeBadge]}><View style={[styles.dot, active && styles.activeDot]} /><Text style={[styles.badgeText, active && styles.activeText]}>{active ? 'Active' : 'Inactive'}</Text></View>
    </View>
    {!!offers.length && <Text style={styles.offer} numberOfLines={2}>{offers.join(' · ')}</Text>}
    <View style={styles.divider} />
    <View style={styles.datePill}><Ionicons name="calendar-outline" size={13} color="#F58200" /><Text style={styles.date}>End date: <Text style={styles.dateValue}>{formatOfferValidTill(merchant) || 'Not set'}</Text></Text></View>
    <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/account', params: { from, section: 'offer' } })} accessibilityRole="button" testID="merchant-manage-offer">
      <Ionicons name="create-outline" size={16} color="#FF6900" /><Text style={styles.buttonText}>Edit / stop special offer</Text><Ionicons name="chevron-forward" size={16} color="#FF6900" />
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 26, marginHorizontal: 16, marginTop: 16, padding: 16, paddingTop: 20, borderWidth: 1, borderColor: '#FFE0BC', gap: 12, overflow: 'hidden', shadowColor: '#D78B43', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFC36B' }, heading: { flex: 1, minWidth: 0, paddingTop: 3 }, title: { ...SECTION_HEADING_TYPOGRAPHY, color: '#142136' },
  status: { fontSize: 11, color: '#73839B', lineHeight: 16, marginTop: 2 }, offer: { fontSize: 13, lineHeight: 20, color: '#182030' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#DFE7F2', backgroundColor: '#F0F4F9', borderRadius: 20 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#94A3BC' }, badgeText: { fontSize: 10, fontWeight: '600', color: '#64758F' }, activeBadge: { backgroundColor: '#EAFBF1', borderColor: '#BFECD1' }, activeDot: { backgroundColor: '#16A368' }, activeText: { color: '#12804F' },
  divider: { height: 1, backgroundColor: '#EFF2F7' }, datePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#FFE192', backgroundColor: '#FFFBEE', borderRadius: 20 }, date: { fontSize: 11, color: '#9B5400' }, dateValue: { color: '#17243B', fontWeight: '700' },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEE', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#FFDC79' }, buttonText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#FF6900' },
});
