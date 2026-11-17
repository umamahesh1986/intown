import { pushBookingEvent } from '../utils/bookingNotifications';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Availability, Booking, Slot, bookingPhone, bookingToday, canRequest, slotRequest } from '../utils/slotBookings';
import { BookingButton, bs } from '../components/BookingUI';
import SlotBookingView from '../components/SlotBookingView';
export default function SlotBookingScreen() {
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>(); const router = useRouter();
  const { user, token, isAuthenticated, isGuest } = useAuthStore(); const signedIn = isAuthenticated && !isGuest && !!token;
  const [date, setDate] = useState(bookingToday()); const [data, setData] = useState<Availability | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [slot, setSlot] = useState<Slot | null>(null); const [name, setName] = useState(user?.name || ''); const [people, setPeople] = useState(1); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false); const version = useRef(0); const [, tick] = useState(0);
  const [details, setDetails] = useState(false);
  const chooseDate = (value: string) => { setSlot(null); setDetails(false); setDate(value); };
  useEffect(() => { setDetails(false); }, [date, merchantId, signedIn, token]);
  useEffect(() => { const timer = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(timer); }, []);
  const load = useCallback(async () => { const current = ++version.current; setData(null); setError(''); setSlot(null); if (!signedIn || !merchantId) return; setLoading(true); try { const result = await slotRequest<Availability>(`/available?merchantId=${encodeURIComponent(merchantId)}&date=${date}`, token); if (!Array.isArray(result?.slots)) throw new Error('Invalid slot availability response.'); if (current === version.current) setData(result); } catch (e: any) { if (current === version.current) setError(e.message); } finally { if (current === version.current) setLoading(false); } }, [merchantId, date, token, signedIn]);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current++; }; }, [load]));
  const submit = async () => {
    if (lock.current || !slot || !data || !user) return;
    if (!name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
    if (!canRequest(date, slot)) { Alert.alert('Choose another slot', 'Please select a slot starting at least 1 hour from now.'); setSlot(null); void load(); return; }
    lock.current = true; setBusy(true); const sessionToken = token;
    try { const created = await slotRequest<Booking>('/book', token, { merchantId: Number(merchantId), customerPhoneNumber: bookingPhone(user.phone), customerName: name.trim(), bookingDate: date, startTime: slot.startTime, numberOfPeople: /restaurant/i.test(data.businessCategory) ? people : 1, notes: notes.trim() }); if (useAuthStore.getState().token !== sessionToken) return; void pushBookingEvent(created, true); setSlot(null); setNotes(''); Alert.alert('Request sent', 'Your request has been sent! Merchant has up to 2 hours to confirm, or until 1 hour before the slot starts, whichever comes first.'); router.push('/my-bookings'); }
    catch (e: any) { Alert.alert('Booking unavailable', e.status === 409 ? 'This slot may have just been booked. Please select another slot. ' + e.message : e.message); if (useAuthStore.getState().token === sessionToken) { setSlot(null); void load(); } }
    finally { lock.current = false; setBusy(false); }
  };
  return <SafeAreaView style={bs.page}><SlotBookingView data={data} date={date} slot={slot} signedIn={signedIn} loading={loading} error={error} busy={busy}
    onDate={chooseDate} onSlot={value => { setSlot(value); setPeople(1); }}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/account')}
    onRetry={() => void load()} onContinue={() => { if (slot && canRequest(date, slot)) setDetails(true); else { setSlot(null); void load(); } }} /><Modal visible={details && !!slot && signedIn} animationType="slide" transparent onRequestClose={() => { if (!busy) setDetails(false); }}><KeyboardAvoidingView style={bs.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={bs.sheet}><ScrollView contentContainerStyle={bs.content} keyboardShouldPersistTaps="handled"><Text style={bs.heading}>Request your visit</Text><Text style={bs.copy}>{data?.businessName} · {date}{'\n'}{slot?.startTime} – {slot?.endTime}</Text><Text style={bs.copy}>Phone: {user?.phone}</Text><Text style={bs.copy}>Your name</Text><TextInput accessibilityLabel="Customer name" style={bs.input} value={name} onChangeText={setName} maxLength={100} editable={!busy} />{/restaurant/i.test(data?.businessCategory || '') && <View style={bs.row}><Text style={bs.copy}>People strength</Text><BookingButton title="−" disabled={busy || people <= 1} onPress={() => setPeople(n => n - 1)} /><Text style={bs.heading}>{people}</Text><BookingButton title="+" disabled={busy || people >= 20} onPress={() => setPeople(n => n + 1)} /></View>}<TextInput accessibilityLabel="Booking notes" placeholder="Notes (optional)" multiline style={bs.input} value={notes} onChangeText={setNotes} maxLength={1000} editable={!busy} /><BookingButton title={busy ? 'Sending…' : 'Request Booking'} disabled={busy} onPress={() => void submit()} /><BookingButton title="Close" disabled={busy} color="#64748B" onPress={() => setDetails(false)} /></ScrollView></View></KeyboardAvoidingView></Modal></SafeAreaView>;
}
