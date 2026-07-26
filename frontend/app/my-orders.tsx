import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { getCustomerPickupOrders, confirmCustomerOrderReceived, PickupOrder, PickupOrderStatus } from '../utils/api';

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
  const [toast, setToast] = useState<{ kind: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Polling — track status per order id so we can notify the customer on transitions.
  const lastStatusMapRef = useRef<Record<string, string>>({});
  const isFirstFetchRef = useRef(true);
  const pollTimerRef = useRef<any>(null);
  const POLL_INTERVAL_MS = 15000;

  const showToast = (kind: 'info' | 'success' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePickupConfirm = async (order: PickupOrder) => {
    if (!customerId) return;
    setConfirmingId(order.pickup_id);
    try {
      await confirmCustomerOrderReceived(customerId, order.pickup_id);
      // Optimistic — mark customerReceivedAt so the button hides
      setOrders((prev) =>
        prev.map((o) =>
          o.pickup_id === order.pickup_id
            ? { ...o, customerReceivedAt: new Date().toISOString() }
            : o
        )
      );
      showToast('success', 'Thanks! We\u2019ve marked your order as picked up.');
      // Immediately re-fetch to pick up any status change (if merchant already confirmed → COMPLETED)
      fetchOrders(customerId).catch(() => {});
    } catch (e: any) {
      showToast('error', e?.message || 'Could not confirm pickup. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('customer_id');
        setCustomerId(stored);
        if (!stored) setLoading(false); // Skip loading spinner for unauth visitors
      } catch {
        setLoading(false);
      }
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

      // Detect status transitions and notify the customer
      const changes: { order: PickupOrder; from: string; to: string }[] = [];
      const nextMap: Record<string, string> = {};
      for (const o of list) {
        const currStatus = String(o.status).toUpperCase();
        nextMap[o.pickup_id] = currStatus;
        const prev = lastStatusMapRef.current[o.pickup_id];
        if (!isFirstFetchRef.current && prev && prev !== currStatus) {
          changes.push({ order: o, from: prev, to: currStatus });
        }
      }
      lastStatusMapRef.current = nextMap;

      if (changes.length > 0) {
        // Show a toast for the first meaningful change (order-of-magnitude cleaner than N toasts)
        const primary = changes[0];
        const merchant = primary.order.merchantName || `Merchant #${primary.order.merchantId}`;
        let msg = '';
        switch (primary.to) {
          case 'ACCEPTED':
            msg = `${merchant} has accepted your order.`;
            setActiveTab('ACCEPTED');
            break;
          case 'PICKUP_READY':
            msg = `Your order at ${merchant} is ready for pickup.`;
            setActiveTab('PICKUP_READY');
            break;
          case 'COMPLETED':
            msg = `Your order at ${merchant} has been completed.`;
            setActiveTab('COMPLETED');
            break;
          case 'ENDED':
            msg = `Your order at ${merchant} was ended.`;
            break;
          default:
            msg = `Order ${primary.order.pickup_id} is now ${primary.to.replace('_', ' ')}.`;
        }
        showToast(primary.to === 'COMPLETED' ? 'success' : 'info', msg);
      }

      isFirstFetchRef.current = false;
      setOrders(list);
    } catch (e: any) {
      setError(e?.message || 'Unable to load your orders. Please try again.');
      setOrders([]);
    }
  }, []);

  // Start 15-second polling while this screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!customerId) return;
      const tick = () => { fetchOrders(customerId).catch(() => {}); };
      pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS);
      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      };
    }, [customerId, fetchOrders])
  );

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
        style={styles.tabsScroll}
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
              <OrderCard
                key={order.pickup_id}
                order={order}
                onConfirmPickup={handlePickupConfirm}
                isConfirming={confirmingId === order.pickup_id}
              />
            ))
          )}

          {/* History section (ENDED etc) */}
          {activeTab === 'COMPLETED' && historyOrders.length > 0 && (
            <>
              <Text style={styles.historyHeader}>History</Text>
              {historyOrders.map((order) => (
                <OrderCard
                  key={`h-${order.pickup_id}`}
                  order={order}
                  onConfirmPickup={handlePickupConfirm}
                  isConfirming={confirmingId === order.pickup_id}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Status update toast — floats above the list */}
      {toast && (
        <View
          style={[
            styles.toast,
            toast.kind === 'success' ? styles.toastSuccess : toast.kind === 'error' ? styles.toastError : styles.toastInfo,
          ]}
          pointerEvents="box-none"
          testID="my-orders-toast"
        >
          <Ionicons
            name={
              toast.kind === 'success'
                ? 'checkmark-circle'
                : toast.kind === 'error'
                  ? 'close-circle'
                  : 'notifications'
            }
            size={18}
            color={toast.kind === 'success' ? '#0C8A4A' : toast.kind === 'error' ? '#D32F2F' : '#1E88E5'}
          />
          <Text
            style={[
              styles.toastText,
              { color: toast.kind === 'success' ? '#0C8A4A' : toast.kind === 'error' ? '#D32F2F' : '#1E88E5' },
            ]}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function OrderCard({
  order,
  onConfirmPickup,
  isConfirming,
}: {
  order: PickupOrder;
  onConfirmPickup?: (o: PickupOrder) => void;
  isConfirming?: boolean;
}) {
  const statusKey = String(order.status).toUpperCase();
  const color = STATUS_COLORS[statusKey] || { bg: '#F5F5F5', text: '#666' };
  const orderDate = formatDateTime(order.acceptedAt || order.respondBy || order.endedAt || null);
  const canConfirmPickup = statusKey === 'PICKUP_READY' && !order.customerReceivedAt;
  const alreadyConfirmedPickup = !!order.customerReceivedAt && statusKey !== 'COMPLETED';

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

      {/* Customer pickup-confirm button (PICKUP_READY state) */}
      {canConfirmPickup && onConfirmPickup && (
        <TouchableOpacity
          style={[styles.confirmPickupBtn, isConfirming && styles.confirmPickupBtnDisabled]}
          onPress={() => onConfirmPickup(order)}
          disabled={isConfirming}
          testID={`confirm-pickup-btn-${order.pickup_id}`}
        >
          {isConfirming ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="hand-left-outline" size={16} color="#FFFFFF" />
              <Text style={styles.confirmPickupBtnText}>I Picked Up My Order</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Waiting for merchant delivery confirmation */}
      {alreadyConfirmedPickup && (
        <View style={styles.waitingBanner}>
          <Ionicons name="time-outline" size={14} color="#1E88E5" />
          <Text style={styles.waitingBannerText}>Waiting for merchant to mark delivery to complete this order.</Text>
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
    borderBottomWidth: 1, borderBottomColor: '#EEE',paddingTop:32,
  },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },

  tabsScroll: { flexGrow: 0, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: 'center' },
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

  confirmPickupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0C8A4A', borderRadius: 10, paddingVertical: 12, marginTop: 12,
  },
  confirmPickupBtnDisabled: { backgroundColor: '#CCCCCC' },
  confirmPickupBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  waitingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E3F2FD', borderRadius: 8, padding: 8, marginTop: 12,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  waitingBannerText: { color: '#1E88E5', fontSize: 12, fontWeight: '700', flex: 1 },

  toast: {
    position: 'absolute', top: 120, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 10, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8, zIndex: 9999,
  },
  toastSuccess: { backgroundColor: '#E8F5E9', borderColor: '#B7E1BF' },
  toastInfo: { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' },
  toastError: { backgroundColor: '#FDECEA', borderColor: '#F5C2C0' },
  toastText: { flex: 1, fontSize: 13, fontWeight: '700' },
});
