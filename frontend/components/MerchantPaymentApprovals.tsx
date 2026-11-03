import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GradientSectionHeading } from './GradientSectionHeading';
import { approvePayment, getPendingPayments, PendingPayment } from '../utils/paymentApprovals';

export function MerchantPaymentApprovals({ merchantId, token, onApproved }: {
  merchantId: string | number | null; token?: string | null; onApproved?: () => void;
}) {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const currentMerchant = useRef(merchantId);
  currentMerchant.current = merchantId;
  const currency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  useEffect(() => {
    setPayments([]); setLoading(true); setError(''); setNotice('');
  }, [merchantId]);

  useFocusEffect(useCallback(() => {
    if (!merchantId) { setLoading(false); return; }
    let active = true;
    let fetching = false;
    const refresh = async () => {
      if (fetching || lock.current) return;
      fetching = true;
      try {
        const list = await getPendingPayments(merchantId, token);
        if (active) { setPayments(list); setError(''); }
      } catch (reason: any) { if (active) setError(reason.message); }
      finally { fetching = false; if (active) setLoading(false); }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [merchantId, token, revision]));

  const approve = async (payment: PendingPayment) => {
    if (lock.current || String(payment.merchantId) !== String(merchantId)) return;
    lock.current = true; setBusy(payment.transactionId); setError(''); setNotice('');
    try {
      const result = await approvePayment(payment.transactionId, token);
      if (currentMerchant.current !== merchantId) return;
      setPayments(previous => previous.filter(item => item.transactionId !== payment.transactionId));
      setNotice(result.pointsEarned != null
        ? `Approved. ${result.pointsEarned} INcoins credited to Customer #${payment.customerId}.`
        : 'Payment approved. The customer’s INcoins balance will refresh.');
      onApproved?.();
    } catch (reason: any) { if (currentMerchant.current === merchantId) setError(reason.message); }
    finally { lock.current = false; setBusy(null); setRevision(value => value + 1); }
  };

  return <View style={styles.section} testID="merchant-payment-approvals">
    <View style={styles.heading}><Ionicons name="wallet-outline" color="#F58200" size={22} /><GradientSectionHeading style={styles.title}>{`INcoins approvals (${payments.length})`}</GradientSectionHeading>
      <TouchableOpacity accessibilityLabel="Refresh INcoins approvals" onPress={() => setRevision(value => value + 1)}><Ionicons name="refresh" size={20} color="#F58200" /></TouchableOpacity></View>
    <Text style={styles.subtitle}>Verify each customer payment before approving their INcoins.</Text>
    {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
    {loading ? <ActivityIndicator color="#FF8A00" /> : !payments.length && !error ? <Text style={styles.subtitle}>No payments awaiting approval.</Text> : null}
    {payments.map(payment => <View key={payment.transactionId} style={styles.payment} testID={`payment-approval-${payment.transactionId}`}>
      <Text style={styles.customer}>{payment.customerName || `Customer #${payment.customerId}`}</Text>
      <Text style={styles.subtitle}>Transaction #{payment.transactionId} · Awaiting your approval</Text>
      <Text style={styles.amount}>Payment: {currency(payment.payablePrice)} · Bill: {currency(payment.totalPrice)}</Text>
      <Text style={styles.reward}>{payment.pointsEarned != null
        ? `Customer receives ${payment.pointsEarned} INcoins on your approval.`
        : 'Customer receives INcoins after your approval. The server calculates the reward.'}</Text>
      <TouchableOpacity disabled={busy !== null} onPress={() => approve(payment)} style={[styles.button, busy !== null && { opacity: 0.5 }]} accessibilityRole="button" testID={`approve-payment-${payment.transactionId}`}>
        {busy === payment.transactionId ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Approve payment & INcoins</Text>}
      </TouchableOpacity>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 18, padding: 16, backgroundColor: '#FFF', borderRadius: 20 },
  heading: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }, title: { flex: 1, fontSize: 17, fontWeight: '800', color: '#202020' },
  subtitle: { fontSize: 12, color: '#667085', lineHeight: 18, marginBottom: 8 },
  payment: { paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEE' }, customer: { fontSize: 15, color: '#222', fontWeight: '700', marginBottom: 4 },
  amount: { fontSize: 13, color: '#344054', marginBottom: 8 }, reward: { fontSize: 13, lineHeight: 20, color: '#995000', backgroundColor: '#FFF5E5', padding: 10, borderRadius: 10 },
  button: { padding: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#FF8A00', marginTop: 10 }, buttonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  error: { fontSize: 13, color: '#B42318', marginVertical: 8 }, notice: { fontSize: 13, color: '#15803D', marginVertical: 8 },
});
