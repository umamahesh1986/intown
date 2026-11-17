import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Availability, Slot, bookingDates, bookingToday, canRequest } from '../utils/slotBookings';

type Period = 'All' | 'Morning' | 'Evening';
interface Props {
  data: Availability | null; date: string; slot: Slot | null; signedIn: boolean;
  loading: boolean; error: string; busy: boolean;
  onDate: (date: string) => void; onSlot: (slot: Slot) => void;
  onBack: () => void; onRetry: () => void; onContinue: () => void;
}
const orange = '#FF7100';
export default function SlotBookingView({ data, date, slot, signedIn, loading, error, busy, onDate, onSlot, onBack, onRetry, onContinue }: Props) {
  const [period, setPeriod] = useState<Period>('All');
  const [calendar, setCalendar] = useState(false);
  const [draft, setDraft] = useState(date);
  const [dateError, setDateError] = useState('');
  const dates = bookingDates();
  if (!dates.includes(date)) dates.unshift(date);
  // Evening includes afternoon visits so the filters cover every available slot.
  const slots = (data?.slots || []).filter(s => period === 'All' || (period === 'Morning' ? Number(s.startTime.slice(0, 2)) < 12 : Number(s.startTime.slice(0, 2)) >= 12));
  const available = data?.slots.filter(s => canRequest(date, s)).length || 0;
  const selected = !!slot && canRequest(date, slot);
  const applyDate = () => {
    const value = draft.trim();
    const parsed = new Date(`${value}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value < bookingToday()) { setDateError('Enter today or a future date as YYYY-MM-DD.'); return; }
    onDate(value); setCalendar(false);
  };
  return <View style={s.page}>
    <View style={s.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.back}><Ionicons name="chevron-back" size={23} color="#151D30" /></TouchableOpacity><Text style={s.title}>Book a Slot</Text></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {!signedIn ? <View style={s.card}><Text style={s.copy}>Please sign in to request a booking.</Text></View> : <>
        <View style={[s.card, s.shopCard]}>
          <View pointerEvents="none" style={s.glow} />
          <Text style={s.category}>{(data?.businessCategory || 'LOCAL BUSINESS').toUpperCase()}</Text>
          <Text style={s.shopName}>{data?.businessName || 'Choose your visit'}</Text>
          <View style={s.subtitle}><Text style={s.copy}>One-hour visits</Text><View style={s.separator} /><Text style={s.confirmation}>Confirmation required</Text></View>
          <View style={s.divider} />
          <View style={s.between}><Text style={s.label}>CHOOSE DATE</Text><TouchableOpacity accessibilityRole="button" onPress={() => { setDraft(date); setDateError(''); setCalendar(true); }} style={s.custom}><Ionicons name="calendar-outline" color={orange} size={14} /><Text style={s.customText}>Custom Date</Text></TouchableOpacity></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dates}>
            {dates.map(d => <TouchableOpacity key={d} accessibilityRole="button" accessibilityState={{ selected: d === date }} onPress={() => onDate(d)} style={[s.date, d === date && s.dateSelected]}>{d === date && <Ionicons name="checkmark" size={16} color="#FFF" />}<Text style={[s.dateText, d === date && s.dateSelectedText]}>{new Date(`${d}T12:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })}</Text></TouchableOpacity>)}
          </ScrollView>
        </View>
        <View style={s.card}>
          <View style={s.timesHeader}><View><Text style={s.heading}>Available times</Text><Text style={s.copy}>{available} slots available {date === bookingToday() ? 'today' : 'on this date'}</Text></View><View accessibilityRole="tablist" style={s.filters}>{(['All', 'Morning', 'Evening'] as Period[]).map(value => <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: period === value }} key={value} onPress={() => setPeriod(value)} style={[s.filter, period === value && s.activeFilter]}><Text style={[s.filterText, period === value && { color: orange }]}>{value}</Text></TouchableOpacity>)}</View></View>
          {loading && <ActivityIndicator style={s.loader} color={orange} accessibilityLabel="Loading available slots" />}
          {!!error && <View style={s.message}><Text style={s.error}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={onRetry}><Text style={s.customText}>Retry availability</Text></TouchableOpacity></View>}
          {data && !loading && !error && (data.isWeekOff ? <Text style={s.empty}>This shop is closed on this date. Please choose another date.</Text> : <>
            <View style={s.grid}>{slots.map(item => {
              const enabled = canRequest(date, item);
              const active = enabled && slot?.startTime === item.startTime;
              const pause = item.status === 'BREAK';
              const label = active ? 'Selected' : pause ? 'Kitchen Break' : enabled ? data.slotCapacity > 1 ? `${item.availableCapacity} available` : 'Available' : item.status === 'BOOKED' || item.availableCapacity === 0 && item.status === 'AVAILABLE' ? 'Full' : item.status === 'CLOSED' ? 'Closed' : 'Passed / too soon';
              return <TouchableOpacity key={item.startTime} accessibilityRole="button" accessibilityLabel={`${item.startTime} to ${item.endTime}, ${label}`} accessibilityState={{ selected: active, disabled: !enabled }} disabled={!enabled || busy} onPress={() => onSlot(item)} style={[s.slot, pause && s.breakSlot, !enabled && !pause && s.disabledSlot, active && s.selectedSlot]}>
                <Text style={[s.time, !enabled && s.disabledTime, pause && s.strike, active && s.selectedText]}>{item.startTime.slice(0, 5)} – {item.endTime.slice(0, 5)}</Text>
                <View style={s.status}>{!active && <View style={[s.dot, { backgroundColor: pause ? '#FFC13D' : enabled ? '#10B981' : '#A3ADBC' }]} />}<Text style={[s.copy, pause && { color: '#D56700' }, active && s.selectedText]}>{label}</Text></View>
                {active && <View style={s.selectedDot} />}
              </TouchableOpacity>;
            })}</View>
            {!slots.length && <Text style={s.empty}>No {period === 'All' ? '' : period.toLowerCase() + ' '}slots for this date. Please choose another date or time filter.</Text>}
          </>)}
        </View>
        <View style={s.policy}><View style={s.policyIcon}><Ionicons name="shield-checkmark-outline" size={17} color={orange} /></View><View style={s.policyBody}><Text style={s.policyTitle}>Your reservation request</Text><Text style={s.policyCopy}>Merchant confirmation is required.</Text><Text style={s.policyCopy}>Confirmed visits can be cancelled up to 1 hour before the slot starts.</Text></View></View>
      </>}
    </ScrollView>
    {signedIn && <View style={s.footer}><TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !selected || busy || loading }} disabled={!selected || busy || loading} onPress={onContinue} style={[s.cta, (!selected || busy || loading) && s.disabledCta]}><Text style={s.ctaText}>{selected ? `Book Selected Slot (${slot!.startTime.slice(0, 5)})` : 'Select a slot to continue'}</Text><Ionicons name="arrow-forward" size={20} color="#FFF" /></TouchableOpacity></View>}
    <Modal visible={calendar} transparent animationType="fade" onRequestClose={() => setCalendar(false)}><KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={s.dateModal}><Text style={s.heading}>Choose a custom date</Text><Text style={s.copy}>Enter today or a future date (YYYY-MM-DD).</Text><TextInput autoFocus accessibilityLabel="Custom booking date" placeholder="YYYY-MM-DD" value={draft} onChangeText={setDraft} maxLength={10} autoCorrect={false} style={s.input} onSubmitEditing={applyDate} />{!!dateError && <Text style={s.error}>{dateError}</Text>}<TouchableOpacity accessibilityRole="button" style={s.cta} onPress={applyDate}><Text style={s.ctaText}>Show available slots</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCalendar(false)} style={s.close}><Text style={s.copy}>Cancel</Text></TouchableOpacity></View></KeyboardAvoidingView></Modal>
  </View>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E9EEF5' }, back: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E6EBF2', alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 21, fontWeight: '700', color: '#151D30', letterSpacing: -0.6 },
  content: { padding: 16, paddingTop: 13, paddingBottom: 56, gap: 17, width: '100%', maxWidth: 640, alignSelf: 'center' }, card: { padding: 20, borderRadius: 25, backgroundColor: '#FFF', gap: 13, boxShadow: '0 5px 22px rgba(26, 44, 68, 0.045)' }, shopCard: { overflow: 'hidden', paddingBottom: 20, gap: 8 }, glow: { position: 'absolute', right: -27, top: -25, width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFFBF6' }, category: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '600', color: orange, backgroundColor: '#FFF8EF', borderWidth: 1, borderColor: '#FFDAB5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }, shopName: { fontSize: 25, fontWeight: '700', letterSpacing: -1, color: '#151D30' }, subtitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, copy: { fontSize: 12, lineHeight: 18, color: '#6A7E9D' }, separator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }, confirmation: { fontSize: 12, fontWeight: '500', color: orange }, divider: { height: 1, backgroundColor: '#EEF2F7', marginVertical: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { fontSize: 12, fontWeight: '600', color: '#3C4D67' }, custom: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 }, customText: { color: orange, fontSize: 12, fontWeight: '500' }, dates: { gap: 10, paddingVertical: 4 }, date: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, minHeight: 39, borderRadius: 16, borderWidth: 1, borderColor: '#DEE6F1' }, dateSelected: { backgroundColor: orange, borderColor: orange }, dateText: { fontSize: 12, color: '#3C4D67' }, dateSelectedText: { color: '#FFF', fontWeight: '700' }, heading: { fontSize: 18, fontWeight: '700', color: '#151D30', letterSpacing: -0.5 }, timesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }, filters: { flexDirection: 'row', backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#E8EDF5', borderRadius: 11, padding: 3 }, filter: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }, activeFilter: { backgroundColor: '#FFF' }, filterText: { fontSize: 11, fontWeight: '500', color: '#4B5D78' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, slot: { width: '47%', flexGrow: 1, maxWidth: '49%', minHeight: 66, paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#FFBC86', borderRadius: 17, justifyContent: 'center', gap: 3, backgroundColor: '#FFFEFC' }, time: { fontSize: 14, fontWeight: '600', color: '#151D30', letterSpacing: -0.3 }, status: { flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 6, height: 6, borderRadius: 3 }, selectedSlot: { borderColor: orange, borderWidth: 2, paddingHorizontal: 11, paddingVertical: 11, backgroundColor: '#FFFBF6' }, selectedText: { color: orange, fontWeight: '600' }, selectedDot: { position: 'absolute', top: 18, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: orange }, breakSlot: { backgroundColor: '#FFF9ED', borderColor: '#FFDB7E' }, disabledSlot: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }, disabledTime: { color: '#8191AA' }, strike: { textDecorationLine: 'line-through' }, empty: { color: '#6A7E9D', fontSize: 13, lineHeight: 21, paddingVertical: 20 }, loader: { padding: 24 }, message: { gap: 14, paddingVertical: 16 }, error: { color: '#B42318', fontSize: 13, lineHeight: 20 },
  policy: { borderRadius: 18, backgroundColor: '#FFFBF4', borderWidth: 1, borderColor: '#FFE7CC', padding: 16, flexDirection: 'row', gap: 12 }, policyIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, policyBody: { flex: 1, gap: 4 }, policyTitle: { fontSize: 12, fontWeight: '500', color: '#151D30' }, policyCopy: { fontSize: 12, lineHeight: 20, color: '#61738F' }, footer: { backgroundColor: '#FFF', padding: 16, paddingHorizontal: 20 }, cta: { minHeight: 49, borderRadius: 16, backgroundColor: orange, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, boxShadow: '0 6px 14px rgba(255, 113, 0, 0.16)' }, ctaText: { color: '#FFF', fontWeight: '700', fontSize: 14 }, disabledCta: { backgroundColor: '#AFB8C6', boxShadow: 'none' }, overlay: { flex: 1, backgroundColor: '#0006', justifyContent: 'center', padding: 20 }, dateModal: { padding: 22, borderRadius: 24, backgroundColor: '#FFF', gap: 14, width: '100%', maxWidth: 440, alignSelf: 'center' }, input: { borderWidth: 1, borderColor: '#DCE3EE', borderRadius: 12, padding: 14, minHeight: 48, color: '#151D30' }, close: { alignItems: 'center', padding: 10 },
});
