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
      AsyncStorage.getItem('merchant_id').then((id) => getMerchantPlan(id).then(setPlan));
    }, []),
  );

  const info = getMerchantPlanById(plan);
  const top = plan === 'LAUNCH';
  return (
    <TouchableOpacity style={[styles.card, top && styles.cardTop]} onPress={() => router.push('/plans')} activeOpacity={0.85} testID="merchant-pack-banner">
      <View style={[styles.icon, top && styles.iconTop]}>
        <Ionicons name={top ? 'rocket' : 'storefront'} size={20} color={top ? '#2E7D32' : '#FF8A00'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} testID="merchant-pack-banner-title">
          {info ? `${info.name} pack · ₹${info.basePrice}/-` : 'No INtown pack yet'}
        </Text>
        <Text style={styles.sub}>
          {top ? 'All merchant features unlocked' : info ? 'Upgrade to LAUNCH for Pick @ store, Slot Booking & more' : 'Choose a pack to activate your shop (pay via Razorpay)'}
        </Text>
      </View>
      {!top && (
        <View style={styles.cta}>
          <Text style={styles.ctaText}>{info ? 'Upgrade' : 'Choose pack'}</Text>
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
    marginTop: 14,
    backgroundColor: '#FFF7EE',
    borderWidth: 1,
    borderColor: '#FFE0BF',
    borderRadius: 16,
    padding: 14,
  },
  cardTop: { backgroundColor: '#EEF9F1', borderColor: '#BFE6CC' },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE8CC', alignItems: 'center', justifyContent: 'center' },
  iconTop: { backgroundColor: '#D7F0DE' },
  title: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  sub: { fontSize: 11.5, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  cta: { backgroundColor: '#FF8A00', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  ctaText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
