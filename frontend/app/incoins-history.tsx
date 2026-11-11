import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { INCoinsWalletCard } from '../components/incoins/INCoinsWalletCard';
export default function INCoinsHistoryScreen() {
  const router = useRouter();
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F2' }}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ minHeight: 48, padding: 16 }}><Text style={{ color: '#A94800', fontWeight: '700' }}>Back</Text></TouchableOpacity><ScrollView><INCoinsWalletCard history /></ScrollView></SafeAreaView>;
}
