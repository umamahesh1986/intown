import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MerchantPlan, merchantPlanTotal, merchantPlanGst } from '../utils/merchantPlans';

type Status = 'active' | 'upgrade' | 'included' | 'select';

interface MerchantPlanCardProps {
  plan: MerchantPlan;
  status: Status;
  processing?: boolean;
  onPress?: () => void;
}

const CTA: Record<Status, string> = {
  active: 'CURRENT PACK',
  upgrade: 'Upgrade to LAUNCH',
  included: 'Included in your pack',
  select: 'Choose pack',
};

export const MerchantPlanCard = ({ plan, status, processing, onPress }: MerchantPlanCardProps) => {
  const highlight = status === 'active' || (status !== 'included' && plan.recommended);
  const disabled = status === 'active' || status === 'included' || !!processing;
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]} testID={`merchant-plan-card-${plan.id}`}>
      {status === 'active' ? (
        <View style={[styles.ribbon, styles.ribbonActive]} testID={`merchant-plan-active-${plan.id}`}>
          <Ionicons name="checkmark-circle" size={12} color="#FFF" />
          <Text style={styles.ribbonText}>ACTIVE</Text>
        </View>
      ) : plan.recommended ? (
        <View style={styles.ribbon}>
          <Ionicons name="star" size={11} color="#FFF" />
          <Text style={styles.ribbonText}>RECOMMENDED</Text>
        </View>
      ) : null}

      <Text style={styles.name}>{plan.name}</Text>
      <Text style={styles.tagline}>{plan.tagline}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.currency}>₹</Text>
        <Text style={styles.price}>{plan.basePrice}</Text>
        <Text style={styles.priceNote}>/- + GST</Text>
      </View>
      <Text style={styles.total}>
        Total ₹{merchantPlanTotal(plan).toFixed(0)} (incl. ₹{merchantPlanGst(plan).toFixed(0)} GST) · one-time
      </Text>

      <View style={styles.features}>
        {plan.features.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <Ionicons
              name={f.included ? 'checkmark-circle' : 'close-circle-outline'}
              size={16}
              color={f.included ? '#2E7D32' : '#C4C9D1'}
            />
            <Text style={[styles.featureText, !f.included && styles.featureMuted]}>{f.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.cta,
          status === 'active' && styles.ctaActive,
          status === 'included' && styles.ctaMuted,
          (status === 'upgrade' || status === 'select') && styles.ctaPrimary,
        ]}
        disabled={disabled}
        onPress={onPress}
        testID={`merchant-plan-cta-${plan.id}`}
      >
        {processing && (status === 'upgrade' || status === 'select') ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={[styles.ctaText, (status === 'active' || status === 'included') && styles.ctaTextDark]}>
            {CTA[status]}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EEF0F3',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHighlight: { borderColor: '#FF8A00' },
  ribbon: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF8A00',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  ribbonActive: { backgroundColor: '#2E7D32' },
  ribbonText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  name: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 },
  currency: { fontSize: 18, fontWeight: '800', color: '#FF8A00', marginBottom: 4 },
  price: { fontSize: 34, fontWeight: '900', color: '#1A1A1A', lineHeight: 38 },
  priceNote: { fontSize: 13, color: '#6B7280', marginBottom: 6, marginLeft: 4 },
  total: { fontSize: 12, color: '#8A94A6', marginTop: 2 },
  features: { marginTop: 14, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13.5, color: '#1F2937', fontWeight: '500' },
  featureMuted: { color: '#9AA3B2', textDecorationLine: 'line-through' },
  cta: { marginTop: 18, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  ctaPrimary: { backgroundColor: '#FF8A00' },
  ctaActive: { backgroundColor: '#E8F5E9' },
  ctaMuted: { backgroundColor: '#F3F4F6' },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  ctaTextDark: { color: '#2E7D32' },
});
