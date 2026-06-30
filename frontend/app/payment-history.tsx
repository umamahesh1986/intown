import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
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

interface SavingsApiResponse {
  today: { totalPrice?: number; intownSavings?: number; transactionCount?: number };
  thisMonth: { totalPrice?: number; intownSavings?: number; transactionCount?: number };
  thisYear: { totalPrice?: number; intownSavings?: number; transactionCount?: number };
  lifetime: { totalPrice?: number; intownSavings?: number; totalPayablePrice?: number; transactionCount?: number };
  transactions: ApiTransaction[];
}

type FilterType = 'all' | 'this_month' | 'this_year';

export default function PaymentHistory() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [lifetimeStats, setLifetimeStats] = useState({ totalSpent: 0, totalSaved: 0, totalPaid: 0, count: 0 });
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const fetchPaymentData = useCallback(async () => {
    try {
      const customerId = await AsyncStorage.getItem('customer_id');
      const effectiveId = customerId || user?.id;

      if (!effectiveId) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      const [storedPlan, response] = await Promise.all([
        AsyncStorage.getItem('user_type'),
        fetch(`${INTOWN_API_BASE}/transactions/customers/${effectiveId}`, {
          headers: { Accept: 'application/json' },
        }),
      ]);

      setSubscriptionPlan(storedPlan);

      if (!response.ok) throw new Error(`API failed: ${response.status}`);

      const data: SavingsApiResponse = await response.json();

      setLifetimeStats({
        totalSpent: data.lifetime?.totalPrice ?? 0,
        totalSaved: data.lifetime?.intownSavings ?? 0,
        totalPaid: data.lifetime?.totalPayablePrice ?? 0,
        count: data.lifetime?.transactionCount ?? 0,
      });

      const sorted = (data.transactions || []).sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setTransactions(sorted);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentData();
  }, [fetchPaymentData]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    const txDate = new Date(tx.transactionDate);
    const now = new Date();
    if (activeFilter === 'this_month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    if (activeFilter === 'this_year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `\u20B9${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} data-testid="payment-history-back-btn">
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} data-testid="payment-history-back-btn">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A00']} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF8F0' }]}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="receipt-outline" size={20} color="#FF8A00" />
            </View>
            <Text style={styles.summaryValue}>{lifetimeStats.count}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0F8FF' }]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#D6EAFF' }]}>
              <Ionicons name="card-outline" size={20} color="#2196F3" />
            </View>
            <Text style={styles.summaryValue}>{formatCurrency(lifetimeStats.totalPaid)}</Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FFF4' }]}>
            <View style={[styles.summaryIconWrap, { backgroundColor: '#D4EDDA' }]}>
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{formatCurrency(lifetimeStats.totalSaved)}</Text>
            <Text style={styles.summaryLabel}>Total Saved</Text>
          </View>
        </View>

        {/* Subscription Info */}
        {subscriptionPlan && subscriptionPlan.toLowerCase().includes('customer') && (
          <View style={styles.subscriptionCard} data-testid="subscription-info-card">
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionBadge}>
                <Ionicons name="diamond" size={14} color="#FF8A00" />
                <Text style={styles.subscriptionBadgeText}>Active Plan</Text>
              </View>
            </View>
            <Text style={styles.subscriptionName}>INtown Member</Text>
            <Text style={styles.subscriptionDetail}>Enjoy savings on every purchase at partner stores</Text>
            <TouchableOpacity
              style={styles.managePlanBtn}
              onPress={() => router.push('/plans')}
              data-testid="manage-plan-btn"
            >
              <Text style={styles.managePlanText}>Manage Plan</Text>
              <Ionicons name="chevron-forward" size={16} color="#FF8A00" />
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {([
            { key: 'all', label: 'All' },
            { key: 'this_month', label: 'This Month' },
            { key: 'this_year', label: 'This Year' },
          ] as { key: FilterType; label: string }[]).map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
              data-testid={`filter-${filter.key}`}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState} data-testid="empty-state">
            <Ionicons name="document-text-outline" size={56} color="#CCC" />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptySubtitle}>Your payment history will appear here once you make purchases at partner stores.</Text>
          </View>
        ) : (
          <View style={styles.transactionList} data-testid="transaction-list">
            <Text style={styles.sectionTitle}>
              {activeFilter === 'all' ? 'All Transactions' : activeFilter === 'this_month' ? 'This Month' : 'This Year'}
              {' '}({filteredTransactions.length})
            </Text>
            {filteredTransactions.map((tx) => (
              <View key={tx.transactionId} style={styles.transactionCard} data-testid={`transaction-${tx.transactionId}`}>
                <View style={styles.txLeft}>
                  <View style={styles.txIconWrap}>
                    <Ionicons name="storefront-outline" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txBusinessName} numberOfLines={1}>
                      {tx.businessName || tx.merchantName || 'Store Purchase'}
                    </Text>
                    <Text style={styles.txDate}>{formatDate(tx.transactionDate)} {formatTime(tx.transactionDate)}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>{formatCurrency(tx.payablePrice ?? tx.totalPrice ?? 0)}</Text>
                  {(tx.intownSavings ?? 0) > 0 && (
                    <View style={styles.txSavingsBadge}>
                      <Ionicons name="arrow-down" size={10} color="#4CAF50" />
                      <Text style={styles.txSavingsText}>Saved {formatCurrency(tx.intownSavings ?? 0)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },

  // Summary
  summaryRow: { flexDirection: 'row', padding: 16, gap: 10 },
  summaryCard: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
  },
  summaryIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFE8CC',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '500' },

  // Subscription
  subscriptionCard: {
    marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 14,
    padding: 18, marginBottom: 8,
    borderWidth: 1, borderColor: '#FFE0B2',
  },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subscriptionBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5,
  },
  subscriptionBadgeText: { fontSize: 12, fontWeight: '700', color: '#FF8A00' },
  subscriptionName: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  subscriptionDetail: { fontSize: 13, color: '#777', lineHeight: 20, marginBottom: 14 },
  managePlanBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
  },
  managePlanText: { fontSize: 13, fontWeight: '700', color: '#FF8A00', marginRight: 4 },

  // Filters
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5E5',
  },
  filterTabActive: { backgroundColor: '#FF8A00', borderColor: '#FF8A00' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterTextActive: { color: '#FFF' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  // Transactions
  transactionList: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  transactionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txInfo: { flex: 1 },
  txBusinessName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  txDate: { fontSize: 12, color: '#999', marginTop: 3 },
  txRight: { alignItems: 'flex-end', marginLeft: 8 },
  txAmount: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  txSavingsBadge: {
    flexDirection: 'row', alignItems: 'center', marginTop: 4,
    backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  txSavingsText: { fontSize: 10, fontWeight: '600', color: '#4CAF50', marginLeft: 2 },
});
