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
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';

interface PaymentApp {
  id: string;
  name: string;
  packageName: string;
  scheme: string;
  icon: any;
  color: string;
}

const ALL_UPI_APPS: PaymentApp[] = [
  { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app', scheme: 'phonepe://', icon: 'phone-portrait', color: '#5F259F' },
  { id: 'googlepay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user', scheme: 'tez://', icon: 'logo-google', color: '#4285F4' },
  { id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm', scheme: 'paytmmp://', icon: 'wallet', color: '#00BAF2' },
  { id: 'amazonpay', name: 'Amazon Pay', packageName: 'in.amazon.mShop.android.shopping', scheme: 'amazonpay://', icon: 'cart', color: '#FF9900' },
  { id: 'bhim', name: 'BHIM UPI', packageName: 'in.org.npci.upiapp', scheme: 'upi://', icon: 'shield-checkmark', color: '#00695C' },
  { id: 'cred', name: 'CRED', packageName: 'com.dreamplug.androidapp', scheme: 'cred://', icon: 'diamond', color: '#1A1A1A' },
];

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
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showMethods, setShowMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [installedApps, setInstalledApps] = useState<PaymentApp[]>([]);
  const [isDetectingApps, setIsDetectingApps] = useState(false);

  const parseAmount = (value: string) => {
    const normalized = value.replace(/,/g, '').trim();
    return parseFloat(normalized || '0');
  };

  const amountValue = parseAmount(amount);
  const intownPrice = parseAmount(instantSavingsInput);
  const intownSavings = amountValue - intownPrice;
  const finalPaidAmount = intownPrice;

  /* ===============================
     DETECT INSTALLED UPI APPS
     Checks which payment apps are installed on the device
  ================================ */
  const detectInstalledApps = async () => {
    setIsDetectingApps(true);
    const installed: PaymentApp[] = [];

    if (Platform.OS === 'android') {
      // On Android, try to check each app using Linking.canOpenURL
      for (const app of ALL_UPI_APPS) {
        try {
          // Try checking if the app's package is available via intent
          const canOpen = await Linking.canOpenURL(app.scheme);
          if (canOpen) {
            installed.push(app);
          }
        } catch (e) {
          // App not installed, skip
        }
      }

      // If no apps detected via scheme (Android 11+ may block canOpenURL), 
      // try opening a generic upi:// link to see if any UPI app exists
      if (installed.length === 0) {
        try {
          const canOpenUpi = await Linking.canOpenURL('upi://pay');
          if (canOpenUpi) {
            // UPI is available but we couldn't detect individual apps
            // Show all common apps and let the system handle it
            installed.push(...ALL_UPI_APPS.slice(0, 4)); // PhonePe, GPay, Paytm, Amazon
          }
        } catch (e) {}
      }
    } else {
      // On iOS/web, show common apps
      installed.push(...ALL_UPI_APPS.slice(0, 4));
    }

    setInstalledApps(installed);
    setIsDetectingApps(false);
  };

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

  const openUpiApp = async (methodId: string, methodName: string) => {
    const upiId = merchantUpiId || '';
    const name = merchantName || 'INtown';
    const payAmount = finalPaidAmount > 0 ? finalPaidAmount.toFixed(2) : '1';

    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${payAmount}&cu=INR&tn=INtownPayment`;

    const app = ALL_UPI_APPS.find(a => a.id === methodId);
    const packageName = app?.packageName;

    if (!packageName) return false;

    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: upiUri,
        packageName: packageName,
      });
      return true;
    } catch (error) {
      console.log(`${methodName} open failed`, error);
      return false;
    }
  };

  const handlePaymentMethodSelect = async (methodId: string, methodName: string) => {
    try {
      if (methodId === 'cash') {
        onSuccess(amountValue, intownSavings > 0 ? intownSavings : 0, methodName);
        setAmount('');
        setInstantSavingsInput('');
        setSelectedMethod('');
        setShowMethods(false);
        setShowSuccess(false);
        onClose();
        router.replace((redirectTo || '/member-dashboard') as any);
        return;
      }

      let opened = false;

      if (Platform.OS === 'android') {
        opened = await openUpiApp(methodId, methodName);
      }

      // iOS fallback
      if (!opened && Platform.OS === 'ios') {
        const iosSchemes: Record<string, string> = {
          phonepe: 'phonepe://',
          googlepay: 'tez://',
          paytm: 'paytmmp://',
          amazonpay: 'amazonpay://',
        };
        const scheme = iosSchemes[methodId];
        if (scheme) {
          try {
            await Linking.openURL(scheme);
            opened = true;
          } catch (e) {
            console.log(`iOS scheme failed for ${methodName}`);
          }
        }
      }

      if (opened) {
        onSuccess(amountValue, intownSavings > 0 ? intownSavings : 0, methodName);
        setAmount('');
        setInstantSavingsInput('');
        setSelectedMethod('');
        setShowMethods(false);
        onClose();
        router.replace((redirectTo || '/member-dashboard') as any);
      } else {
        // Fallback: open generic UPI chooser
        try {
          const upiId = merchantUpiId || '';
          const name = merchantName || 'INtown';
          const payAmount = finalPaidAmount > 0 ? finalPaidAmount.toFixed(2) : '1';
          const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${payAmount}&cu=INR&tn=INtownPayment`;
          await Linking.openURL(upiUri);
          onSuccess(amountValue, intownSavings > 0 ? intownSavings : 0, methodName);
          setAmount('');
          setInstantSavingsInput('');
          setSelectedMethod('');
          setShowMethods(false);
          onClose();
          router.replace((redirectTo || '/member-dashboard') as any);
        } catch (e) {
          Alert.alert(
            'App Not Found',
            `${methodName} is not installed on this device. Please install it from Play Store.`
          );
        }
      }
    } catch (error) {
      console.error('Open payment app error:', error);
      Alert.alert('Error', `Unable to open ${methodName}.`);
    }
  };

  const handleDismiss = () => {
    setShowSuccess(false);
    onClose();
  };

  const handleSuccessOk = async () => {
    setShowSuccess(false);
    setShowMethods(true);
    // Detect which UPI apps are installed on the device
    await detectInstalledApps();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
          ) : !showMethods ? (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment</Text>
                <TouchableOpacity onPress={handleDismiss}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.label}>Total Price</Text>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.amountPrefix}>₹</Text>
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
                  <Text style={styles.amountPrefix}>₹</Text>
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
                      ₹{intownSavings.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.savingsSection}>
                <View style={styles.savingsRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalInput}>
                    ₹{Number.isFinite(finalPaidAmount) && finalPaidAmount >= 0 ? finalPaidAmount.toFixed(2) : '0.00'}
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
              <View style={{ height: 20 }} />
            </ScrollView>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Payment App</Text>
                <TouchableOpacity onPress={handleDismiss}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {isDetectingApps ? (
                <View style={styles.detectingContainer}>
                  <ActivityIndicator size="large" color="#FF8A00" />
                  <Text style={styles.detectingText}>Detecting payment apps...</Text>
                </View>
              ) : (
                <ScrollView>
                  {installedApps.length > 0 ? (
                    <>
                      <Text style={styles.sectionLabel}>UPI Apps on your device</Text>
                      {installedApps.map((app) => (
                        <TouchableOpacity
                          key={app.id}
                          style={styles.methodCard}
                          onPress={() => handlePaymentMethodSelect(app.id, app.name)}
                        >
                          <View style={[styles.methodIcon, { backgroundColor: app.color + '15' }]}>
                            <Ionicons name={app.icon as any} size={26} color={app.color} />
                          </View>
                          <Text style={styles.methodName}>{app.name}</Text>
                          <Ionicons name="chevron-forward" size={24} color="#999" />
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <View style={styles.noAppsContainer}>
                      <Ionicons name="alert-circle-outline" size={40} color="#999" />
                      <Text style={styles.noAppsText}>No UPI apps detected</Text>
                    </View>
                  )}

                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Other</Text>

                  {/* Cash option always available */}
                  <TouchableOpacity
                    style={styles.methodCard}
                    onPress={() => handlePaymentMethodSelect('cash', 'Cash')}
                  >
                    <View style={[styles.methodIcon, { backgroundColor: '#E8F5E915' }]}>
                      <Ionicons name="cash" size={26} color="#4CAF50" />
                    </View>
                    <Text style={styles.methodName}>Cash</Text>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                </ScrollView>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  savingsSection: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 24 },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  savingsLabel: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  savingsValue: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
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
  payButton: { backgroundColor: '#FF8A00', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  payButtonDisabled: { opacity: 0.7 },
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 12 },
  methodIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  successContainer: { alignItems: 'center', paddingVertical: 24 },
  successIconWrap: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
  successButton: { backgroundColor: '#FF8A00', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  successButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  detectingContainer: { alignItems: 'center', paddingVertical: 40 },
  detectingText: { marginTop: 12, fontSize: 14, color: '#666' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  noAppsContainer: { alignItems: 'center', paddingVertical: 24 },
  noAppsText: { marginTop: 8, fontSize: 14, color: '#999' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },
});