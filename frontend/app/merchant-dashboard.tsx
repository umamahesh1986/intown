import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Payment {
  id: string;
  customerAmount: number;
  discountAmount: number;
  totalReceived: number;
  date: string;
  status: 'pending' | 'completed';
}

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Merchant shop details (would come from registration)
  const merchantShop = {
    name: user?.name || 'My Shop',
    category: 'Retail Store',
    rating: 4.5,
    totalPayments: payments.length,
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const stored = await AsyncStorage.getItem('merchant_payments');
      if (stored) {
        setPayments(JSON.parse(stored));
      } else {
        // Demo payments
        const demoPayments: Payment[] = [
          {
            id: '1',
            customerAmount: 1000,
            discountAmount: 100,
            totalReceived: 900,
            date: new Date().toISOString(),
            status: 'pending',
          },
          {
            id: '2',
            customerAmount: 500,
            discountAmount: 50,
            totalReceived: 450,
            date: new Date().toISOString(),
            status: 'pending',
          },
        ];
        setPayments(demoPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const savePayments = async (updatedPayments: Payment[]) => {
    try {
      await AsyncStorage.setItem('merchant_payments', JSON.stringify(updatedPayments));
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  };

  const handlePaymentComplete = (paymentId: string) => {
    Alert.alert(
      'Mark as Completed',
      'Confirm that you have received this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const updated = payments.map((p) =>
              p.id === paymentId ? { ...p, status: 'completed' as const } : p
            );
            savePayments(updated);
            Alert.alert('Success', 'Payment marked as completed!');
          },
        },
      ]
    );
  };

  const getTotalStats = () => {
    const completed = payments.filter((p) => p.status === 'completed');
    const totalCustomerAmount = completed.reduce((sum, p) => sum + p.customerAmount, 0);
    const totalDiscountAmount = completed.reduce((sum, p) => sum + p.discountAmount, 0);
    const totalReceived = completed.reduce((sum, p) => sum + p.totalReceived, 0);
    return { totalCustomerAmount, totalDiscountAmount, totalReceived };
  };

  const stats = getTotalStats();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear all storage
            await AsyncStorage.clear();
            // Call logout from store
            await logout();
            // Force navigation to login
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even on error
            router.replace('/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>INtown</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.merchantBadge}>
                <Text style={styles.merchantBadgeText}>Merchant</Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showDropdown && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
              }}
            >
              <Ionicons name="person-outline" size={20} color="#666666" />
              <Text style={styles.dropdownText}>Account Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
              }}
            >
              <Ionicons name="storefront-outline" size={20} color="#666666" />
              <Text style={styles.dropdownText}>Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF0000" />
              <Text style={[styles.dropdownText, { color: '#FF0000' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Shop Details Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopImageContainer}>
            <Ionicons name="storefront" size={80} color="#2196F3" />
          </View>
          <Text style={styles.shopName}>{merchantShop.name}</Text>
          <Text style={styles.shopCategory}>{merchantShop.category}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= merchantShop.rating ? 'star' : 'star-outline'}
                size={20}
                color="#FFA500"
              />
            ))}
            <Text style={styles.ratingText}>{merchantShop.rating}</Text>
          </View>
        </View>

        {/* Total Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="cash" size={32} color="#2196F3" />
                <Text style={styles.summaryLabel}>Customer Amount</Text>
                <Text style={styles.summaryValue}>₹{stats.totalCustomerAmount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="pricetag" size={32} color="#FF6600" />
                <Text style={styles.summaryLabel}>Discount Amount</Text>
                <Text style={styles.summaryValue}>₹{stats.totalDiscountAmount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="wallet" size={32} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Total Received</Text>
                <Text style={styles.summaryValueLarge}>₹{stats.totalReceived}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {payments.map((payment) => (
            <View
              key={payment.id}
              style={[
                styles.paymentCard,
                payment.status === 'completed' && styles.paymentCardCompleted,
              ]}
            >
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDate}>
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    payment.status === 'completed' && styles.statusBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      payment.status === 'completed' && styles.statusTextCompleted,
                    ]}
                  >
                    {payment.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Customer Amount:</Text>
                  <Text style={styles.paymentAmount}>₹{payment.customerAmount}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Discount Amount:</Text>
                  <Text style={styles.paymentDiscount}>-₹{payment.discountAmount}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabelBold}>Total Received:</Text>
                  <Text style={styles.paymentTotal}>₹{payment.totalReceived}</Text>
                </View>
              </View>

              {payment.status === 'pending' && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handlePaymentComplete(payment.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.completeButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTagline}>
            Growing Your Business Through Digital Presence
          </Text>
          <Text style={styles.footerDescription}>
            IntownLocal helps you reach more customers and grow your business.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#FF6600' },
  profileButton: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  merchantBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  merchantBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  dropdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownText: { fontSize: 14, color: '#666666', marginLeft: 12 },
  shopCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  shopImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shopName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  shopCategory: { fontSize: 16, color: '#666666', marginBottom: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#666666', marginLeft: 8 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: '#666666', marginTop: 8, textAlign: 'center' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 4 },
  summaryValueLarge: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginTop: 4 },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  paymentCardCompleted: { borderColor: '#4CAF50', opacity: 0.8 },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentDate: { fontSize: 14, color: '#666666', fontWeight: '600' },
  statusBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusBadgeCompleted: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 12, color: '#FF6600', fontWeight: '600' },
  statusTextCompleted: { color: '#4CAF50' },
  paymentDetails: { marginBottom: 12 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: '#666666' },
  paymentAmount: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  paymentDiscount: { fontSize: 16, fontWeight: '600', color: '#FF6600' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 8 },
  paymentLabelBold: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  paymentTotal: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  footer: { backgroundColor: '#1A1A1A', padding: 24, alignItems: 'center', marginTop: 16 },
  footerTagline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
});
