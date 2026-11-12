import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function MerchantProfileHeader({ name, category, years, onPress }: {
  name: string; category: string; years?: string | number | null; onPress: () => void;
}) {
  const value = String(years ?? '').trim();
  const yearsLabel = /^\d+(?:\.\d+)?$/.test(value) ? `${value} ${Number(value) === 1 ? 'year' : 'years'}` : value;
  return <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}
    accessibilityRole="button" accessibilityLabel={`Edit ${name} merchant profile`} testID="merchant-profile-header">
    <View style={s.icon}><Ionicons name="storefront" size={38} color="#FFF" /></View>
    <Text style={s.name}>{name}</Text>
    <Text style={s.category}>{category}</Text>
    {!!yearsLabel && <View style={s.badge}><Text style={s.years}>{yearsLabel}</Text></View>}
  </TouchableOpacity>;
}

const s = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 16, backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#F0F3F8', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, minHeight: 224, shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 1 },
  icon: { width: 80, height: 80, borderRadius: 17, backgroundColor: '#387DF8', alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 3, elevation: 3 },
  name: { color: '#17243A', fontSize: 20, lineHeight: 25, fontWeight: '800', textAlign: 'center' },
  category: { color: '#94A3B8', fontSize: 12, lineHeight: 18, fontWeight: '500', textAlign: 'center', marginTop: 1 },
  badge: { backgroundColor: '#F2F6F9', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5, marginTop: 11 },
  years: { color: '#647E9F', fontSize: 11, lineHeight: 15 },
});
