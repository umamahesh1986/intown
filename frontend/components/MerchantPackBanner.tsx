import { MerchantCardAccent, merchantCardSurface } from './MerchantCardAccent';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMerchantPlan, getMerchantPlanById, MerchantPlanId } from '../utils/merchantPlans';

// Compact "your INtown pack" card for dashboards → Privilege page (Razorpay checkout lives there)
export const MerchantPackBanner = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<MerchantPlanId | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      AsyncStorage.getItem('merchant_id').then(id => getMerchantPlan(id)).then(value => {
        if (active) setPlan(value);
      });
      return () => { active = false; };
    }, []),
  );

  const info = getMerchantPlanById(plan);
  const top = plan === 'LAUNCH';
  return (
    <TouchableOpacity style={[merchantCardSurface, styles.card]} disabled={top} onPress={() => { if (!top) router.push('/plans'); }} activeOpacity={0.85} testID="merchant-pack-banner">
      <MerchantCardAccent />
      <View style={[styles.icon, top && styles.iconTop]}>
        <Ionicons name="volume-high-outline" size={20} color={top ? '#00A878' : '#FF8A00'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} testID="merchant-pack-banner-title">
          {info ? `${info.name} PACK - ₹${info.basePrice}/-` : 'Choose your INtown pack'}
        </Text>
        <Text style={styles.sub}>
          {top ? 'All merchant features unlocked' : info ? 'Upgrade to LAUNCH for Pick @ store, Slot Booking & more' : 'No pack recorded. Select START or LAUNCH to activate your shop.'}
        </Text>
      </View>
      {top && <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>}
      {!top && (
        <View style={[styles.cta, plan === 'START' && styles.upgradeCta]}>
          <Text style={styles.ctaText}>{plan === 'START' ? 'Upgrade to LAUNCH' : 'Choose pack'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE8CC', alignItems: 'center', justifyContent: 'center' },
  iconTop: { backgroundColor: '#D1FAE5' },
  title: { fontSize: 12, lineHeight: 17, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 11, color: '#94A3B8', marginTop: 2, lineHeight: 16 },
  activeBadge: { alignSelf: 'flex-start', marginTop: 1, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#99F6CD', backgroundColor: '#ECFDF5', borderRadius: 20 },
  activeText: { fontSize: 10, fontWeight: '600', color: '#047857' },
  cta: { backgroundColor: '#FF8A00', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  upgradeCta: { backgroundColor: '#2E7D32' },
  ctaText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
