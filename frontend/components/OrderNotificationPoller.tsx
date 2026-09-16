import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../store/notificationStore';
import { getMerchantPickupOrders, getCustomerPickupOrders, PickupOrder } from '../utils/api';

const POLL_INTERVAL_MS = 15000;
const MERCHANT_SNAP_KEY = 'notif_snap_merchant_v1';
const CUSTOMER_SNAP_KEY = 'notif_snap_customer_v1';
const SKIP_PATHS = ['/', '/index', '/login', '/otp', '/promo-carousel', '/location'];

type MerchantSnap = { merchantId: string; placedIds: string[] };
type CustomerSnap = { customerId: string; statusMap: Record<string, string> };

const readJson = async <T,>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});

const customerLabel = (o: PickupOrder) => o.customerName || `Customer #${o.customerId}`;
const merchantLabel = (o: PickupOrder) => o.merchantName || `Merchant #${o.merchantId}`;

export const customerStatusMessage = (o: PickupOrder, status: string) => {
  const m = merchantLabel(o);
  switch (status) {
    case 'ACCEPTED':
      return { title: 'Order accepted', body: `${m} has accepted your order.` };
    case 'PICKUP_READY':
      return { title: 'Ready for pickup', body: `Your order at ${m} is ready for pickup.` };
    case 'COMPLETED':
      return { title: 'Order completed', body: `Your order at ${m} has been completed.` };
    case 'ENDED': {
      const reason = String(o.endReason || '').toUpperCase();
      if (reason === 'REJECTED_BY_MERCHANT') return { title: 'Order rejected', body: `${m} has rejected your order.` };
      if (reason === 'EXPIRED_NO_RESPONSE') return { title: 'Order expired', body: `Your order at ${m} expired without a response.` };
      return { title: 'Order ended', body: `Your order at ${m} was ended.` };
    }
    default:
      return { title: 'Order update', body: `Order ${o.pickup_id} is now ${status.replace('_', ' ')}.` };
  }
};

export const pollMerchantOrders = async (merchantId: string): Promise<PickupOrder[]> => {
  const list = await getMerchantPickupOrders(merchantId);
  const placed = list.filter((o) => String(o.status).toUpperCase() === 'PLACED');
  const placedIds = placed.map((o) => o.pickup_id);
  const snap = await readJson<MerchantSnap>(MERCHANT_SNAP_KEY);

  if (snap && snap.merchantId === merchantId) {
    const known = new Set(snap.placedIds);
    const add = useNotificationStore.getState().add;
    placed
      .filter((o) => !known.has(o.pickup_id))
      .forEach((o) =>
        add({
          kind: 'ORDER_RECEIVED_MERCHANT',
          title: 'New pickup order',
          body: `From ${customerLabel(o)} — tap to view & accept.`,
          targetRoute: '/merchant-orders',
          targetTab: 'PLACED',
          pickup_id: o.pickup_id,
        }),
      );
  }
  await writeJson(MERCHANT_SNAP_KEY, { merchantId, placedIds } as MerchantSnap);
  return list;
};

export const pollCustomerOrders = async (customerId: string): Promise<PickupOrder[]> => {
  const list = await getCustomerPickupOrders(customerId);
  const statusMap: Record<string, string> = {};
  for (const o of list) statusMap[o.pickup_id] = String(o.status).toUpperCase();
  const snap = await readJson<CustomerSnap>(CUSTOMER_SNAP_KEY);

  if (snap && snap.customerId === customerId) {
    const add = useNotificationStore.getState().add;
    for (const o of list) {
      const curr = statusMap[o.pickup_id];
      const prev = snap.statusMap[o.pickup_id];
      if (prev && prev !== curr) {
        const { title, body } = customerStatusMessage(o, curr);
        add({
          kind: 'ORDER_STATUS_CUSTOMER',
          title,
          body,
          targetRoute: '/my-orders',
          targetTab: curr,
          pickup_id: o.pickup_id,
        });
      }
    }
  }
  await writeJson(CUSTOMER_SNAP_KEY, { customerId, statusMap } as CustomerSnap);
  return list;
};

export default function OrderNotificationPoller() {
  const pathname = usePathname();
  const busyRef = useRef(false);
  const active = !SKIP_PATHS.includes(pathname);
  // The order screens run their own 15s poll (via pollMerchantOrders / pollCustomerOrders),
  // so skip the matching role here to avoid duplicate /pickup-orders calls.
  const skipMerchant = pathname === '/merchant-orders';
  const skipCustomer = pathname === '/my-orders';

  useEffect(() => {
    if (!active) return;

    const tick = async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const [merchantId, customerId] = await Promise.all([
          AsyncStorage.getItem('merchant_id'),
          AsyncStorage.getItem('customer_id'),
        ]);
        await Promise.all([
          merchantId && !skipMerchant ? pollMerchantOrders(merchantId).catch((e) => console.warn('[OrderPoller] merchant', e)) : null,
          customerId && !skipCustomer ? pollCustomerOrders(customerId).catch((e) => console.warn('[OrderPoller] customer', e)) : null,
        ]);
      } finally {
        busyRef.current = false;
      }
    };

    tick();
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, skipMerchant, skipCustomer]);

  return null;
}
