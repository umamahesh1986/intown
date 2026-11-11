import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useINCoinsStore } from '../../store/incoinsStore';
import { transactionTitle } from '../../utils/incoins';
import { walletStyles as s } from './walletStyles';
export function INCoinsHistoryList({ limit }: { limit?: number }) {
  const { transactions, loading, historyError, refresh } = useINCoinsStore();
  if (loading && !transactions.length) return <ActivityIndicator color="#FF7900" accessibilityLabel="Loading INCoins activity" />;
  if (historyError) return <View><Text style={s.error}>{historyError}</Text><TouchableOpacity style={s.button} accessibilityRole="button" onPress={() => void refresh()}><Text style={s.buttonText}>Retry history</Text></TouchableOpacity></View>;
  if (!transactions.length) return <Text style={s.copy}>No INCoins activity yet. Your referral and cashback rewards will appear here.</Text>;
  return <View>{transactions.slice(0, limit ?? transactions.length).map(item => <View key={item.id} style={s.section}>
    <View style={s.row}><Text style={s.reward}>{transactionTitle(item.transactionType)}</Text><Text style={[s.reward, item.coins < 0 && { color: '#B42318' }]}>{item.coins > 0 ? '+' : ''}{item.coins.toFixed(2)} INCoins</Text></View>
    {!!item.description && <Text style={s.copy}>{item.description}</Text>}
    <Text style={s.caption}>{item.created && Number.isFinite(new Date(item.created).getTime()) ? new Date(item.created).toLocaleString() : 'Date unavailable'}</Text>
  </View>)}</View>;
}
