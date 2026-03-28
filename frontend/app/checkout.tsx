import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INTOWN_API_BASE } from '../utils/api';

interface PlanOption {
  id: number;
  name: string;
  price: number;
  duration: string;
  code: string;
  savings: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 2,
    name: 'Silver',
    price: 399,
    duration: '3 Months',
    code: 'QUARTERLY',
    savings: '1%',
    features: ['1% Instant Savings', 'Access to partner stores', 'Transaction history'],
  },
  {
    id: 3,
    name: 'Gold',
    price: 599,
    duration: '6 Months',
    code: 'SEMI_ANNUAL',
    savings: '2%',
    features: ['2% Instant Savings', 'All Silver features', 'Priority support', 'Exclusive deals'],
  },
  {
    id: 4,
    name: 'Platinum',
    price: 999,
    duration: '1 Year',
    code: 'ANNUAL',
    savings: '2%',
    features: ['2% Instant Savings', 'All Gold features', 'VIP merchant access', 'Premium partner access'],
  },
];

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    planId?: string;
    planName?: string;
    planPrice?: string;
    planDuration?: string;
    planCode?: string;
  }>();

  const initialPlanId = params.planId ? Number(params.planId) : 2;
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(
    PLANS.find(p => p.id === initialPlanId) || PLANS[0]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomerId = async () => {
      const stored = await AsyncStorage.getItem('customer_id');
      setCustomerId(stored);
    };
    loadCustomerId();
  }, []);

  const handleCheckout = async () => {
    if (!customerId) {
      Alert.alert('Error', 'Customer ID not found. Please login again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Order
      console.log('=== CREATING ORDER ===');
      const createOrderRes = await fetch(`${INTOWN_API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          customerId: Number(customerId),
          amount: selectedPlan.price,
          description: `INtown ${selectedPlan.name} Plan - ${selectedPlan.duration}`,
          subscriptionPlan: selectedPlan.code,
          notes: {
            planName: selectedPlan.name,
            duration: selectedPlan.duration,
            savings: selectedPlan.savings,
          },
        }),
      });

      if (!createOrderRes.ok) {
        const errData = await createOrderRes.json().catch(() => ({}));
        throw new Error(errData.message || `Order creation failed (${createOrderRes.status})`);
      }

      const orderData = await createOrderRes.json();
      console.log('=== ORDER CREATED ===', JSON.stringify(orderData));

      // Step 2: Open Razorpay
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Razorpay payments are only available on the mobile app. Please use the Android/iOS app to subscribe.');
        setIsProcessing(false);
        return;
      }

      let RazorpayCheckout: any;
      try {
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch (e) {
        Alert.alert('Error', 'Payment module not available. Please update the app.');
        setIsProcessing(false);
        return;
      }

      const razorpayOptions = {
        description: `INtown ${selectedPlan.name} Plan`,
        image: 'https://intown-prod.s3.ap-south-1.amazonaws.com/logo/intown-logo.png',
        currency: orderData.currency || 'INR',
        key: orderData.keyId,
        amount: String(orderData.amount),
        name: 'INtown',
        order_id: orderData.razorpayOrderId,
        prefill: {
          contact: '',
          name: '',
        },
        theme: { color: '#FF8A00' },
      };

      console.log('=== OPENING RAZORPAY ===');
      const paymentResponse = await RazorpayCheckout.open(razorpayOptions);
      console.log('=== PAYMENT RESPONSE ===', JSON.stringify(paymentResponse));

      // Step 3: Verify Payment
      await verifyPayment(paymentResponse, orderData);

    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.code === 'PAYMENT_CANCELLED' || error?.description?.includes('cancelled')) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment. You can try again anytime.');
      } else {
        Alert.alert('Payment Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (paymentResponse: any, orderData: any) => {
    console.log('=== VERIFYING PAYMENT ===');
    const verifyRes = await fetch(`${INTOWN_API_BASE}/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        amount: orderData.amount,
        subscriptionPlan: selectedPlan.code,
        customerId: Number(customerId),
      }),
    });

    const verifyData = await verifyRes.json().catch(() => ({}));
    console.log('=== VERIFY RESPONSE ===', JSON.stringify(verifyData));

    if (!verifyRes.ok || verifyData.status === 'FAILED') {
      throw new Error(verifyData.message || 'Payment verification failed');
    }

    // Payment successful
    Alert.alert(
      'Payment Successful!',
      `You have subscribed to the ${selectedPlan.name} plan. Enjoy your savings!`,
      [{ text: 'Go to Dashboard', onPress: () => router.replace('/member-dashboard') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Plan */}
        <View style={styles.selectedPlanCard}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>SELECTED PLAN</Text>
          </View>
          <Text style={styles.selectedPlanName}>{selectedPlan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>&#8377;</Text>
            <Text style={styles.price}>{selectedPlan.price}</Text>
            <Text style={styles.duration}>/ {selectedPlan.duration}</Text>
          </View>
          <View style={styles.savingsBadge}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.savingsText}>{selectedPlan.savings} Instant Savings on every purchase</Text>
          </View>
          <View style={styles.featuresList}>
            {selectedPlan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Other Plans */}
        <Text style={styles.otherPlansTitle}>Other Plans</Text>
        {PLANS.filter(p => p.id !== selectedPlan.id).map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.otherPlanCard, selectedPlan.id === plan.id && styles.otherPlanSelected]}
            onPress={() => setSelectedPlan(plan)}
            activeOpacity={0.7}
          >
            <View style={styles.otherPlanHeader}>
              <Text style={styles.otherPlanName}>{plan.name}</Text>
              <View style={styles.otherPlanSavings}>
                <Text style={styles.otherPlanSavingsText}>{plan.savings} Savings</Text>
              </View>
            </View>
            <View style={styles.otherPlanPriceRow}>
              <Text style={styles.otherPlanPrice}>&#8377;{plan.price}</Text>
              <Text style={styles.otherPlanDuration}>/ {plan.duration}</Text>
            </View>
            <Text style={styles.switchText}>Tap to switch to this plan</Text>
          </TouchableOpacity>
        ))}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{selectedPlan.name} Plan ({selectedPlan.duration})</Text>
            <Text style={styles.summaryValue}>&#8377;{selectedPlan.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Instant Savings Rate</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{selectedPlan.savings}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>&#8377;{selectedPlan.price}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomTotal}>&#8377;{selectedPlan.price}</Text>
          <Text style={styles.bottomPlanName}>{selectedPlan.name} Plan</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.checkoutButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  content: { flex: 1, padding: 16 },

  // Selected Plan
  selectedPlanCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 2, borderColor: '#FF8A00',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 3,
  },
  selectedBadge: {
    backgroundColor: '#FF8A00', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  selectedBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  selectedPlanName: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  currency: { fontSize: 20, fontWeight: '700', color: '#FF8A00' },
  price: { fontSize: 36, fontWeight: '800', color: '#FF8A00' },
  duration: { fontSize: 14, color: '#888', marginLeft: 4 },
  savingsBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  savingsText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginLeft: 6 },
  featuresList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#444', flex: 1 },

  // Other Plans
  otherPlansTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  otherPlanCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  otherPlanSelected: { borderColor: '#FF8A00', borderWidth: 2 },
  otherPlanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  otherPlanName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  otherPlanSavings: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  otherPlanSavingsText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  otherPlanPriceRow: { flexDirection: 'row', alignItems: 'baseline' },
  otherPlanPrice: { fontSize: 22, fontWeight: '800', color: '#FF8A00' },
  otherPlanDuration: { fontSize: 13, color: '#888', marginLeft: 4 },
  switchText: { fontSize: 12, color: '#999', marginTop: 6, fontStyle: 'italic' },

  // Summary
  summaryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 18, marginTop: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  divider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#FF8A00' },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#E5E5E5',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8,
    elevation: 5,
  },
  bottomPriceInfo: {},
  bottomTotal: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  bottomPlanName: { fontSize: 12, color: '#888' },
  checkoutButton: {
    backgroundColor: '#FF8A00', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14,
    minWidth: 140, alignItems: 'center',
  },
  checkoutButtonDisabled: { opacity: 0.6 },
  checkoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
