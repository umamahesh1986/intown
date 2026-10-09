import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShopDetailRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  tintBg: string;
  label: string;
  value: string;
  valueColor?: string;
  accessory?: React.ReactNode;
  last?: boolean;
  testID?: string;
}

export const ShopDetailRow = ({ icon, tint, tintBg, label, value, valueColor, accessory, last, testID }: ShopDetailRowProps) => (
  <View style={[rowStyles.row, last && rowStyles.rowLast]} testID={testID}>
    <View style={[rowStyles.iconTile, { backgroundColor: tintBg }]}>
      <Ionicons name={icon} size={16} color={tint} />
    </View>
    <View style={rowStyles.body}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
    {accessory ? <View style={rowStyles.accessory}>{accessory}</View> : null}
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  label: { fontSize: 11, color: '#8A94A6', marginBottom: 3, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', lineHeight: 20 },
  accessory: { marginLeft: 8 },
});
