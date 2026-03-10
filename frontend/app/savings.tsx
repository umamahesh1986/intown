import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SavingsTransaction {
  id: string;
  date: string;
  shopName: string;
  amount: number;
  savings: number;
  category: string;
}

interface SavingsSummary {
  today: number;
  thisMonth: number;
  thisYear: number;
  totalTransactions: number;
}

export default function Savings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [summary, setSummary] = useState<SavingsSummary>({
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    totalTransactions: 0,
  });

  const fetchSavingsData = async () => {
    try {
      // TODO: Replace with actual API call when available
      // For now, show empty state with mock structure
      const customerId = await AsyncStorage.getItem('customer_id');
      
      // Simulated empty data - replace with actual API integration
      setTransactions([]);
      setSummary({
        today: 0,
        thisMonth: 0,
        thisYear: 0,
        totalTransactions: 0,
      });
    } catch (error) {
      console.error('Error fetching savings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavingsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Savings</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6600" />
          <Text style={styles.loadingText}>Loading savings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Savings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6600']} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="today" size={24} color="#FF6600" />
            </View>
            <Text style={styles.summaryLabel}>Today's Savings</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.today)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {formatCurrency(summary.thisMonth)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="trending-up" size={24} color="#2196F3" />
            </View>
            <Text style={styles.summaryLabel}>This Year</Text>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
              {formatCurrency(summary.thisYear)}
            </Text>
          </View>
        </View>

        {/* Total Savings Banner */}
        <View style={styles.totalBanner}>
          <Ionicons name="wallet" size={32} color="#FFF" />
          <View style={styles.totalBannerText}>
            <Text style={styles.totalLabel}>Total Savings</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.thisYear)}</Text>
          </View>
          <Text style={styles.totalTransactions}>
            {summary.totalTransactions} Transactions
          </Text>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color="#DDD" />
              <Text style={styles.emptyTitle}>No Savings Yet</Text>
              <Text style={styles.emptyText}>
                Start shopping at INtown partner stores to earn savings on every purchase!
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/user-dashboard')}
              >
                <Ionicons name="search" size={20} color="#FFF" />
                <Text style={styles.exploreButtonText}>Explore Shops</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="storefront" size={24} color="#FF6600" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionShop}>{transaction.shopName}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionSavings}>
                    Saved {formatCurrency(transaction.savings)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How Savings Work</Text>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Shop at INtown partner stores</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Pay using INtown app</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Get instant savings on every purchase</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  content: { flex: 1 },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#FF6600' },
  totalBanner: {
    backgroundColor: '#FF6600',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalBannerText: { flex: 1, marginLeft: 16 },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  totalValue: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  totalTransactions: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  transactionsSection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  exploreButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: { marginLeft: 12, flex: 1 },
  transactionShop: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  transactionDate: { fontSize: 12, color: '#999', marginTop: 2 },
  transactionCategory: { fontSize: 12, color: '#FF6600', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  transactionSavings: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  howItWorks: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  howItWorksTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  stepContainer: { gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  stepText: { fontSize: 14, color: '#666', flex: 1 },
});
