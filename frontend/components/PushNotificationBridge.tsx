import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../store/notificationStore';
import {
  isNativePush,
  registerForPushNotifications,
  notificationFromPushData,
  PushData,
} from '../utils/pushNotifications';

const AUTH_FREE_PATHS = ['/', '/index', '/login', '/otp', '/promo-carousel', '/location'];

// Registers the device for Expo push, mirrors incoming pushes into the bell, and deep-links on tap.
export default function PushNotificationBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const registeredForRef = useRef<string>('');

  // (Re)register whenever the logged-in ids change — e.g. right after OTP login.
  useEffect(() => {
    if (!isNativePush || AUTH_FREE_PATHS.includes(pathname)) return;
    (async () => {
      const [merchantId, customerId] = await Promise.all([
        AsyncStorage.getItem('merchant_id'),
        AsyncStorage.getItem('customer_id'),
      ]);
      const key = `${merchantId ?? ''}|${customerId ?? ''}`;
      if (key === '|' || key === registeredForRef.current) return;
      registeredForRef.current = key;
      await registerForPushNotifications({ merchantId, customerId });
    })();
  }, [pathname]);

  useEffect(() => {
    if (!isNativePush) return;
    let alive = true;

    const openFromData = (data: PushData) => {
      const item = notificationFromPushData(data);
      if (!item) return;
      useNotificationStore.getState().add(item);
      useNotificationStore.getState().markReadByPickup(item.pickup_id);
      router.push({ pathname: item.targetRoute, params: { tab: item.targetTab, highlightId: item.pickup_id } });
    };

    // Push arrived while the app is in the foreground → add to bell (system banner shown by handler)
    const received = Notifications.addNotificationReceivedListener((n) => {
      const content = n.request.content;
      const item = notificationFromPushData(content.data as PushData, content.title ?? undefined, content.body ?? undefined);
      if (item) useNotificationStore.getState().add(item);
    });

    // User tapped a notification (foreground / background)
    const response = Notifications.addNotificationResponseReceivedListener((r) => {
      if (alive) openFromData(r.notification.request.content.data as PushData);
    });

    // Cold start from a notification tap
    Notifications.getLastNotificationResponseAsync()
      .then((last) => {
        if (!alive || !last) return;
        openFromData(last.notification.request.content.data as PushData);
        return Notifications.clearLastNotificationResponseAsync();
      })
      .catch(() => {});

    return () => {
      alive = false;
      received.remove();
      response.remove();
    };
  }, [router]);

  return null;
}
