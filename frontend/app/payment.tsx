import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { processPayment } from '../utils/api';

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: 'qr-code' },
  { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
  { id: 'netbanking', name: 'Net Banking', icon: 'business' },
  { id: 'wallet', name: 'Wallet', icon: 'wallet' },
];

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const shopId = params.shopId as string | undefined;
  const planId = params.planId as string | undefined;
  const amount = parseFloat(params.amount as string);
  const savings = parseFloat(params.savings as string) || amount * 0.1;
  const type = params.type as string; // 'shop' or 'plan'

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method', 'Please select a payment method');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processPayment({
        userId: user.id,
        shopId,
        planId,
        amount,
        method: selectedMethod,
      });

      if (response.success) {
        Alert.alert(
          'Payment Successful!',
          `Transaction ID: ${response.transactionId}\nSavings: ₹${response.savings.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/dashboard'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'Please try again');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Amount Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            {type === 'plan' ? 'Subscription Plan' : 'Shop Purchase'}
          </Text>
          <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
          
          <View style={styles.savingsBadge}>
            <Ionicons name="pricetag" size={16} color="#4CAF50" />
            <Text style={styles.savingsText}>
              You save ₹{savings.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <View
                  style={[
                    styles.methodIcon,
                    selectedMethod === method.id && styles.methodIconSelected,
                  ]}
                >
                  <Ionicons
                    name={method.icon as any}
                    size={24}
                    color={selectedMethod === method.id ? '#FFFFFF' : '#FF6600'}
                  />
                </View>
                <Text style={styles.methodName}>{method.name}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedMethod === method.id && styles.radioButtonSelected,
                ]}
              >
                {selectedMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mock Payment Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            This is a mock payment. No actual transaction will be processed.
          </Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || isProcessing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  savingsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  methodCardSelected: {
    borderColor: '#FF6600',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconSelected: {
    backgroundColor: '#FF6600',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF6600',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});