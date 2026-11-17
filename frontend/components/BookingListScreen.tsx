import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { INTOWN_API_BASE, searchUserByPhoneAtBase } from '../utils/api';
import { merchantFromLookup } from '../utils/merchantProfile';
import { Booking, bookingPhone, bookingToday, canCancel, slotRequest } from '../utils/slotBookings';
import { BookingPeriod, loadMerchantBookings } from '../utils/merchantBookingHistory';
import { pushBookingEvent } from '../utils/bookingNotifications';
import { BookingHeader, bs } from './BookingUI';
import MyBookingsView from './MyBookingsView';
import MerchantBookingsView, { validBookingDate } from './MerchantBookingsView';

const filterForTab = (tab?: string) => tab === 'ACCEPTED' ? 'Confirmed' : tab === 'PENDING_APPROVAL' ? 'Pending' : tab ? 'Past' : 'All';
export default function BookingListScreen({ merchant = false }: { merchant?: boolean }) {
  const params = useLocalSearchParams<{ date?: string; tab?: string }>();
  const { user, token, isAuthenticated, isGuest, isHydrated } = useAuthStore();
  const authorized = isHydrated && isAuthenticated && !isGuest && !!token;
  const [date, setDate] = useState(params.date && validBookingDate(params.date) ? params.date : bookingToday());
  const [period, setPeriod] = useState<BookingPeriod>(params.date ? 'Date' : 'Today');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(filterForTab(params.tab));
  const [busy, setBusy] = useState(false);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const version = useRef(0);
  const lock = useRef(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const load = useCallback(async () => {
    const current = ++version.current;
    setBookings([]); setError(''); setMerchantId(null);
    if (!authorized || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      let path = `/customer/${bookingPhone(user.phone)}`;
      if (merchant) {
        const lookup = await searchUserByPhoneAtBase(user.phone, INTOWN_API_BASE);
        if (version.current !== current || useAuthStore.getState().token !== token) return;
        const profile = merchantFromLookup(lookup);
        if (!profile) throw new Error('No merchant profile is linked to your signed-in phone number. Please sign in with the phone number used to register your business.');
        setMerchantId(String(profile.id));
        const records = await loadMerchantBookings(String(profile.id), token, period, date, () => version.current === current && useAuthStore.getState().token === token);
        if (version.current === current && useAuthStore.getState().token === token) setBookings(records);
        return;
      }
      const data = await slotRequest<Booking[]>(path, token);
      if (!Array.isArray(data)) throw new Error('Invalid booking list response.');
      if (version.current === current && useAuthStore.getState().token === token) setBookings(data);
    } catch (e: any) { if (version.current === current) setError(e.message); }
    finally { if (version.current === current) setLoading(false); }
  }, [authorized, user, token, merchant, date, period]);
  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => { if (!lock.current) void load(); }, 60000);
    return () => { clearInterval(timer); version.current++; };
  }, [load]));
  const action = async (b: Booking, verb: string, reason?: string): Promise<boolean> => {
    if (lock.current || !authorized || !user) return false;
    lock.current = true; setBusy(true);
    const sessionToken = token;
    try {
      if (merchant) {
        const updated = (await slotRequest<Partial<Booking> | null>('/merchant/action', token, { bookingId: b.bookingId, action: verb, ...(reason ? { reason } : {}) })) || {};
        const statuses: Record<string, Booking['status']> = { ACCEPT: 'ACCEPTED', REJECT: 'REJECTED', COMPLETE: 'COMPLETED', NO_SHOW: 'NO_SHOW' };
        if (useAuthStore.getState().token === sessionToken) void pushBookingEvent({ ...b, ...updated, status: updated.status || statuses[verb], merchantActionReason: reason }, false);
      } else {
        if (!canCancel(b)) throw new Error('Cancellations are only allowed up to 1 hour before the slot.');
        await slotRequest(`/cancel/${encodeURIComponent(b.bookingId)}?customerPhone=${bookingPhone(user.phone)}`, token, {});
        if (useAuthStore.getState().token === sessionToken) void pushBookingEvent({ ...b, status: 'CANCELLED' }, true);
      }
      if (useAuthStore.getState().token === sessionToken) await load();
      return true;
    } catch (e: any) {
      if (useAuthStore.getState().token === sessionToken) {
        if (Platform.OS === 'web') globalThis.alert(`Unable to update booking\n\n${e.message}`);
        else Alert.alert('Unable to update booking', e.message);
        // Keep the booking and rejection draft visible so the merchant can retry.
      }
      return false;
    } finally { lock.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (params.date && validBookingDate(params.date)) { setDate(params.date); setPeriod('Date'); }
    if (params.tab) setFilter(filterForTab(params.tab));
  }, [params.date, params.tab]);
  if (!isHydrated) return <SafeAreaView style={bs.page}><BookingHeader title={merchant ? 'Daily Bookings' : 'My Bookings'} /><ActivityIndicator style={{ marginTop: 32 }} color="#FF7900" /><Text style={[bs.copy, { textAlign: 'center', marginTop: 12 }]}>Loading your account…</Text></SafeAreaView>;
  if (merchant) return <MerchantBookingsView period={period} onPeriod={setPeriod} date={date} onDate={value => { setDate(value); setPeriod('Date'); }} filter={filter} onFilter={setFilter} bookings={bookings} loading={loading} busy={busy} error={error} authorized={authorized} merchantId={merchantId} token={token} onRefresh={() => void load()} onAction={action} />;
  return <MyBookingsView bookings={bookings} loading={loading} busy={busy} error={error} authorized={authorized} now={now} initialTab={params.tab} accountKey={String(user?.phone || '')} onRefresh={() => void load()} onCancel={async b => { await action(b, 'CANCEL'); }} />;
}
