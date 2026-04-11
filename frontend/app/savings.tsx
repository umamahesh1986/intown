import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { INTOWN_API_BASE } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiTransaction {
  transactionId: number;
  businessName?: string;
  merchantName?: string;
  totalPrice?: number;
  inTownPrice?: number;
  intownSavings?: number;
  payablePrice?: number;
  transactionDate: string;
}

interface ApiPeriodData {
  totalPrice?: number;
  intownPrice?: number;
  intownSavings?: number;
  totalPayablePrice?: number;
  transactionCount?: number;
}

interface SavingsApiResponse {
  today: ApiPeriodData;
  thisMonth: ApiPeriodData;
  thisYear: ApiPeriodData;
  lifetime: ApiPeriodData;
  transactions: ApiTransaction[];
}

interface SavingsTransaction {
  id: string;
  date: string;
  businessName: string;
  amount: number;
  savings: number;
  paidAmount: number;
}

interface SavingsSummary {
  today: number;
  thisMonth: number;
  thisYear: number;
  lifetime: number;
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
    lifetime: 0,
    totalTransactions: 0,
  });

  // Savings Calculator state
  const [monthlySpend, setMonthlySpend] = useState('10000');

  // Check if user is a regular 'user' (not member or merchant)
  const isRegularUser = user?.userType === 'user' || user?.userType === null || !user?.userType;

  const fetchSavingsData = async () => {
    try {
      // Get customer ID from AsyncStorage
      const customerId = await AsyncStorage.getItem('customer_id');
      const effectiveCustomerId = customerId || user?.id;
      
      if (!effectiveCustomerId) {
        console.log('No customer ID available');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch savings data from API
      const response = await fetch(
        `${INTOWN_API_BASE}/transactions/customers/${effectiveCustomerId}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: SavingsApiResponse = await response.json();

      // Update summary with API data
      setSummary({
        today: data.today?.intownSavings ?? 0,
        thisMonth: data.thisMonth?.intownSavings ?? 0,
        thisYear: data.thisYear?.intownSavings ?? 0,
        lifetime: data.lifetime?.intownSavings ?? 0,
        totalTransactions: data.lifetime?.transactionCount ?? 0,
        businessName: data.lifetime?.transactionCount ?? 0,
      });

      // Transform transactions for display
      const transformedTransactions: SavingsTransaction[] = (data.transactions || []).map((tx) => ({
        id: String(tx.transactionId),
        date: tx.transactionDate,
        shopName: tx.businessName || tx.merchantName || 'Unknown Shop',
        amount: tx.totalPrice ?? 0,
        savings: tx.intownSavings ?? 0,
        paidAmount: tx.payablePrice ?? 0,
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching savings:', error);
      // Reset to empty state on error
      setTransactions([]);
      setSummary({
        today: 0,
        thisMonth: 0,
        thisYear: 0,
        lifetime: 0,
        totalTransactions: 0,
      });
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

  // Savings Calculator Component (for regular users)
  const SavingsCalculator = () => (
    <ScrollView style={styles.content}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Ionicons name="calculator" size={48} color="#FF8A00" />
        <Text style={styles.heroTitle}>Calculate Your Savings</Text>
        <Text style={styles.heroSubtitle}>
          See how much you can save by shopping at INtown partner stores
        </Text>
      </View>

      {/* Savings Calculator Card */}
      <View style={styles.calculatorCard}>
        <View style={styles.calculatorHeader}>
          <Ionicons name="calculator-outline" size={22} color="#FF7A00" />
          <Text style={styles.calculatorTitle}>Savings Calculator</Text>
        </View>

        <Text style={styles.calculatorLabel}>ESTIMATED MONTHLY SPEND</Text>

        <View style={styles.inputBox}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            style={styles.calculatorInput}
            keyboardType="numeric"
            value={monthlySpend}
            onChangeText={setMonthlySpend}
            placeholder="Enter amount"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.resultRow}>
          <View style={styles.monthlyBox}>
            <Text style={styles.resultLabel}>MONTHLY SAVINGS</Text>
            <Text style={styles.monthlyValue}>
              ₹ {Math.floor(Number(monthlySpend) * 0.15)}
            </Text>
          </View>

          <View style={styles.annualBox}>
            <Text style={styles.annualLabel}>ANNUAL SAVINGS</Text>
            <Text style={styles.annualValue}>
              ₹ {Math.floor(Number(monthlySpend) * 0.15 * 12)}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="trending-up" size={24} color="#FF8A00" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Are you still paying total bill ?</Text>
            <Text style={styles.infoText}>
              No need. INtown offers you special price.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="storefront" size={24} color="#FF8A00" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>More Partner Stores at your area</Text>
            <Text style={styles.infoText}>
              Shop from groceries, restaurants, salons, medicals and more services.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="flash" size={24} color="#FF8A00" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Worried about coupons ?</Text>
            <Text style={styles.infoText}>
              Get immediate savings at checkout without any coupons and scratch cards.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Start Saving?</Text>
        <Text style={styles.ctaSubtitle}>
          Register as a member to unlock your savings journey
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/register-member')}
        >
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.ctaButtonText}>Become a Member</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Full Savings View (for members and merchants)
  const FullSavingsView = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A00']} />
      }
    >
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="today" size={24} color="#FF8C00" />
          </View>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.today)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="calendar" size={24} color="#FF8C00" />
          </View>
          <Text style={styles.summaryLabel}>Month</Text>
          <Text style={[styles.summaryValue, { color: '#0F172A' }]}>
            {formatCurrency(summary.thisMonth)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="trending-up" size={24} color="#FF8C00" />
          </View>
          <Text style={styles.summaryLabel}>Year</Text>
          <Text style={[styles.summaryValue, { color: '#0F172A' }]}>
            {formatCurrency(summary.thisYear)}
          </Text>
        </View>
      </View>

      {/* Total Savings Banner */}
      <View style={styles.totalBanner}>
        <Ionicons name="wallet" size={32} color="#FFF" />
        <View style={styles.totalBannerText}>
          <Text style={styles.totalLabel}>Total Lifetime Savings</Text>
          <Text style={styles.totalValue}>{formatCurrency(summary.lifetime)}</Text>
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
            {/* <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/member-dashboard')}
            >
              <Ionicons name="search" size={20} color="#FFF" />
              <Text style={styles.exploreButtonText}>Explore Shops</Text>
            </TouchableOpacity> */}
          </View>
        ) : (
          <View style={styles.transactionsGrid}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionGridCard}>
                <View style={styles.transactionGridHeader}>
                  <View style={styles.transactionGridIcon}>
                    <Ionicons name="storefront" size={20} color="#FF8A00" />
                  </View>
                  <Text style={styles.transactionGridShop} numberOfLines={1}>
                    {transaction.businessName}
                  </Text>
                </View>
                <Text style={styles.transactionGridDate}>{formatDate(transaction.date)}</Text>
                <View style={styles.transactionGridDivider} />
                <View style={styles.transactionGridRow}>
                  <Text style={styles.transactionGridLabel}>Bill</Text>
                  <Text style={styles.transactionGridValue}>{formatCurrency(transaction.amount)}</Text>
                </View>
                <View style={styles.transactionGridRow}>
                  <Text style={styles.transactionGridLabel}>Saved</Text>
                  <Text style={styles.transactionGridSaved}>{formatCurrency(transaction.savings)}</Text>
                </View>
                <View style={styles.transactionGridRow}>
                  <Text style={styles.transactionGridLabel}>Paid</Text>
                  <Text style={styles.transactionGridPaid}>{formatCurrency(transaction.paidAmount)}</Text>
                </View>
              </View>
            ))}
          </View>
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
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isRegularUser ? 'Savings Calculator' : 'My Savings'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>{isRegularUser ? 'Savings Calculator' : 'My Savings'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isRegularUser ? <SavingsCalculator /> : <FullSavingsView />}
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

  // Savings Calculator Styles (for regular users)
  heroSection: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginTop: 12 },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  calculatorCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  calculatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF8A00',
    marginRight: 8,
  },
  calculatorInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
  },
  monthlyBox: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  annualBox: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  monthlyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  annualLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF8A00',
    marginBottom: 4,
  },
  annualValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8A00',
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  ctaSection: {
    backgroundColor: '#FF8A00',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  ctaButtonText: {
    color: '#FF8A00',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Full Savings View Styles (for members/merchants)
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
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
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  totalBanner: {
    backgroundColor: '#FF8A00',
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
    backgroundColor: '#FF8A00',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  exploreButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Grid Layout for Transactions
  transactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    maxHeight: 260,
    overflow: "auto"
  },
  transactionGridCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    width: '48%',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  transactionGridShop: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  transactionGridDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 10,
  },
  transactionGridDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  transactionGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionGridLabel: {
    fontSize: 12,
    color: '#888',
  },
  transactionGridValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  transactionGridSaved: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  transactionGridPaid: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF8A00',
  },
  
  // Legacy list styles (kept for reference)
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
  transactionCategory: { fontSize: 12, color: '#FF8A00', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  transactionSavings: { fontSize: 13, color: '#4CAF50', marginTop: 2, fontWeight: '600' },
  transactionPaid: { fontSize: 12, color: '#666', marginTop: 2 },
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
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  stepText: { fontSize: 14, color: '#666', flex: 1 },
});
