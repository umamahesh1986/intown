import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useINCoinsStore } from '../../store/incoinsStore';
import { transactionTitle } from '../../utils/incoins';
import { walletStyles as s } from './walletStyles';
export function INCoinsHistoryList({ limit }: { limit?: number }) {
  const { transactions, loading, historyError, refresh } = useINCoinsStore();
  if (loading && !transactions.length) return <ActivityIndicator color="#FF7900" accessibilityLabel="Loading INCoins activity" />;
  if (historyError) return <View><Text style={s.error}>{historyError}</Text><TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => void refresh()}><Text style={s.buttonText}>Retry history</Text></TouchableOpacity></View>;
  if (!transactions.length) return <Text style={s.copy}>No INCoins activity yet. Your referral and cashback rewards will appear here.</Text>;
  const items = transactions.slice(0, limit ?? transactions.length);
  return <View>{items.map((item, index) => {
    const referral = item.transactionType === 'REFERRAL_BONUS' || item.transactionType === 'JOINING_BONUS';
    const debit = item.coins < 0;
    const color = debit ? '#334155' : referral ? '#FF7900' : '#00A878';
    const date = item.created ? new Date(item.created) : null;
    const dateLabel = date && Number.isFinite(date.getTime())
      ? date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Date unavailable';
    const amount = `${item.coins > 0 ? '+' : ''}${item.coins.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    return <View key={item.id} style={[styles.item, index < items.length - 1 && styles.divider]} testID={`incoins-activity-${item.id}`}>
      <View style={[styles.icon, { backgroundColor: debit ? '#F1F5F9' : referral ? '#FFF7ED' : '#ECFDF5' }]}>
        <Ionicons name={debit ? 'log-out-outline' : referral ? 'add' : 'checkmark'} size={19} color={color} />
      </View>
      <View style={styles.copy}><Text style={styles.title}>{transactionTitle(item.transactionType)}</Text>
        <View style={styles.details}>{!!item.description && <Text style={styles.description}>{item.description}</Text>}<Text style={styles.date}>{item.description ? ' · ' : ''}{dateLabel}</Text></View>
      </View>
      <View style={styles.amountColumn} accessible accessibilityLabel={`${amount} INCoins`}>
        <Text style={[styles.amount, { color }]}>{amount}</Text>
        <Text style={styles.status}>{debit ? 'Debited' : item.coins > 0 ? 'Credited' : 'Recorded'}</Text>
      </View>
    </View>;
  })}</View>;
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#F0F3F8' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: '#14223B', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 2 },
  description: { color: '#71829B', fontSize: 10, lineHeight: 15, flexShrink: 1 },
  date: { color: '#71829B', fontSize: 10, lineHeight: 15 },
  amountColumn: { alignItems: 'flex-end', maxWidth: '30%' },
  amount: { fontSize: 12, lineHeight: 18, fontWeight: '800' },
  status: { color: '#94A3B8', fontSize: 9, lineHeight: 14, marginTop: 1 },
});
