import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatOfferValidTill } from '../utils/specialOffer';

export function NearbyOfferPanel({ shop, offer, onClaim }: { shop: any; offer: string; onClaim: () => void }) {
  const validTill = formatOfferValidTill(shop);
  return <View style={styles.panel}>
    <View style={styles.heading}><Ionicons name="sparkles" size={14} color="#FF8A00" /><Text style={styles.offer} numberOfLines={2}>{offer}</Text></View>
    <Text style={styles.subtitle}>Exclusive INtown Privilege Member saving</Text>
    <View style={styles.footer}>
      <View style={styles.date}><Text style={styles.dateLabel}>Valid till</Text><Text style={styles.dateValue}>{validTill || 'No end date'}</Text></View>
      <TouchableOpacity style={styles.button} onPress={onClaim} accessibilityRole="button" accessibilityLabel={`Claim deal at ${shop.businessName || shop.shopName || 'this shop'}`} testID={`claim-nearby-deal-${shop.id}`}><Text style={styles.buttonText}>Claim Deal</Text></TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { marginTop: 6, backgroundColor: '#ECFCF4', borderWidth: 1, borderColor: '#CCF6E3', borderLeftWidth: 4, borderLeftColor: '#FF7900', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 10, overflow: 'hidden' },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 }, offer: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: '800', color: '#152234', lineHeight: 15 },
  subtitle: { fontSize: 9, lineHeight: 13, color: '#008764', marginTop: 3, marginLeft: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#D9EEE4', marginTop: 7, paddingTop: 7, gap: 6 },
  date: { flex: 1, minWidth: 0 }, dateLabel: { fontSize: 9, color: '#718299', lineHeight: 12 }, dateValue: { fontSize: 10, fontWeight: '700', color: '#243448', lineHeight: 14 },
  button: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FF7900' }, buttonText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});
