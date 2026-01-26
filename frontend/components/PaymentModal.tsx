import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number, savings: number, paymentMethod: string) => void;
  merchantId?: string | number;
  customerId?: string | number;
  redirectTo?: string;
}

const PAYMENT_METHODS = [
  { id: 'phonepe', name: 'PhonePe', icon: 'call' },
  { id: 'googlepay', name: 'Google Pay', icon: 'logo-google' },
  { id: 'paytm', name: 'Paytm', icon: 'wallet' },
  { id: 'cash', name: 'Cash', icon: 'cash' },
];

export default function PaymentModal({
  visible,
  onClose,
  onSuccess,
  merchantId,
  customerId,
  redirectTo,
}: PaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [instantSavingsInput, setInstantSavingsInput] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showMethods, setShowMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const parseAmount = (value: string) => {
    const normalized = value.replace(/,/g, '').trim();
    return parseFloat(normalized || '0');
  };

  const amountValue = parseAmount(amount);
  const instantSavings = parseAmount(instantSavingsInput);
  const finalPaidAmount = amountValue - instantSavings;

  const handlePayNow = async () => {
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!Number.isFinite(instantSavings) || instantSavings < 0 || instantSavings > amountValue) {
      Alert.alert('Invalid Savings', 'Savings must be between 0 and total amount');
      return;
    }
    if (!Number.isFinite(finalPaidAmount) || finalPaidAmount < 0) {
      Alert.alert('Invalid Total', 'Total payable must be 0 or more');
      return;
    }
    const merchantIdValue = Number(merchantId);
    if (!merchantId || !Number.isFinite(merchantIdValue)) {
      Alert.alert('Missing Merchant', 'Merchant details not available');
      return;
    }
    const customerIdValue = Number(customerId);
    if (!customerId || !Number.isFinite(customerIdValue)) {
      Alert.alert('Missing Customer', 'Customer details not available');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        merchantId: merchantIdValue,
        customerId: customerIdValue,
        totalBillAmount: amountValue,
        enteredDiscountAmount: instantSavings,
        finalPaidAmount,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('https://devapi.intownlocal.com/IN/transactions/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => ({}));
      const statusValue = String(data?.status ?? '').toLowerCase();
      const isSuccessStatus =
        res.status === 201 || res.status === 200 || statusValue === 'success';
      if (isSuccessStatus) {
        setShowSuccess(true);
      } else {
        Alert.alert('Payment Failed', data?.message || 'Please try again later.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.name === 'AbortError') {
        Alert.alert('Payment Failed', 'Request timed out. Please try again.');
      } else {
        Alert.alert('Payment Failed', 'Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMethodSelect = (methodId: string, methodName: string) => {
    // Simulate payment processing
    Alert.alert(
      'Payment Successful!',
      `Paid ₹${finalPaidAmount.toFixed(2)} via ${methodName}\nYou saved ₹${instantSavings.toFixed(2)}!`,
      [{
        text: 'OK',
        onPress: () => {
          onSuccess(amountValue, instantSavings, methodName);
          setAmount('');
          setInstantSavingsInput('');
          setSelectedMethod('');
          setShowMethods(false);
          onClose();
        },
      }]
    );
  };

  const handleDismiss = () => {
    setShowSuccess(false);
    onClose();
  };

  const handleSuccessOk = () => {
    onSuccess(amountValue, instantSavings, 'Direct');
    setAmount('');
    setInstantSavingsInput('');
    setSelectedMethod('');
    setShowMethods(false);
    setShowSuccess(false);
    onClose();
    router.replace((redirectTo || '/member-dashboard') as any);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Success</Text>
              <Text style={styles.successMessage}>
                your transaction was processed Successfully !
              </Text>
              <TouchableOpacity style={styles.successButton} onPress={handleSuccessOk}>
                <Text style={styles.successButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : !showMethods ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment</Text>
                <TouchableOpacity onPress={handleDismiss}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.label}>Total Amount</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.amountSection}>
                  <Text style={styles.label}>Instant Savings</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={instantSavingsInput}
                    onChangeText={setInstantSavingsInput}
                    placeholder="Enter savings"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

              <View style={styles.savingsSection}>
                <View style={styles.savingsRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalInput}>
                    ₹{Number.isFinite(finalPaidAmount) ? finalPaidAmount.toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
                onPress={handlePayNow}
                disabled={isSubmitting}
              >
                <Text style={styles.payButtonText}>
                  {isSubmitting ? 'Processing...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowMethods(false)}>
                  <Ionicons name="arrow-back" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <View style={{width: 28}} />
              </View>

              <ScrollView>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.methodCard}
                    onPress={() => handlePaymentMethodSelect(method.id, method.name)}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons name={method.icon as any} size={28} color="#FF6600" />
                    </View>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  amountSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  amountInput: { backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center' },
  savingsSection: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 24 },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  savingsLabel: { fontSize: 14, color: '#2E7D32' },
  divider: { height: 1, backgroundColor: '#C8E6C9', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  totalInput: {
    minWidth: 100,
    textAlign: 'right',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    paddingVertical: 0,
  },
  payButton: { backgroundColor: '#FF6600', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 12 },
  methodIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  successContainer: { alignItems: 'center', paddingVertical: 24 },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
  successButton: { backgroundColor: '#FF6600', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  successButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});