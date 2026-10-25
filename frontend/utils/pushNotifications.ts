import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INTOWN_API_BASE, BACKEND_URL } from './api';
import { NotificationItem, NotificationKind } from '../store/notificationStore';

export const isNativePush = Platform.OS === 'ios' || Platform.OS === 'android';
export const PUSH_TOKEN_KEY = 'expo_push_token';
export const PUSH_REGISTERED_KEY = 'expo_push_registered_v1';
const CHANNEL_ID = 'orders';

// Backend push payload contract (data field):
// { type: 'ORDER_RECEIVED_MERCHANT' | 'ORDER_STATUS_CUSTOMER' | 'ORDER_PICKED_UP_MERCHANT', pickup_id, status }
export interface PushData {
  type?: NotificationKind;
  pickup_id?: string;
  status?: string;
  title?: string;
  body?: string;
}

if (isNativePush) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;

export const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Order updates',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF8A00',
    sound: 'default',
  });
};

// Sends the Expo push token to the push relay (our backend) for every role the user has.
// Relay: PUT {BACKEND_URL}/api/push/tokens  { role, userId, expoPushToken, platform }
// Also tries the INtown API contract (PUT /merchants/{id}/push-token) best-effort for when it ships.
const sendTokenToBackend = async (token: string, ids: { merchantId?: string | null; customerId?: string | null }) => {
  const roles: Array<{ role: 'merchant' | 'customer'; userId: string }> = [];
  if (ids.merchantId) roles.push({ role: 'merchant', userId: String(ids.merchantId) });
  if (ids.customerId) roles.push({ role: 'customer', userId: String(ids.customerId) });
  if (roles.length === 0) return false;

  const results = await Promise.all(
    roles.map(async ({ role, userId }) => {
      fetch(`${INTOWN_API_BASE}/${role}s/${userId}/push-token`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ expoPushToken: token, platform: Platform.OS }),
      }).catch(() => {});
      try {
        const res = await fetch(`${BACKEND_URL}/api/push/tokens`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ role, userId, expoPushToken: token, platform: Platform.OS }),
        });
        if (!res.ok) console.warn('[push] relay token registration failed', role, res.status);
        return res.ok;
      } catch (e) {
        console.warn('[push] relay token registration error', role, e);
        return false;
      }
    }),
  );
  return results.every(Boolean);
};

// Returns the Expo push token (or null). Persists whether the backend accepted it.
export const registerForPushNotifications = async (ids: {
  merchantId?: string | null;
  customerId?: string | null;
}): Promise<string | null> => {
  if (!isNativePush || !Device.isDevice) return null;
  try {
    await ensureAndroidChannel();
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;

    const pid = projectId();
    if (!pid) {
      console.warn('[push] missing extra.eas.projectId in app.json');
      return null;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: pid })).data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    const registered = await sendTokenToBackend(token, ids);
    await AsyncStorage.setItem(PUSH_REGISTERED_KEY, registered ? '1' : '0');
    return token;
  } catch (e) {
    console.warn('[push] registration failed', e);
    return null;
  }
};

export const isPushRegistered = async () => (await AsyncStorage.getItem(PUSH_REGISTERED_KEY)) === '1';

// Shows a system-tray notification immediately (used by the polling fallback).
export const presentLocalNotification = async (title: string, body: string, data: PushData) => {
  if (!isNativePush) return;
  try {
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data as Record<string, unknown>, sound: 'default' },
      trigger: null,
    });
  } catch (e) {
    console.warn('[push] local notification failed', e);
  }
};

// Maps a push payload to the in-app notification item shape.
export const notificationFromPushData = (
  data: PushData,
  fallbackTitle?: string,
  fallbackBody?: string,
): Omit<NotificationItem, 'id' | 'timestamp' | 'read'> | null => {
  const pickupId = String(data?.pickup_id ?? '');
  if (!pickupId || !data?.type) return null;
  const status = String(data.status || '').toUpperCase();
  const isMerchant =
    data.type === 'ORDER_RECEIVED_MERCHANT' || data.type === 'ORDER_PICKED_UP_MERCHANT' || data.type === 'ORDER_CANCELLED_MERCHANT';
  return {
    kind: data.type,
    title: data.title || fallbackTitle || 'Order update',
    body: data.body || fallbackBody || `Order ${pickupId}`,
    targetRoute: isMerchant ? '/merchant-orders' : '/my-orders',
    targetTab: data.type === 'ORDER_RECEIVED_MERCHANT' ? 'PLACED' : status || 'PLACED',
    pickup_id: pickupId,
  };
};
