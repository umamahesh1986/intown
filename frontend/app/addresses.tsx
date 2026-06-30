import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Addresses() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Addresses</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Home</Text>
        <Text style={styles.value}>
          2/37, Dharmapuri, Ananthapuramu, Andhra Pradesh 515812
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Work</Text>
        <Text style={styles.value}>
          Bengaluru, Karnataka
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
  },
});
