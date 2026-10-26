import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MerchantPlanCard } from './MerchantPlanCard';
import {
  MERCHANT_PLANS,
  MerchantPlan,
  MerchantPlanId,
  getMerchantPlan,
  setMerchantPlan,
  merchantPlanRank,
  merchantPlanTotal,
} from '../utils/merchantPlans';
import { getMerchantDetailsById } from '../utils/api';
import { payForMerchantPlan, isPaymentCancelled } from '../utils/merchantPlanPayment';

const toMobile = (v?: string | null) => String(v || '').replace(/\D/g, '').slice(-10);

// Finds the merchant's 10-digit mobile from the merchant API or the login session
const resolveMobile = async (merchant: any | null) => {
  const candidates = [merchant?.phoneNumber, await AsyncStorage.getItem('user_phone'), await AsyncStorage.getItem('merchant_phone')];
  try {
    const raw = await AsyncStorage.getItem('user_data');
    if (raw) candidates.push(JSON.parse(raw)?.phone);
  } catch {}
  return candidates.map(toMobile).find((m) => /^[6-9]\d{9}$/.test(m)) || '';
};

interface MerchantPlansSectionProps {
  showHero?: boolean;
  onPlanChanged?: (plan: MerchantPlanId) => void;
}

// START / LAUNCH pack cards with Razorpay "Choose pack" / "Upgrade" (used on Privilege page + My Account)
export const MerchantPlansSection = ({ showHero = true, onPlanChanged }: MerchantPlansSectionProps) => {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  const [activePlan, setActivePlan] = useState<MerchantPlanId | null>(null);
  const [processing, setProcessing] = useState<MerchantPlanId | null>(null);

  const load = useCallback(async () => {
    const id = (await AsyncStorage.getItem('merchant_id'))?.trim() || null;
    setMerchantId(id);
    const [plan, details] = await Promise.all([getMerchantPlan(id), id ? getMerchantDetailsById(id) : null]);
    setActivePlan(plan);
    setMerchant(details);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(() => {
    load();
  }, [load]);

  const statusFor = (plan: MerchantPlan) => {
    if (activePlan === plan.id) return 'active' as const;
    if (merchantPlanRank(plan.id) < merchantPlanRank(activePlan)) return 'included' as const;
    return activePlan ? ('upgrade' as const) : ('select' as const);
  };

  const buy = async (plan: MerchantPlan) => {
    const mobile = await resolveMobile(merchant);
    if (!mobile) {
      Alert.alert('Phone number missing', 'We could not find your registered mobile number. Please update it in My Account and try again.');
      return;
    }
    setProcessing(plan.id);
    try {
      await payForMerchantPlan({
        plan,
        mobileNumber: mobile,
        contactName: merchant?.contactName,
        email: merchant?.email,
        merchantId,
        description: activePlan ? `INtown Merchant upgrade to ${plan.name}` : `INtown Merchant ${plan.name} Pack`,
        noteType: activePlan ? 'MERCHANT_UPGRADE' : 'MERCHANT_PLAN',
      });
      await setMerchantPlan(merchantId, plan.id);
      setActivePlan(plan.id);
      onPlanChanged?.(plan.id);
      Alert.alert(
        'Payment successful',
        `Your shop is now on the ${plan.name} pack (₹${merchantPlanTotal(plan).toFixed(0)} paid incl. 18% GST). New features are unlocked.`,
      );
    } catch (err: any) {
      const cancelled = isPaymentCancelled(err);
      Alert.alert(
        cancelled ? 'Payment cancelled' : 'Payment failed',
        cancelled ? 'You cancelled the payment. You can choose a pack anytime.' : err?.message || err?.description || 'Something went wrong. Please try again.',
      );
    } finally {
      setProcessing(null);
    }
  };

  const current = MERCHANT_PLANS.find((p) => p.id === activePlan) || null;

  return (
    <View testID="merchant-plans-section">
      {showHero && (
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="storefront" size={22} color="#FF8A00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{merchant?.businessName || 'Your shop'}</Text>
            <Text style={styles.heroSub} testID="merchant-current-plan">
              {current ? `Current pack: ${current.name} · ₹${current.basePrice}/-` : 'No pack recorded for this shop yet'}
            </Text>
          </View>
        </View>
      )}

      {activePlan === 'LAUNCH' ? (
        <View style={styles.infoBox} testID="merchant-plan-top-banner">
          <Ionicons name="trophy" size={16} color="#2E7D32" />
          <Text style={styles.infoText}>You're on our top pack — every INtown merchant feature is unlocked.</Text>
        </View>
      ) : (
        <View style={styles.infoBox} testID="merchant-plan-upgrade-banner">
          <Ionicons name="rocket-outline" size={16} color="#FF8A00" />
          <Text style={styles.infoText}>
            {activePlan
              ? `Upgrade to LAUNCH to unlock Pick @ store, Slot Booking, Circles and featured visibility. Pay ₹${merchantPlanTotal(MERCHANT_PLANS[1]).toFixed(0)} once (₹999 + 18% GST) via Razorpay.`
              : 'Choose a pack to activate your shop on INtown. Prices are one-time and include 18% GST; payment is via Razorpay.'}
          </Text>
        </View>
      )}

      {MERCHANT_PLANS.map((plan) => (
        <MerchantPlanCard
          key={plan.id}
          plan={plan}
          status={statusFor(plan)}
          processing={processing === plan.id}
          onPress={() => buy(plan)}
        />
      ))}

      <Text style={styles.footnote}>
        Packs are one-time payments with lifetime INtown access. Payments are processed securely by Razorpay; GST invoice is sent to your registered email.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF0F3',
  },
  heroIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  heroSub: { fontSize: 12.5, color: '#6B7280', marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF7EE',
    borderWidth: 1,
    borderColor: '#FFE0BF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12.5, color: '#4B5563', lineHeight: 18 },
  footnote: { fontSize: 11.5, color: '#8A94A6', lineHeight: 16, textAlign: 'center', marginTop: 4 },
});
