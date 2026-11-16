import { MerchantCardAccent, merchantCardSurface } from './MerchantCardAccent';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GradientSectionHeading } from './GradientSectionHeading';

export function MerchantOrderHistoryLink() {
  const router = useRouter();
  return <TouchableOpacity style={[styles.card, merchantCardSurface]} onPress={() => router.push({ pathname: '/merchant-orders', params: { tab: 'ALL' } })} accessibilityRole="button" accessibilityLabel="View all merchant orders and order details" testID="merchant-order-history-link">
      <MerchantCardAccent />
    <View style={styles.icon}><Ionicons name="receipt-outline" size={23} color="#FFF" /></View>
    <View style={{ flex: 1 }}><GradientSectionHeading>Order history</GradientSectionHeading><Text style={styles.subtitle}>View all orders, items and status updates</Text></View>
    <View style={styles.action}><Ionicons name="chevron-forward" size={20} color="#FF7900" /></View>
  </TouchableOpacity>;
}
const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FFE1BE' },
  icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FF8A00', alignItems: 'center', justifyContent: 'center' },
  action: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E3', alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 12, lineHeight: 18, color: '#72819B', marginTop: 4 },
});
