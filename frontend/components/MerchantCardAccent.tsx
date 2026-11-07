import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function MerchantCardAccent() {
  return <LinearGradient pointerEvents="none" colors={['#FFC22C', '#FF7900', '#FF3868']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.line} />;
}

export const merchantCardSurface = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 26, borderWidth: 1, borderColor: '#FFE0BC', overflow: 'hidden', paddingTop: 20, shadowColor: '#D78B43', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
}).card;

const styles = StyleSheet.create({ line: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 } });
