import { useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { Booking, bookingDates, bookingToday, bookingPhone, slotRequest } from '../utils/slotBookings';
import { bookingNotification } from '../utils/bookingNotifications';
import { INTOWN_API_BASE, searchUserByPhoneAtBase } from '../utils/api';
import { merchantRecord } from '../utils/merchantProfile';
import { presentLocalNotification } from '../utils/pushNotifications';
import { playNotificationFeedback } from '../utils/notificationFeedback';
export default function BookingNotificationPoller() {
  const { user, token, isAuthenticated, isGuest } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated || isGuest || !user?.phone || !token) return;
    let alive = true, busy = false; let merchantId: string | null = null;
    const pollRole = async (merchant: boolean) => {
      const key = `booking_notifications_v1:${INTOWN_API_BASE}:${user.phone}:${merchant ? 'merchant' : 'customer'}`;
      let bookings: Booking[];
      if (merchant) {
        if (!merchantId) { const lookup = await searchUserByPhoneAtBase(user.phone, INTOWN_API_BASE); const record = merchantRecord(lookup?.merchant ?? lookup?.data?.merchant); if (!record) return; merchantId = String(record.id); }
        // Include all bookable dates so tomorrow's requests notify the merchant today.
        const days = await Promise.all(bookingDates().map(date => slotRequest<Booking[]>(`/merchant/${encodeURIComponent(merchantId!)}?date=${date}`, token)));
        bookings = days.flat();
      } else bookings = await slotRequest<Booking[]>(`/customer/${bookingPhone(user.phone)}`, token);
      if (!alive || !Array.isArray(bookings)) return;
      const raw = await AsyncStorage.getItem(key); const prior: Record<string, string> = raw ? JSON.parse(raw) : {};
      await useNotificationStore.getState().hydrate();
      if (!alive) return;
      for (const b of bookings) {
        const changed = prior[b.bookingId] !== b.status;
        const notify = merchant ? b.status === 'PENDING_APPROVAL' && changed || b.status === 'CANCELLED' && !!prior[b.bookingId] && changed : changed && (!!prior[b.bookingId] || b.status === 'ACCEPTED' && b.bookingDate >= bookingToday());
        if (notify) { const n = bookingNotification(b, merchant); if (useNotificationStore.getState().add(n)) { playNotificationFeedback(); void presentLocalNotification(n.title, n.body, { type: n.kind, bookingDate: b.bookingDate, bookingId: b.bookingId, pickup_id: b.bookingId, status: b.status }); } }
        prior[b.bookingId] = b.status;
      }
      if (alive) await AsyncStorage.setItem(key, JSON.stringify(prior));
    };
    const poll = async () => { if (busy || AppState.currentState !== 'active') return; busy = true; try { await pollRole(false).catch(() => {}); if (alive && (user.userType === 'merchant' || user.userType === 'dual')) await pollRole(true).catch(() => {}); } finally { busy = false; } };
    void poll(); const timer = setInterval(() => void poll(), 60000); const subscription = AppState.addEventListener('change', state => { if (state === 'active') void poll(); });
    return () => { alive = false; clearInterval(timer); subscription.remove(); };
  }, [user?.phone, user?.userType, user, token, isAuthenticated, isGuest]);
  return null;
}
