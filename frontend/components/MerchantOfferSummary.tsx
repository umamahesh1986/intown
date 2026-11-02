import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatOfferValidTill, getActiveSpecialOffers, isSpecialOfferExpired, SpecialOfferSource } from '../utils/specialOffer';

export function MerchantOfferSummary({ merchant, from }: { merchant: SpecialOfferSource | null; from: 'merchant' | 'dual-merchant' }) {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const offers = getActiveSpecialOffers(merchant, now);
  const expired = isSpecialOfferExpired(merchant, now);
  return <View style={styles.card} testID="merchant-offer-summary">
    <View style={styles.row}><Ionicons name="pricetag-outline" size={22} color="#FF8A00" /><Text style={styles.title}>Seasonal special offer</Text></View>
    <Text style={styles.status}>{expired ? 'Ended · hidden from customers' : offers.length ? 'Live for customers' : 'No active special offer'}</Text>
    {!!offers.length && <Text style={styles.offer} numberOfLines={2}>{offers.join(' · ')}</Text>}
    <Text style={styles.date}>End date: {formatOfferValidTill(merchant) || 'Not set'}</Text>
    <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/account', params: { from, section: 'offer' } })} accessibilityRole="button" testID="merchant-manage-offer">
      <Text style={styles.buttonText}>Edit / stop special offer</Text><Ionicons name="chevron-forward" size={16} color="#FF8A00" />
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 16, margin: 16, padding: 18, borderWidth: 1, borderColor: '#FFE4C4', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#182030' },
  status: { fontSize: 13, fontWeight: '600', color: '#667085' }, offer: { fontSize: 14, lineHeight: 21, color: '#182030' }, date: { fontSize: 13, color: '#667085' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF5E8', padding: 12, borderRadius: 10 }, buttonText: { fontSize: 13, fontWeight: '700', color: '#E87500' },
});
