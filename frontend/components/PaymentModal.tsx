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
import { Ionicons } from '@expo/vector-icons';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number, savings: number, paymentMethod: string) => void;
}

const PAYMENT_METHODS = [
  { id: 'phonepe', name: 'PhonePe', icon: 'call' },
  { id: 'googlepay', name: 'Google Pay', icon: 'logo-google' },
  { id: 'paytm', name: 'Paytm', icon: 'wallet' },
  { id: 'cash', name: 'Cash', icon: 'cash' },
];

export default function PaymentModal({ visible, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showMethods, setShowMethods] = useState(false);

  const instantSavings = parseFloat(amount || '0') * 0.1;
  const totalPayable = parseFloat(amount || '0') - instantSavings;

  const handlePayNow = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setShowMethods(true);
  };

  const handlePaymentMethodSelect = (methodId: string, methodName: string) => {
    // Simulate payment processing
    Alert.alert(
      'Payment Successful!',
      `Paid ₹${totalPayable.toFixed(2)} via ${methodName}\nYou saved ₹${instantSavings.toFixed(2)}!`,
      [{
        text: 'OK',
        onPress: () => {
          onSuccess(parseFloat(amount), instantSavings, methodName);
          setAmount('');
          setSelectedMethod('');
          setShowMethods(false);
          onClose();
        },
      }]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!showMethods ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment</Text>
                <TouchableOpacity onPress={onClose}>
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

              <View style={styles.savingsSection}>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>Instant Savings</Text>
                  <Text style={styles.savingsValue}>₹{instantSavings.toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.savingsRow}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalValue}>₹{totalPayable.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                <Text style={styles.payButtonText}>Submit</Text>
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
  savingsValue: { fontSize: 18, fontWeight: '600', color: '#2E7D32' },
  divider: { height: 1, backgroundColor: '#C8E6C9', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
  payButton: { backgroundColor: '#FF6600', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  payButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 12 },
  methodIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
});