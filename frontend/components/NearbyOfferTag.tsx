import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function NearbyOfferTag({ offer, special = false }: { offer?: string; special?: boolean }) {
  const { fontScale } = useWindowDimensions();
  const textHeight = 30 * Math.max(1, fontScale);
  if (!offer) return <View style={{ minHeight: textHeight + 10, marginTop: 4 }} />;
  return <View style={styles.badge}>
    <Ionicons name={special ? 'sparkles' : 'pricetag'} size={12} color="#2E7D32" style={{ marginTop: 2 }} />
    <Text numberOfLines={2} style={[styles.text, { minHeight: textHeight }]}>{offer}</Text>
  </View>;
}
const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, alignSelf: 'stretch', minWidth: 0, marginTop: 4 },
  text: { flex: 1, minWidth: 0, fontSize: 11, lineHeight: 15, fontWeight: '600', color: '#2E7D32' },
});
