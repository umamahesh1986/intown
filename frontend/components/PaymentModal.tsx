import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
  AppState,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number, savings: number, paymentMethod: string) => void;
  merchantId?: string | number;
  customerId?: string | number;
  merchantUpiId?: string;
  merchantName?: string;
  redirectTo?: string;
}

export default function PaymentModal({
  visible,
  onClose,
  onSuccess,
  merchantId,
  customerId,
  merchantUpiId,
  merchantName,
  redirectTo,
}: PaymentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [instantSavingsInput, setInstantSavingsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentChooser, setShowPaymentChooser] = useState(false);

  // Track if we're waiting for user to return from UPI app
  const waitingForUpiReturn = useRef(false);
  const redirectPath = useRef('');

  const parseAmount = (value: string) => {
    const normalized = value.replace(/,/g, '').trim();
    return parseFloat(normalized || '0');
  };

  const amountValue = parseAmount(amount);
  const intownPrice = parseAmount(instantSavingsInput);
  const intownSavings = amountValue - intownPrice;
  const finalPaidAmount = intownPrice;

  // Listen for app returning to foreground after UPI app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // When app comes back to foreground and we were waiting for UPI return
      if (nextAppState === 'active' && waitingForUpiReturn.current) {
        waitingForUpiReturn.current = false;
        // Navigate to dashboard
        const path = redirectPath.current || '/member-dashboard';
        router.replace(path as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  const handlePayNow = async () => {
    if (!amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!Number.isFinite(intownPrice) || intownPrice < 0 || intownPrice > amountValue) {
      Alert.alert('Invalid Intown Price', 'Intown Price must be between 0 and Total Price');
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
        customerId: customerIdValue,
        merchantId: merchantIdValue,
        totalPrice: amountValue,
        inTownPrice: intownPrice,
        inTownSavings: intownSavings > 0 ? intownSavings : 0,
        payablePrice: finalPaidAmount,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('https://api.intownlocal.com/IN/transactions/', {
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
      const isSuccessStatus =
        res.status === 201 || res.status === 200 || data?.transactionId;
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

  /* ===============================
     HANDLE OK BUTTON ON SUCCESS MODAL
     Shows payment method chooser (UPI or Cash)
  ================================ */
  const handleSuccessOk = () => {
    setShowSuccess(false);
    setShowPaymentChooser(true);
  };

  /* Handle UPI payment selection */
  const handleUpiPayment = async () => {
    const savedAmount = amountValue;
    const savedSavings = intownSavings > 0 ? intownSavings : 0;

    onSuccess(savedAmount, savedSavings, 'UPI');
    setAmount('');
    setInstantSavingsInput('');
    setShowPaymentChooser(false);
    onClose();

    if (Platform.OS === 'web') {
      router.replace((redirectTo || '/member-dashboard') as any);
      return;
    }

    // Build UPI URI
    const name = merchantName || 'INtown';
    const payAmount = finalPaidAmount > 0 ? finalPaidAmount.toFixed(2) : '1';
    const upiId = (merchantUpiId || '').trim();

    let upiUri = 'upi://pay?';
    const params: string[] = [];
    if (upiId) {
      params.push(`pa=${encodeURIComponent(upiId)}`);
    }
    params.push(`pn=${encodeURIComponent(name)}`);
    params.push(`am=${payAmount}`);
    params.push('cu=INR');
    params.push('tn=INtownPayment');
    upiUri += params.join('&');

    waitingForUpiReturn.current = true;
    redirectPath.current = redirectTo || '/member-dashboard';

    try {
      await Linking.openURL(upiUri);
    } catch (err1) {
      try {
        await Linking.openURL('upi://pay');
      } catch (err2) {
        waitingForUpiReturn.current = false;
        Alert.alert(
          'No UPI App Found',
          'No UPI payment app found on your device.',
          [{ text: 'OK', onPress: () => router.replace((redirectTo || '/member-dashboard') as any) }]
        );
      }
    }
  };

  /* Handle Cash payment selection */
  const handleCashPayment = () => {
    const savedAmount = amountValue;
    const savedSavings = intownSavings > 0 ? intownSavings : 0;

    onSuccess(savedAmount, savedSavings, 'Cash');
    setAmount('');
    setInstantSavingsInput('');
    setShowPaymentChooser(false);
    onClose();

    router.replace((redirectTo || '/member-dashboard') as any);
  };

  const handleDismiss = () => {
    setShowSuccess(false);
    setShowPaymentChooser(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
          ) : showPaymentChooser ? (
            <View style={styles.chooserContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pay with</Text>
                <TouchableOpacity onPress={handleDismiss}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.chooserSubtitle}>
                Amount: &#8377;{Number.isFinite(finalPaidAmount) && finalPaidAmount >= 0 ? finalPaidAmount.toFixed(2) : '0.00'}
              </Text>

              <TouchableOpacity
                style={styles.chooserOption}
                onPress={handleUpiPayment}
                data-testid="pay-upi-option"
              >
                <View style={styles.chooserIconWrap}>
                  <Ionicons name="phone-portrait-outline" size={28} color="#5C2D91" />
                </View>
                <View style={styles.chooserTextWrap}>
                  <Text style={styles.chooserOptionTitle}>UPI</Text>
                  <Text style={styles.chooserOptionDesc}>Pay using any UPI app</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chooserOption}
                onPress={handleCashPayment}
                data-testid="pay-cash-option"
              >
                <View style={[styles.chooserIconWrap, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="cash-outline" size={28} color="#2E7D32" />
                </View>
                <View style={styles.chooserTextWrap}>
                  <Text style={styles.chooserOptionTitle}>Cash</Text>
                  <Text style={styles.chooserOptionDesc}>Pay with cash at the store</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#999" />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment</Text>
                <TouchableOpacity onPress={handleDismiss}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.label}>Total Price</Text>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.amountPrefix}>&#8377;</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="Enter total price"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.label}>Intown Price</Text>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.amountPrefix}>&#8377;</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={instantSavingsInput}
                    onChangeText={setInstantSavingsInput}
                    placeholder="Enter intown price"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {amountValue > 0 && intownPrice > 0 && intownSavings > 0 ? (
                <View style={styles.savingsSection}>
                  <View style={styles.savingsRow}>
                    <Text style={styles.savingsLabel}>Intown Savings</Text>
                    <Text style={styles.savingsValue}>
                      &#8377;{intownSavings.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.savingsSection}>
                <View style={styles.savingsRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalInput}>
                    &#8377;{Number.isFinite(finalPaidAmount) && finalPaidAmount >= 0 ? finalPaidAmount.toFixed(2) : '0.00'}
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
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  amountSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  amountPrefix: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginRight: 6 },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'left',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  savingsSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsLabel: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  savingsValue: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  totalInput: {
    minWidth: 100,
    textAlign: 'right',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    paddingVertical: 0,
  },
  payButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  successContainer: { alignItems: 'center', paddingVertical: 24 },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
  successButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  successButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  chooserContainer: { paddingVertical: 8 },
  chooserSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  chooserOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  chooserIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  chooserTextWrap: { flex: 1 },
  chooserOptionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  chooserOptionDesc: { fontSize: 13, color: '#777', marginTop: 2 },
});
