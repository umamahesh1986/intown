import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterMember() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Registration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.comingSoon}>
          <Ionicons name="person-add" size={64} color="#FF6600" />
          <Text style={styles.comingSoonText}>Member Registration Form</Text>
          <Text style={styles.comingSoonSubtext}>Coming Soon</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Required Fields:</Text>
            <Text style={styles.infoText}>• Contact Name</Text>
            <Text style={styles.infoText}>• Select Customer Location (Map)</Text>
            <Text style={styles.infoText}>• Email</Text>
            <Text style={styles.infoText}>• Phone Number</Text>
            <Text style={styles.infoText}>• Pincode</Text>
            <Text style={styles.infoText}>• Upload Multi Image</Text>
            <Text style={styles.infoText}>• Terms & Conditions</Text>
          </View>

          <TouchableOpacity style={styles.backHomeButton} onPress={() => router.back()}>
            <Text style={styles.backHomeText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  comingSoon: {
    padding: 24,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 32,
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6600',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  backHomeButton: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  backHomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});