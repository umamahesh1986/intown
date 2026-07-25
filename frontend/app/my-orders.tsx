import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { getCustomerPickupOrders, PickupOrder, PickupOrderStatus } from '../utils/api';

const TABS: { key: PickupOrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'PLACED', label: 'Placed', icon: 'time-outline' },
  { key: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'PICKUP_READY', label: 'Ready', icon: 'cube-outline' },
  { key: 'COMPLETED', label: 'Completed', icon: 'flag-outline' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PLACED: { bg: '#FFF3E0', text: '#FF8A00' },
  ACCEPTED: { bg: '#E3F2FD', text: '#1E88E5' },
  PICKUP_READY: { bg: '#F3E5F5', text: '#8E24AA' },
  COMPLETED: { bg: '#E8F5E9', text: '#0C8A4A' },
  ENDED: { bg: '#FDECEA', text: '#D32F2F' },
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<PickupOrderStatus>('PLACED');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('customer_id');
        setCustomerId(stored);
      } catch {}
    })();
  }, []);

  const fetchOrders = useCallback(async (id: string) => {
    setError('');
    try {
      const list = await getCustomerPickupOrders(id);
      // Sort newest first based on any of the meaningful timestamps
      list.sort((a, b) => {
        const ta = new Date(a.respondBy || a.acceptedAt || a.endedAt || 0).getTime();
        const tb = new Date(b.respondBy || b.acceptedAt || b.endedAt || 0).getTime();
        return tb - ta;
      });
      setOrders(list);
    } catch (e: any) {
      setError(e?.message || 'Unable to load your orders. Please try again.');
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;
    (async () => {
      setLoading(true);
      await fetchOrders(customerId);
      setLoading(false);
    })();
  }, [customerId, fetchOrders]);

  const onRefresh = useCallback(async () => {
    if (!customerId) return;
    setRefreshing(true);
    await fetchOrders(customerId);
    setRefreshing(false);
  }, [customerId, fetchOrders]);

  const filteredOrders = orders.filter((o) => String(o.status).toUpperCase() === activeTab);
  const historyOrders = orders.filter((o) => {
    const s = String(o.status).toUpperCase();
    return !TABS.some((t) => t.key === s);
  });

  const countFor = (statusKey: PickupOrderStatus) =>
    orders.filter((o) => String(o.status).toUpperCase() === statusKey).length;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="my-orders-back-btn">
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = countFor(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              testID={`my-orders-tab-${t.key}`}
            >
              <Ionicons name={t.icon} size={14} color={active ? '#FFFFFF' : '#FF8A00'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#FF8A00" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : !customerId ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="person-outline" size={40} color="#BBB" />
          <Text style={styles.emptyText}>Please log in as a customer to view your orders.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#D32F2F" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => customerId && fetchOrders(customerId)} testID="my-orders-retry-btn">
            <Ionicons name="refresh" size={14} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF8A00" />}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={40} color="#BBB" />
              <Text style={styles.emptyText}>No {activeTab.replace('_', ' ').toLowerCase()} orders yet.</Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard key={order.pickup_id} order={order} />
            ))
          )}

          {/* History section (ENDED etc) */}
          {activeTab === 'COMPLETED' && historyOrders.length > 0 && (
            <>
              <Text style={styles.historyHeader}>History</Text>
              {historyOrders.map((order) => (
                <OrderCard key={`h-${order.pickup_id}`} order={order} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: PickupOrder }) {
  const statusKey = String(order.status).toUpperCase();
  const color = STATUS_COLORS[statusKey] || { bg: '#F5F5F5', text: '#666' };
  const orderDate = formatDateTime(order.acceptedAt || order.respondBy || order.endedAt || null);

  // Milestone timeline — always visible, matches the spec fields exactly
  const milestones: { label: string; value?: string | null; icon: keyof typeof Ionicons.glyphMap; reached: boolean }[] = [
    { label: 'Accepted Time',     value: order.acceptedAt,          icon: 'checkmark-circle-outline', reached: !!order.acceptedAt },
    { label: 'Packed Time',       value: order.packedAt,            icon: 'archive-outline',          reached: !!order.packedAt },
    { label: 'Pickup Ready Time', value: order.packedAt,            icon: 'cube-outline',             reached: statusKey === 'PICKUP_READY' || statusKey === 'COMPLETED' || !!order.merchantDeliveredAt },
    { label: 'Delivered Time',    value: order.merchantDeliveredAt, icon: 'bicycle-outline',          reached: !!order.merchantDeliveredAt },
    { label: 'Completed Time',    value: order.completedAt || order.customerReceivedAt, icon: 'flag-outline', reached: !!order.completedAt || !!order.customerReceivedAt },
  ];
  const anyMilestone = milestones.some((m) => m.reached && !!m.value);

  return (
    <View style={styles.card} testID={`my-orders-card-${order.pickup_id}`}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.merchantName} numberOfLines={1}>
            {order.merchantName || `Merchant #${order.merchantId}`}
          </Text>
          <Text style={styles.pickupId}>{order.pickup_id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: color.bg }]}>
          <Text style={[styles.statusPillText, { color: color.text }]}>{statusKey.replace('_', ' ')}</Text>
        </View>
      </View>

      {!!orderDate && (
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.metaText}>{orderDate}</Text>
          <View style={styles.dot} />
          <Ionicons name="walk-outline" size={14} color="#888" />
          <Text style={styles.metaText}>{String(order.orderType || 'PICKUP')}</Text>
        </View>
      )}

      <View style={styles.itemsBox}>
        {(order.items || []).map((it, idx) => (
          <View key={`${order.pickup_id}-i-${idx}`} style={styles.itemRow}>
            <View style={styles.itemBullet} />
            <Text style={styles.itemName} numberOfLines={1}>{it.productName}</Text>
            <Text style={styles.itemQty}>{it.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Order tracking milestones — always visible */}
      {anyMilestone && (
        <View style={styles.timeline}>
          {milestones
            .filter((m) => !!m.value)
            .map((m) => (
              <View key={m.label} style={styles.timelineRow}>
                <Ionicons name={m.icon} size={14} color={m.reached ? '#FF8A00' : '#CCC'} />
                <Text style={[styles.timelineLabel, !m.reached && { color: '#AAA' }]}>{m.label}</Text>
                <Text style={styles.timelineValue}>{formatDateTime(m.value)}</Text>
              </View>
            ))}
        </View>
      )}

      {order.endReason && (
        <View style={styles.endReasonBanner}>
          <Ionicons name="information-circle" size={14} color="#D32F2F" />
          <Text style={styles.endReasonText}>{String(order.endReason).replace(/_/g, ' ')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },

  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#FFE1BF',
  },
  tabActive: { backgroundColor: '#FF8A00', borderColor: '#FF8A00' },
  tabText: { color: '#FF8A00', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#FFFFFF' },
  tabBadge: {
    backgroundColor: '#FFE1BF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 20, alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { color: '#FF8A00', fontWeight: '800', fontSize: 10 },
  tabBadgeTextActive: { color: '#FFFFFF' },

  listContent: { padding: 12, paddingBottom: 32 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: '#666', fontSize: 13 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF8A00', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EDEDED' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  merchantName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  pickupId: { fontSize: 11, color: '#888', marginTop: 2, fontFamily: 'monospace' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaText: { fontSize: 12, color: '#666' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 4 },
  itemsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  itemBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF8A00' },
  itemName: { flex: 1, fontSize: 13, color: '#333', fontWeight: '600' },
  itemQty: { fontSize: 12, color: '#666', fontWeight: '700' },
  toggleTimeline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  toggleTimelineText: { fontSize: 12, color: '#666', fontWeight: '700' },
  timeline: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5', gap: 6 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF8A00' },
  timelineLabel: { fontSize: 12, color: '#333', fontWeight: '700', minWidth: 130 },
  timelineValue: { fontSize: 12, color: '#666', flex: 1 },
  endReasonBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDECEA', borderRadius: 8, padding: 8, marginTop: 10 },
  endReasonText: { color: '#D32F2F', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  historyHeader: { marginTop: 20, marginBottom: 8, fontSize: 13, fontWeight: '800', color: '#666' },
});
