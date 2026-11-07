import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTION_HEADING_TYPOGRAPHY } from './GradientSectionHeading';
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
        ? `Approved. ${result.pointsEarned} INcoins credited to ${payment.customerName || 'the customer'}.`
        : 'Payment approved. The customer’s INcoins balance will refresh.');
      onApproved?.();
    } catch (reason: any) { if (currentMerchant.current === merchantId) setError(reason.message); }
    finally { lock.current = false; setBusy(null); setRevision(value => value + 1); }
  };

  return <View style={styles.section} testID="merchant-payment-approvals">
    <LinearGradient colors={['#FF7900', '#FFC52B', '#FF3868']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topLine} />
    <View style={styles.heading}>
      <View style={styles.wallet}><Ionicons name="wallet-outline" color="#FF6900" size={23} /><View style={styles.coin}><Text style={styles.coinText}>₹</Text></View></View>
      <Text style={styles.title}>INcoins approvals</Text>
      <LinearGradient colors={['#FF7928', '#FF3E67']} style={styles.count}><Text style={styles.countText}>{payments.length}</Text></LinearGradient>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.refresh} accessibilityRole="button" accessibilityLabel="Refresh INcoins approvals" onPress={() => setRevision(value => value + 1)}><Ionicons name="refresh" size={17} color="#FF6900" /></TouchableOpacity>
    </View>
    <Text style={styles.subtitle}>Verify each customer payment before approving their INcoins.</Text>
    {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    {!!notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}
    {loading ? <ActivityIndicator color="#FF8A00" /> : !payments.length && !error ? <Text style={styles.subtitle}>No payments awaiting approval.</Text> : null}
    {payments.map(payment => <View key={payment.transactionId} style={styles.payment} testID={`payment-approval-${payment.transactionId}`}>
      <View style={styles.identity}>
        <LinearGradient colors={['#9460FF', '#D442D0']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.avatar}><Text style={styles.initials}>{payment.customerName?.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?'}</Text></LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.customer}>{payment.customerName || 'Customer name unavailable'}</Text>
          <View style={styles.transactionRow}><Text style={styles.transaction}>Transaction #{payment.transactionId}</Text><View style={styles.separator} /><View style={styles.status}><View style={styles.statusDot} /><Text style={styles.statusText}>Awaiting approval</Text></View></View>
        </View>
      </View>
      <View style={styles.breakdown}>
        <View style={styles.paid}><Text style={styles.paidLabel}>CUSTOMER PAID</Text><Text style={styles.paidAmount}>{currency(payment.payablePrice)}</Text></View>
        <View style={styles.bill}><Text style={styles.billLabel}>TOTAL BILL</Text><Text style={styles.billAmount}>{currency(payment.totalPrice)}</Text></View>
        <View style={styles.discount}><Text style={styles.discountLabel}>DISCOUNT</Text><Text style={styles.discountValue}>{currency(Math.max(0, Number(payment.totalPrice) - Number(payment.payablePrice)))} off</Text></View>
      </View>
      <View style={styles.reward}>
        <View style={styles.star}><Ionicons name="star" size={11} color="#FFF" /></View>
        <View style={{ flex: 1 }}><Text style={styles.rewardTitle}>{payment.pointsEarned != null ? `Customer receives ${payment.pointsEarned} INcoins automatically after approval.` : 'Customer receives INcoins automatically after approval.'}</Text><Text style={styles.rewardDetail}>The server calculates the cashback points &amp; reward instantly.</Text></View>
      </View>
      <TouchableOpacity disabled={busy !== null} onPress={() => approve(payment)} style={[styles.buttonWrap, busy !== null && { opacity: 0.5 }]} accessibilityRole="button" testID={`approve-payment-${payment.transactionId}`}>
        <LinearGradient colors={['#FF7B12', '#F45100']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          {busy === payment.transactionId ? <ActivityIndicator color="#FFF" /> : <><View style={styles.check}><Ionicons name="checkmark" size={15} color="#FFF" /></View><Text style={styles.buttonText}>Approve payment &amp; INcoins</Text></>}
        </LinearGradient>
      </TouchableOpacity>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 16, padding: 16, paddingTop: 20, backgroundColor: '#FFFDFC', borderRadius: 26, borderWidth: 1, borderColor: '#FFE0BC', overflow: 'hidden', shadowColor: '#E98830', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  heading: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }, title: { ...SECTION_HEADING_TYPOGRAPHY, color: '#101E34', flexShrink: 1 },
  wallet: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: '#FFCEA0', backgroundColor: '#FFF8EE', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  coin: { position: 'absolute', right: -3, top: -5, width: 17, height: 17, backgroundColor: '#FFD044', borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, coinText: { color: '#9D5B00', fontSize: 10, fontWeight: '800' },
  count: { minWidth: 21, height: 21, paddingHorizontal: 5, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, countText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  refresh: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 12, color: '#667085', lineHeight: 18, marginBottom: 8 },
  payment: { paddingTop: 14, marginTop: 6, borderTopWidth: 1, borderTopColor: '#E7EDF4' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }, avatar: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, initials: { color: '#FFF', fontWeight: '800', fontSize: 12 }, customer: { fontSize: 14, color: '#101E34', fontWeight: '800', marginBottom: 5 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }, transaction: { color: '#72839D', fontSize: 11 }, separator: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#CBD6E5' }, status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FFD47A', borderRadius: 20 }, statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFA000' }, statusText: { fontSize: 10, color: '#D58200', fontWeight: '600' },
  breakdown: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F7F9FF', borderWidth: 1, borderColor: '#DFE8FF', borderRadius: 17, padding: 12, marginBottom: 12 },
  paid: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: '#D0DAEB', borderStyle: 'dashed', paddingRight: 8 }, bill: { flex: 1, minWidth: 0 }, paidLabel: { fontSize: 9, fontWeight: '700', color: '#00A58B', marginBottom: 4 }, paidAmount: { color: '#00A58B', fontSize: 20, fontWeight: '800' }, billLabel: { fontSize: 9, fontWeight: '700', color: '#8A9ABA', marginBottom: 4 }, billAmount: { color: '#1A2A43', fontSize: 20, fontWeight: '800' },
  discount: { borderWidth: 1, borderColor: '#8EEAC7', backgroundColor: '#DBFCEE', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 }, discountLabel: { color: '#00896C', fontSize: 9, fontWeight: '800', textAlign: 'center' }, discountValue: { color: '#00896C', fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  reward: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderWidth: 1, borderColor: '#FFDA7C', backgroundColor: '#FFFBEC', borderRadius: 17 }, star: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F4A000', alignItems: 'center', justifyContent: 'center', marginTop: 2 }, rewardTitle: { fontSize: 12, fontWeight: '700', color: '#984500', lineHeight: 15 }, rewardDetail: { fontSize: 11, color: '#B8732B', lineHeight: 16, marginTop: 4 },
  buttonWrap: { marginTop: 12, borderRadius: 17, shadowColor: '#F76A00', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }, button: { paddingVertical: 14, paddingHorizontal: 8, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, check: { width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  error: { fontSize: 13, color: '#B42318', marginVertical: 8 }, notice: { fontSize: 13, color: '#15803D', marginVertical: 8 },
});
