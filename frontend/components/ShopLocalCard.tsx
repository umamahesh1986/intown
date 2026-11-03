import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export function ShopLocalCard({ onExplore }: { onExplore: () => void }) {
  return <LinearGradient colors={['#FF5900', '#FF7400', '#CC2C05']} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.45, y: 1 }} style={styles.card}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#FFB34C', '#FF970000']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.highlight} />
      {[190, 240, 290].map(size => <View key={`top-${size}`} style={[styles.ring, { width: size, height: size, borderRadius: size / 2, right: -size / 2 + 15, top: -size / 2 + 25 }]} />)}
      {[64, 126, 186, 246].map((size, index) => <View key={size} style={[styles.ring, { width: size, height: size, borderRadius: size / 2, right: 18 - size / 2, bottom: 18 - size / 2, borderStyle: index % 2 ? 'dashed' : 'solid' }]} />)}
    </View>
    <View style={styles.badges}>
      <View style={styles.localBadge}><View style={styles.dot} /><Text style={styles.localText}>VOCAL FOR LOCAL</Text></View>
      <View style={styles.discountBadge}><Text style={styles.discountText}>Up to 40% Off</Text></View>
    </View>
    <Text style={styles.title}>Shop Local, <Text style={styles.titleAccent}>Save Local</Text></Text>
    <Text style={styles.subtitle}>Exclusive privilege access &amp; instant discounts at{ '\n' }verified neighborhood stores.</Text>
    <TouchableOpacity style={styles.button} onPress={onExplore} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Explore nearby shops" testID="user-explore-nearby">
      <Text style={styles.buttonText}>Explore Nearby</Text><View style={styles.arrow}><Ionicons name="chevron-forward" size={14} color="#FF5900" /></View>
    </TouchableOpacity>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 14, paddingHorizontal: 20, paddingVertical: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#FF8C3C', minHeight: 208 },
  highlight: { position: 'absolute', right: 0, top: 0, width: '65%', height: '100%' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,225,155,0.25)' },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8 },
  localBadge: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.20)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 12, paddingVertical: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFDF69' }, localText: { color: '#FFF', fontWeight: '800', fontSize: 10 },
  discountBadge: { borderRadius: 20, backgroundColor: 'rgba(255,238,171,0.25)', borderWidth: 1, borderColor: 'rgba(255,240,190,0.35)', paddingHorizontal: 12, paddingVertical: 3 },
  discountText: { color: '#FFE5A5', fontSize: 10, fontWeight: '800' },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.7, marginBottom: 4 }, titleAccent: { color: '#FFE282' },
  subtitle: { color: '#FFF', fontSize: 12, fontWeight: '600', lineHeight: 20, marginBottom: 15 },
  button: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#8E2500', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#F65C00', fontSize: 12, fontWeight: '800' }, arrow: { backgroundColor: '#FFF4E8', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
