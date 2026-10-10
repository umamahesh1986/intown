import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { INPOINTS_API_BASE, INTOWN_API_BASE, resolveInPointsCustomerId } from '../utils/api';

type PointTransaction = {
  id: number;
  merchantName?: string | null;
  points: number;
  created?: string | null;
};

type PaymentTransaction = {
  transactionId: number;
  merchantId?: number | string | null;
  businessName?: string | null;
  totalPrice?: number | null;
  inTownPrice?: number | null;
  intownPrice?: number | null;
  intownSavings?: number | null;
  inTownSavings?: number | null;
  payablePrice?: number | null;
  transactionDate?: string | null;
};

type ActivityItem = {
  id: number;
  kind: 'POINTS' | 'PAYMENT';
  title: string;
  detail: string;
  value: number | null;
  date: string;
  sortDate: number;
};

type ActivityFilter = 'ALL' | 'POINTS' | 'PAYMENTS';

export default function RewardsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (
    resolvedCustomerId: string,
    resolvedPaymentCustomerId: string | null,
    isCurrent: () => boolean = () => true,
  ) => {
    try {
      const [balanceResponse, pointsHistoryResponse, paymentHistoryResponse] = await Promise.all([
        fetch(`${INPOINTS_API_BASE}/points/customers/${encodeURIComponent(resolvedCustomerId)}`, {
          headers: { Accept: 'application/json' },
        }),
        fetch(`${INPOINTS_API_BASE}/points/customers/${encodeURIComponent(resolvedCustomerId)}/history`, {
          headers: { Accept: 'application/json' },
        }),
        resolvedPaymentCustomerId
          ? fetch(`${INTOWN_API_BASE}/transactions/customers/${encodeURIComponent(resolvedPaymentCustomerId)}`, {
              headers: { Accept: 'application/json' },
            }).catch((paymentRequestError) => {
              console.error('[Rewards] Failed to request purchase history:', paymentRequestError);
              return null;
            })
          : Promise.resolve(null),
      ]);

      if (!balanceResponse.ok || !pointsHistoryResponse.ok) {
        const failedStatus = !balanceResponse.ok ? balanceResponse.status : pointsHistoryResponse.status;
        throw new Error(`Failed to load INPoints (HTTP ${failedStatus}).`);
      }

      const [balanceData, pointsHistoryData] = await Promise.all([
        balanceResponse.json(),
        pointsHistoryResponse.json(),
      ]);
      const balanceValue =
        balanceData?.inPoints ??
        balanceData?.currentTotalPoints ??
        balanceData?.data?.inPoints ??
        balanceData?.data?.currentTotalPoints ??
        pointsHistoryData?.totalPoints ??
        pointsHistoryData?.data?.totalPoints;
      const inPoints = balanceValue == null ? NaN : Number(balanceValue);
      const pointTransactions = Array.isArray(pointsHistoryData)
        ? pointsHistoryData
        : Array.isArray(pointsHistoryData?.transactions)
          ? pointsHistoryData.transactions
          : Array.isArray(pointsHistoryData?.data)
            ? pointsHistoryData.data
            : Array.isArray(pointsHistoryData?.data?.transactions)
              ? pointsHistoryData.data.transactions
              : null;

      if (!Number.isFinite(inPoints)) {
        console.error('[Rewards] INPoints balance response did not include a recognized balance field.');
        throw new Error('The INPoints API returned an invalid balance.');
      }
      if (!pointTransactions) {
        console.error('[Rewards] INPoints history response did not include a transaction list.');
        throw new Error('The INPoints API returned invalid points history.');
      }

      const pointActivity: ActivityItem[] = (pointTransactions as PointTransaction[]).map((transaction): ActivityItem => {
        const points = Number(transaction.points);
        const createdDate = transaction.created ? new Date(transaction.created) : null;
        if (!Number.isSafeInteger(transaction.id) || !Number.isFinite(points)) {
          throw new Error('The INPoints API returned an invalid transaction.');
        }

        return {
          id: transaction.id,
          kind: 'POINTS',
          title: transaction.merchantName || 'Purchase reward',
          detail: `Points credited · #TXN${transaction.id}`,
          value: points,
          date: createdDate && Number.isFinite(createdDate.getTime())
            ? createdDate.toLocaleString()
            : 'Date unavailable',
          sortDate: createdDate && Number.isFinite(createdDate.getTime())
            ? createdDate.getTime()
            : 0,
        };
      });

      let paymentActivity: ActivityItem[] = [];
      let paymentTransactionsData: PaymentTransaction[] = [];
      let paymentError: string | null = null;
      if (paymentHistoryResponse?.ok) {
        try {
          const paymentHistoryData = await paymentHistoryResponse.json();
          if (!Array.isArray(paymentHistoryData?.transactions)) {
            throw new Error('Purchase history response is invalid.');
          }
          paymentTransactionsData = (paymentHistoryData.transactions as PaymentTransaction[])
            .filter((transaction) => Number.isSafeInteger(Number(transaction.transactionId)));
          paymentActivity = paymentTransactionsData.map((transaction): ActivityItem => {
            const amount = transaction.payablePrice ?? transaction.inTownPrice ?? transaction.totalPrice;
            const paid = amount == null ? null : Number(amount);
            const date = transaction.transactionDate ? new Date(transaction.transactionDate) : null;
            return {
              id: transaction.transactionId,
              kind: 'PAYMENT',
              title: transaction.businessName || 'INtown purchase',
              detail: `Payment · #ORD-${transaction.transactionId}`,
              value: paid !== null && Number.isFinite(paid) ? paid : null,
              date: date && Number.isFinite(date.getTime())
                ? date.toLocaleString()
                : 'Date unavailable',
              sortDate: date && Number.isFinite(date.getTime()) ? date.getTime() : 0,
            };
          }).filter((transaction) => Number.isSafeInteger(transaction.id));
        } catch (paymentLoadError) {
          console.error('[Rewards] Failed to parse purchase history:', paymentLoadError);
          paymentError = 'Purchase history could not be loaded.';
        }
      } else {
        paymentError = paymentHistoryResponse
          ? `Purchase history could not be loaded (HTTP ${paymentHistoryResponse.status}).`
          : 'Purchase history is temporarily unavailable.';
      }

      if (!isCurrent()) return;
      setBalance(inPoints);
      setActivity([...pointActivity, ...paymentActivity].sort((a, b) => b.sortDate - a.sortDate));
      setError(paymentError);
    } catch (error) {
      console.error('[Rewards] Failed to fetch INPoints:', error);
      if (isCurrent()) {
        setError('Rewards are temporarily unavailable. Pull down to try again.');
      }
    } finally {
      if (isCurrent()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const resolveCustomerId = useCallback(async (): Promise<string> => {
    return resolveInPointsCustomerId(user?.phone ?? '');
  }, [user?.phone]);

  const resolvePaymentCustomerId = useCallback(async (): Promise<string | null> => {
    const storedCustomerId = await AsyncStorage.getItem('customer_id');
    const candidate = storedCustomerId || user?.id;
    if (!candidate) return null;

    const numericId = Number(candidate);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      throw new Error('The payment history customer ID is invalid.');
    }
    return String(numericId);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);
      setError(null);
      setCustomerId(null);
      setPaymentCustomerId(null);
      setBalance(null);
      setActivity([]);

      const loadCustomerPoints = async () => {
        try {
          const [resolvedCustomerId, resolvedPaymentCustomerId] = await Promise.all([
            resolveCustomerId(),
            resolvePaymentCustomerId(),
          ]);

          if (!isActive) return;
          setCustomerId(resolvedCustomerId);
          setPaymentCustomerId(resolvedPaymentCustomerId);
          await fetchData(resolvedCustomerId, resolvedPaymentCustomerId, () => isActive);
        } catch (loadError) {
          console.error('[Rewards] Failed to resolve customer ID:', loadError);
          if (isActive) {
            setError('We could not find your rewards account. Please sign in again.');
            setLoading(false);
          }
        }
      };

      void loadCustomerPoints();
      return () => {
        isActive = false;
      };
    }, [fetchData, resolveCustomerId, resolvePaymentCustomerId]),
  );

  const onRefresh = useCallback(() => {
    if (!customerId) return;
    setRefreshing(true);
    setError(null);
    void fetchData(customerId, paymentCustomerId);
  }, [customerId, fetchData, paymentCustomerId]);


  const pointActivity = activity.filter((item) => item.kind === 'POINTS');
  const paymentActivity = activity.filter((item) => item.kind === 'PAYMENT');
  const filteredActivity = activeFilter === 'ALL'
    ? activity
    : activeFilter === 'POINTS'
      ? pointActivity
      : paymentActivity;
  const totalEarned = pointActivity.reduce((sum, item) => sum + Math.max(0, item.value ?? 0), 0);
  const averagePoints = pointActivity.length ? Math.round(totalEarned / pointActivity.length) : 0;
  const isCompact = width < 380;
  const isWide = width >= 760;
  const isDesktop = width >= 1280;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8A00" />
        <Text style={styles.loadingText}>Loading INPoints...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#EF7900', '#D94E00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View
          style={[
            styles.headerContent,
            isWide && styles.headerContentWide,
            isDesktop && styles.headerContentDesktop,
          ]}
        >
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>INPOINTS REWARDS</Text>
            <Text style={styles.headerTitle}>Rewards</Text>
            <Text style={styles.headerSubtitle}>A little more value in every visit.</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Refresh rewards"
          >
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={filteredActivity}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerStyle={[
          styles.listContent,
          width >= 760 && styles.listContentWide,
          isDesktop && styles.listContentDesktop,
          width < 760 && styles.listContentMobile,
          isCompact && styles.listContentCompact,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8A00']}
            tintColor="#FF8A00"
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <Animated.View
              entering={FadeInDown.duration(650).springify()}
              layout={LinearTransition.springify()}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={['#FFAD3B', '#F47A00', '#DF5D00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, isCompact && styles.cardCompact]}
              >
                <View style={styles.cardGlow} />
                <View style={styles.cardTop}>
                  <View style={styles.badge}>
                    <Ionicons name="ribbon-outline" size={16} color="#FFF" />
                    <Text style={styles.badgeText}>INPOINTS REWARDS</Text>
                  </View>
                  <Ionicons name="sparkles" size={21} color="#FFFFFF" />
                </View>

                <View style={[styles.balanceContainer, isCompact && styles.balanceContainerCompact]}>
                  <Text style={styles.balanceLabel}>YOUR AVAILABLE BALANCE</Text>
                  <Text style={[styles.balanceValue, isCompact && styles.balanceValueCompact]}>
                    {balance === null ? '--' : balance.toLocaleString()} <Text style={styles.ptsUnit}>POINTS</Text>
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <View style={styles.statsRow}>
              <Animated.View entering={FadeInDown.delay(100).duration(550).springify()} layout={LinearTransition.springify()} style={[styles.statCard, isCompact && styles.statCardCompact]}>
                <Ionicons name="trending-up-outline" size={18} color="#FF9B24" />
                <Text style={[styles.statValue, isCompact && styles.statCardCompactValue]}>{totalEarned.toLocaleString()}</Text>
                <Text style={[styles.statLabel, isCompact && styles.statCardCompactLabel]}>Total earned</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(180).duration(550).springify()} layout={LinearTransition.springify()} style={[styles.statCard, isCompact && styles.statCardCompact]}>
                <Ionicons name="receipt-outline" size={18} color="#FF9B24" />
                <Text style={[styles.statValue, isCompact && styles.statCardCompactValue]}>{pointActivity.length}</Text>
                <Text style={[styles.statLabel, isCompact && styles.statCardCompactLabel]}>Transactions</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(260).duration(550).springify()} layout={LinearTransition.springify()} style={[styles.statCard, isCompact && styles.statCardCompact]}>
                <Ionicons name="sparkles-outline" size={18} color="#FF9B24" />
                <Text style={[styles.statValue, isCompact && styles.statCardCompactValue]}>{averagePoints.toLocaleString()}</Text>
                <Text style={[styles.statLabel, isCompact && styles.statCardCompactLabel]}>Avg. points</Text>
              </Animated.View>
            </View>

            <View style={styles.historyHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>YOUR ACTIVITY</Text>
                <Text style={styles.sectionTitle}>Transaction history</Text>
              </View>
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{filteredActivity.length}</Text>
              </View>
            </View>
            {error ? (
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.8} style={styles.errorCard}>
                <Ionicons name="cloud-offline-outline" size={19} color="#FF8A00" />
                <Text style={styles.errorText}>{error}</Text>
                <Ionicons name="refresh-outline" size={17} color="#FF8A00" />
              </TouchableOpacity>
            ) : null}
            <View style={styles.filterRow}>
              {([
                { key: 'ALL', label: 'All activity' },
                { key: 'POINTS', label: 'INPoints' },
                { key: 'PAYMENT_HISTORY', label: 'Payment history' },
              ] as const).map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => {
                    if (filter.key === 'PAYMENT_HISTORY') {
                      router.push('/payment-history');
                      return;
                    }
                    setActiveFilter(filter.key);
                  }}
                  style={[
                    styles.filterButton,
                    filter.key !== 'PAYMENT_HISTORY' && activeFilter === filter.key && styles.filterButtonActive,
                  ]}
                  activeOpacity={0.68}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter.key !== 'PAYMENT_HISTORY' && activeFilter === filter.key && styles.filterTextActive,
                    ]}
                  >{filter.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(500).springify()}
            layout={LinearTransition.springify()}
            style={[styles.historyItem, isCompact && styles.historyItemCompact]}
          >
            <View
              style={[
                styles.iconContainer,
                item.kind === 'POINTS' ? styles.creditBg : styles.paymentBg,
              ]}
            >
              {item.kind === 'POINTS' ? (
                <Ionicons name="sparkles-outline" size={19} color="#FF9B24" />
              ) : (
                <Ionicons name="card-outline" size={19} color="#F4F1E8" />
              )}
            </View>

            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.historyDate}>{item.detail} · {item.date}</Text>
            </View>

            <Text
              style={[
                styles.historyPoints,
                isCompact && styles.historyPointsCompact,
                item.kind === 'POINTS' ? styles.creditText : styles.paymentText,
              ]}
            >
              {item.kind === 'POINTS'
                ? `${item.value !== null && item.value >= 0 ? '+' : ''}${item.value?.toLocaleString() ?? '0'} pts`
                : item.value === null
                  ? 'Amount unavailable'
                  : `₹${item.value.toLocaleString('en-IN')}`}
            </Text>
          </Animated.View>
        )}
        ListEmptyComponent={filteredActivity.length === 0 && !error ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={activeFilter === 'PAYMENTS' ? 'card-outline' : 'gift-outline'}
                size={23}
                color="#FF9B24"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'PAYMENTS' ? 'No payments to show yet' : 'Your rewards journey starts here'}
            </Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'PAYMENTS'
                ? 'Your eligible purchase history will appear here.'
                : 'Completed reward credits will appear here.'}
            </Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F1',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F1',
  },
  loadingText: {
    marginTop: 10,
    color: '#6F6257',
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    color: '#A84416',
    fontSize: 14,
    marginHorizontal: 10,
    lineHeight: 19,
  },
  emptyText: {
    color: '#74685E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 27,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    shadowColor: '#9E3900',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 9,
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  headerContentWide: {
    paddingHorizontal: 12,
  },
  headerContentDesktop: {
    paddingHorizontal: 28,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    color: '#FFE4C8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  headerTitle: {
    marginTop: 3,
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#FFEBD8',
    fontSize: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  listContent: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 24,
  },
  listContentWide: {
    paddingHorizontal: 32,
  },
  listContentDesktop: {
    paddingHorizontal: 48,
    paddingTop: 32,
    paddingBottom: 56,
  },
  listContentMobile: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  listContentCompact: {
    paddingHorizontal: 14,
    paddingTop: 15,
  },
  cardWrapper: {
    marginBottom: 22,
    borderRadius: 30,
    elevation: 13,
    shadowColor: '#9E3900',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 23,
  },
  card: {
    minHeight: 246,
    overflow: 'hidden',
    padding: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 30,
  },
  cardCompact: {
    minHeight: 225,
    padding: 19,
  },
  cardGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    top: -103,
    right: -63,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceContainer: {
    marginTop: 32,
  },
  balanceContainerCompact: {
    marginTop: 25,
  },
  balanceLabel: {
    color: '#FFF9F0',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  balanceValue: {
    marginTop: 9,
    color: '#FFFFFF',
    fontSize: 43,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  balanceValueCompact: {
    fontSize: 34,
  },
  ptsUnit: {
    color: '#FFF6E9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balanceCreditButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
    marginTop: 18,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#873700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  balanceCreditButtonText: {
    color: '#3A2112',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionTitle: {
    marginTop: 3,
    color: '#211811',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  historyHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionEyebrow: {
    color: '#FF8A00',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  historyCount: {
    minWidth: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: '#FFF0E1',
  },
  historyCountText: {
    color: '#E96B00',
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#FFF0E8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 108,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#EBD8C6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#7A3A10',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.075,
    shadowRadius: 7,
  },
  statCardCompact: {
    minHeight: 100,
    padding: 10,
  },
  statValue: {
    marginTop: 7,
    color: '#24180F',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#81766C',
    fontSize: 10,
  },
  statCardCompactValue: {
    fontSize: 14,
  },
  statCardCompactLabel: {
    fontSize: 9,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  creditIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFF0E1',
  },
  creditHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  creditTitle: {
    color: '#231C16',
    fontSize: 17,
    fontWeight: '700',
  },
  creditSubtitle: {
    marginTop: 2,
    color: '#82766C',
    fontSize: 11,
  },
  creditModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: 'rgba(28, 20, 14, 0.58)',
  },
  creditModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 13,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#F1E1D2',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    elevation: 16,
    shadowColor: '#24170F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
  },
  creditModalHandle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 17,
    borderRadius: 2,
    backgroundColor: '#E7DCD2',
  },
  creditModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFF4E9',
  },
  creditModalForm: {
    paddingBottom: 8,
  },
  creditManualCard: {
    paddingTop: 8,
  },
  creditFieldLabel: {
    marginTop: 12,
    marginBottom: 7,
    color: '#3A3028',
    fontSize: 12,
    fontWeight: '700',
  },
  creditSourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  creditSourceOption: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E7D6C5',
    borderRadius: 12,
    backgroundColor: '#FFF9F4',
    alignItems: 'center',
  },
  creditSourceOptionActive: {
    borderColor: '#D95F00',
    backgroundColor: '#FFF0E1',
  },
  creditSourceOptionText: {
    color: '#5A463B',
    fontSize: 12,
    fontWeight: '700',
  },
  creditSourceOptionTextActive: {
    color: '#D95F00',
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 7,
    color: '#3A3028',
    fontSize: 12,
    fontWeight: '700',
  },
  creditInput: {
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: '#E8D7C7',
    borderRadius: 14,
    backgroundColor: '#FFFEFC',
    color: '#231C16',
    fontSize: 14,
    shadowColor: '#7A3A10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 4,
  },
  creditTextArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  creditInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
    padding: 12,
    borderRadius: 13,
    backgroundColor: '#FFF4E8',
  },
  creditInfoText: {
    flex: 1,
    color: '#76543A',
    fontSize: 11,
    lineHeight: 16,
  },
  creditSubmitWrap: {
    marginTop: 1,
  },
  creditFormError: {
    marginTop: 11,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 17,
  },
  creditSuccess: {
    marginTop: 11,
    color: '#18794E',
    fontSize: 12,
    lineHeight: 17,
  },
  creditSelectionCard: {
    padding: 17,
    borderWidth: 1,
    borderColor: '#F2DFC8',
    borderRadius: 20,
    backgroundColor: '#FFFDFC',
  },
  creditSelectionTitle: {
    marginTop: 10,
    color: '#231C16',
    fontSize: 18,
    fontWeight: '800',
  },
  creditSelectionSubtitle: {
    marginTop: 4,
    color: '#8A7B6F',
    fontSize: 11,
    lineHeight: 16,
  },
  creditSecondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E7D6C5',
    borderRadius: 14,
    backgroundColor: '#FFF9F4',
  },
  creditSecondaryButtonText: {
    color: '#5A463B',
    fontSize: 12,
    fontWeight: '700',
  },
  creditPaymentCard: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8DCCF',
    borderRadius: 18,
    backgroundColor: '#FFFDFB',
  },
  creditPaymentTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditPaymentIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF0E1',
  },
  creditPaymentInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  creditPaymentTitle: {
    color: '#231C16',
    fontSize: 14,
    fontWeight: '700',
  },
  creditPaymentMeta: {
    marginTop: 2,
    color: '#8A7B6F',
    fontSize: 10,
  },
  creditPaymentAmount: {
    color: '#201713',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  creditPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#EF7000',
  },
  creditPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  creditReceipt: {
    padding: 17,
    borderWidth: 1,
    borderColor: '#E8F0E9',
    borderRadius: 18,
    backgroundColor: '#FCFFFC',
  },
  creditReceiptIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#E8F5EC',
  },
  creditReceiptTitle: {
    marginTop: 11,
    color: '#18794E',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  creditReceiptPoints: {
    marginTop: 12,
    color: '#D86100',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  creditReceiptBalance: {
    marginTop: 3,
    color: '#65584E',
    fontSize: 12,
    textAlign: 'center',
  },
  creditReceiptDivider: {
    height: 1,
    marginVertical: 15,
    backgroundColor: '#EDE6DF',
  },
  creditReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 7,
  },
  creditReceiptLabel: {
    flex: 1,
    color: '#82766C',
    fontSize: 11,
  },
  creditReceiptValue: {
    flex: 1,
    color: '#30261E',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  creditReceiptDone: {
    marginTop: 14,
  },
  creditEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F2D5B8',
    borderRadius: 16,
    backgroundColor: '#FFF7EF',
  },
  creditEstimateCopy: {
    gap: 4,
  },
  creditEstimateLabel: {
    color: '#987B64',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  creditEstimateValue: {
    color: '#CF5E00',
    fontSize: 20,
    fontWeight: '800',
  },
  creditApiNote: {
    marginTop: 9,
    color: '#82766C',
    fontSize: 10,
    lineHeight: 15,
  },
  creditSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    marginTop: 18,
    borderRadius: 15,
    backgroundColor: '#EF7000',
    borderWidth: 1,
    borderColor: '#D95F00',
  },
  creditSubmitDisabled: {
    backgroundColor: '#B9AEA4',
  },
  creditSubmitEnabled: {
    backgroundColor: '#EF7000',
    elevation: 3,
    shadowColor: '#A74400',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  creditSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.2,
    borderColor: '#E6D4C2',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    borderColor: '#D95F00',
    backgroundColor: '#FF8A00',
    elevation: 3,
    shadowColor: '#B64D00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  filterText: {
    color: '#6E6258',
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderWidth: 1.2,
    borderColor: '#EAD9C9',
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#63300D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.065,
    shadowRadius: 7,
    elevation: 2,
  },
  historyItemCompact: {
    paddingHorizontal: 11,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditBg: {
    backgroundColor: '#FFF0E1',
  },
  paymentBg: {
    backgroundColor: '#FFF0E1',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#241D17',
  },
  historyDate: {
    fontSize: 12,
    color: '#867A70',
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  historyPointsCompact: {
    fontSize: 12,
  },
  creditText: {
    color: '#FFA12D',
  },
  paymentText: {
    color: '#302116',
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: '#F0E2D5',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderRadius: 17,
    backgroundColor: '#FFF0E1',
  },
  emptyTitle: {
    marginBottom: 6,
    color: '#241D17',
    fontSize: 15,
    fontWeight: '600',
  },
});
