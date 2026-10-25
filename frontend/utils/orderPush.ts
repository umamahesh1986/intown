import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './api';
import type { PickupOrder } from './api';

type Role = 'merchant' | 'customer';

interface OrderPush {
  toRole: Role;
  toUserId: string | number;
  title: string;
  body: string;
  data: Record<string, string>;
}

// Fire-and-forget: relay → Expo Push → the other party's device (works while their app is closed).
// The 15s poller remains as the fallback when the recipient has no push token.
const send = async (p: OrderPush) => {
  if (p.toUserId == null || p.toUserId === '') return;
  const [merchantId, customerId] = await Promise.all([
    AsyncStorage.getItem('merchant_id'),
    AsyncStorage.getItem('customer_id'),
  ]);
  const fromRole: Role = p.toRole === 'merchant' ? 'customer' : 'merchant';
  try {
    await fetch(`${BACKEND_URL}/api/push/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        toRole: p.toRole,
        toUserId: String(p.toUserId),
        title: p.title,
        body: p.body,
        data: { ...p.data, title: p.title, body: p.body },
        fromRole,
        fromUserId: fromRole === 'merchant' ? merchantId : customerId,
      }),
    });
  } catch (e) {
    console.warn('[orderPush] relay failed', e);
  }
};

const who = async (key: string, fallback: string) => ((await AsyncStorage.getItem(key)) || '').trim() || fallback;

const customerDisplayName = async (fallback: string) => {
  try {
    const raw = await AsyncStorage.getItem('user_data');
    const name = raw ? String(JSON.parse(raw)?.name || '').trim() : '';
    return name || fallback;
  } catch {
    return fallback;
  }
};

// ---- Customer → Merchant ----
export const pushOrderPlaced = async (merchantId: string | number, pickupId: string, itemCount: number) => {
  const customer = await customerDisplayName('A customer');
  send({
    toRole: 'merchant',
    toUserId: merchantId,
    title: 'New pickup order',
    body: `${customer} placed an order (${itemCount} item${itemCount === 1 ? '' : 's'}). Tap to accept.`,
    data: { type: 'ORDER_RECEIVED_MERCHANT', pickup_id: pickupId, status: 'PLACED' },
  });
};

export const pushCustomerPickedUp = async (order: PickupOrder) => {
  const customer = order.customerName || (await customerDisplayName('The customer'));
  send({
    toRole: 'merchant',
    toUserId: order.merchantId,
    title: 'Customer picked up order',
    body: `${customer} confirmed pickup of ${order.pickup_id}. Tap to mark it delivered.`,
    data: { type: 'ORDER_PICKED_UP_MERCHANT', pickup_id: order.pickup_id, status: String(order.status || '').toUpperCase() },
  });
};

export const pushCustomerCancelled = async (order: PickupOrder) => {
  const customer = order.customerName || (await customerDisplayName('The customer'));
  send({
    toRole: 'merchant',
    toUserId: order.merchantId,
    title: 'Order cancelled',
    body: `${customer} cancelled order ${order.pickup_id}.`,
    data: { type: 'ORDER_CANCELLED_MERCHANT', pickup_id: order.pickup_id, status: 'ENDED' },
  });
};

// ---- Merchant → Customer ----
type MerchantEvent = 'ACCEPTED' | 'PICKUP_READY' | 'REJECTED' | 'COMPLETED';

const customerCopy = (shop: string, pickupId: string): Record<MerchantEvent, { title: string; body: string; status: string }> => ({
  ACCEPTED: { title: 'Order accepted', body: `${shop} accepted your order ${pickupId}. We'll tell you when it's ready.`, status: 'ACCEPTED' },
  PICKUP_READY: { title: 'Ready for pickup', body: `Your order at ${shop} is packed and ready. Come and collect it!`, status: 'PICKUP_READY' },
  REJECTED: { title: 'Order rejected', body: `${shop} could not take your order ${pickupId}.`, status: 'ENDED' },
  COMPLETED: { title: 'Order completed', body: `${shop} marked your order ${pickupId} as delivered. Thanks for shopping local!`, status: 'COMPLETED' },
});

export const pushMerchantOrderEvent = async (order: PickupOrder, event: MerchantEvent) => {
  const shop = order.merchantName || (await who('merchant_shop_name', 'The shop'));
  const copy = customerCopy(shop, order.pickup_id)[event];
  send({
    toRole: 'customer',
    toUserId: order.customerId,
    title: copy.title,
    body: copy.body,
    data: { type: 'ORDER_STATUS_CUSTOMER', pickup_id: order.pickup_id, status: copy.status },
  });
};
