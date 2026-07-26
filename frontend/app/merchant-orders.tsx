import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMerchantPickupOrders,
  performMerchantOrderAction,
  confirmMerchantOrderDelivery,
  PickupOrder,
  PickupOrderStatus,
} from '../utils/api';

const TABS: { key: PickupOrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'PLACED', label: 'New', icon: 'notifications-outline' },
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

// Merchant action wiring — spec: PUT /IN/merchants/{m}/pickup-orders/{p}
// with body { action: 'ACCEPT' | 'PICKUP_READY' | 'REJECT' }, and the
// completion step uses PUT /pickup-orders/{p}/confirmation (no body).
const NEXT_STATUS: Record<
  string,
  { nextStatus: PickupOrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap; kind: 'action' | 'confirm'; action?: 'ACCEPT' | 'PICKUP_READY' }
> = {
  PLACED:       { nextStatus: 'ACCEPTED',     label: 'Accept Order',       icon: 'checkmark-circle', kind: 'action',  action: 'ACCEPT' },
  ACCEPTED:     { nextStatus: 'PICKUP_READY', label: 'Mark Pickup Ready',  icon: 'cube',             kind: 'action',  action: 'PICKUP_READY' },
  PICKUP_READY: { nextStatus: 'COMPLETED',    label: 'Order Delivered',    icon: 'flag',             kind: 'confirm' },
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

export default function MerchantOrdersScreen() {
  const router = useRouter();

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<PickupOrderStatus>('PLACED');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Polling — track known PLACED order IDs so we can highlight NEW ones.
  const knownPlacedIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);
  const pollTimerRef = useRef<any>(null);
  const POLL_INTERVAL_MS = 15000;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('merchant_id');
        setMerchantId(stored);
      } catch {}
    })();
  }, []);

  const fetchOrders = useCallback(async (id: string) => {
    setError('');
    try {
      const list = await getMerchantPickupOrders(id);
      list.sort((a, b) => {
        const ta = new Date(a.respondBy || a.acceptedAt || a.endedAt || 0).getTime();
        const tb = new Date(b.respondBy || b.acceptedAt || b.endedAt || 0).getTime();
        return tb - ta;
      });

      // Detect NEW placed orders — skip the very first fetch (initial load)
      const currentPlacedIds = new Set<string>();
      const newlyArrived: PickupOrder[] = [];
      for (const o of list) {
        if (String(o.status).toUpperCase() === 'PLACED') {
          currentPlacedIds.add(o.pickup_id);
          if (!isFirstFetchRef.current && !knownPlacedIdsRef.current.has(o.pickup_id)) {
            newlyArrived.push(o);
          }
        }
      }
      knownPlacedIdsRef.current = currentPlacedIds;

      if (newlyArrived.length > 0) {
        // Auto-switch to PLACED tab so the merchant sees the new order right away
        setActiveTab('PLACED');
        const label =
          newlyArrived.length === 1
            ? `New order from ${newlyArrived[0].customerName || `Customer #${newlyArrived[0].customerId}`}`
            : `${newlyArrived.length} new orders received`;
        showToast('info', label);
      }
      isFirstFetchRef.current = false;
      setOrders(list);
    } catch (e: any) {
      setError(e?.message || 'Unable to load orders. Please try again.');
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    if (!merchantId) return;
    (async () => {
      setLoading(true);
      await fetchOrders(merchantId);
      setLoading(false);
    })();
  }, [merchantId, fetchOrders]);

  const onRefresh = useCallback(async () => {
    if (!merchantId) return;
    setRefreshing(true);
    await fetchOrders(merchantId);
    setRefreshing(false);
  }, [merchantId, fetchOrders]);

  const showToast = (kind: 'success' | 'error' | 'info', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Start / stop 15-second polling while this screen is focused.
  useFocusEffect(
    useCallback(() => {
      if (!merchantId) return;
      // Kick a poll immediately, then every POLL_INTERVAL_MS
      const tick = () => { fetchOrders(merchantId).catch(() => {}); };
      pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS);
      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      };
    }, [merchantId, fetchOrders])
  );

  const advanceStatus = async (order: PickupOrder) => {
    if (!merchantId) return;
    const nextInfo = NEXT_STATUS[String(order.status).toUpperCase()];
    if (!nextInfo) return;
    setUpdatingId(order.pickup_id);
    try {
      if (nextInfo.kind === 'action' && nextInfo.action) {
        await performMerchantOrderAction(merchantId, order.pickup_id, nextInfo.action);
      } else if (nextInfo.kind === 'confirm') {
        await confirmMerchantOrderDelivery(merchantId, order.pickup_id);
      }
      // Optimistic local update
      setOrders((prev) =>
        prev.map((o) => (o.pickup_id === order.pickup_id ? { ...o, status: nextInfo.nextStatus } : o))
      );
      showToast('success', `Order marked as ${nextInfo.nextStatus.replace('_', ' ')}`);
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => String(o.status).toUpperCase() === activeTab);
  const countFor = (statusKey: PickupOrderStatus) =>
    orders.filter((o) => String(o.status).toUpperCase() === statusKey).length;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="merchant-orders-back-btn">
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Orders</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn} testID="merchant-orders-refresh-btn">
          <Ionicons name="refresh" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const count = countFor(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
              testID={`merchant-orders-tab-${t.key}`}
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

      {/* Toast */}
      {toast && (
        <View
          style={[
            styles.toast,
            toast.kind === 'success'
              ? styles.toastSuccess
              : toast.kind === 'error'
                ? styles.toastError
                : styles.toastInfo,
          ]}
          testID="merchant-orders-toast"
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#FF8A00" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : !merchantId ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="storefront-outline" size={40} color="#BBB" />
          <Text style={styles.emptyText}>Please log in as a merchant to view orders.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#D32F2F" />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => merchantId && fetchOrders(merchantId)} testID="merchant-orders-retry-btn">
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
              <Text style={styles.emptyText}>No {activeTab.replace('_', ' ').toLowerCase()} orders.</Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <MerchantOrderCard
                key={order.pickup_id}
                order={order}
                onAdvance={() => advanceStatus(order)}
                isUpdating={updatingId === order.pickup_id}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function MerchantOrderCard({
  order,
  onAdvance,
  isUpdating,
}: {
  order: PickupOrder;
  onAdvance: () => void;
  isUpdating: boolean;
}) {
  const statusKey = String(order.status).toUpperCase();
  const color = STATUS_COLORS[statusKey] || { bg: '#F5F5F5', text: '#666' };
  const nextInfo = NEXT_STATUS[statusKey];
  const orderDate = formatDateTime(order.acceptedAt || order.respondBy || order.endedAt || null);

  return (
    <View style={styles.card} testID={`merchant-order-card-${order.pickup_id}`}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.customerName} numberOfLines={1}>
            {order.customerName || `Customer #${order.customerId}`}
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

      {nextInfo && (
        <TouchableOpacity
          style={[styles.actionBtn, isUpdating && styles.actionBtnDisabled]}
          onPress={onAdvance}
          disabled={isUpdating}
          testID={`merchant-order-action-${order.pickup_id}`}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name={nextInfo.icon} size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>{nextInfo.label}</Text>
            </>
          )}
        </TouchableOpacity>
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
  tabBadge: { backgroundColor: '#FFE1BF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { color: '#FF8A00', fontWeight: '800', fontSize: 10 },
  tabBadgeTextActive: { color: '#FFFFFF' },

  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 10, borderRadius: 10, padding: 10, borderWidth: 1,
  },
  toastSuccess: { backgroundColor: '#E8F5E9', borderColor: '#B7E1BF' },
  toastError: { backgroundColor: '#FDECEA', borderColor: '#F5C2C0' },
  toastInfo: { backgroundColor: '#E3F2FD', borderColor: '#BBDEFB' },
  toastText: { flex: 1, fontSize: 13, fontWeight: '700' },

  listContent: { padding: 12, paddingBottom: 32 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: '#666', fontSize: 13 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF8A00', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EDEDED' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  customerName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
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
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FF8A00', borderRadius: 10, paddingVertical: 12, marginTop: 12,
  },
  actionBtnDisabled: { backgroundColor: '#CCCCCC' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  endReasonBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDECEA', borderRadius: 8, padding: 8, marginTop: 10 },
  endReasonText: { color: '#D32F2F', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
