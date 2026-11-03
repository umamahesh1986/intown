import { createElement, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientSectionHeading } from './GradientSectionHeading';

const MAX_SPEND = 50000;
const STEP = 500;
export const calculateEstimatedSavings = (spend: number) => {
  const amount = Math.min(MAX_SPEND, Math.max(0, Number.isFinite(spend) ? spend : 0));
  return { spend: amount, monthly: Math.round(amount * 0.15), annual: Math.round(amount * 0.15 * 12) };
};

export function SavingsCalculator() {
  const [spend, setSpend] = useState(10000);
  const track = useRef<View>(null);
  const geometry = useRef({ left: 0, width: 1 });
  const { monthly, annual } = calculateEstimatedSavings(spend);
  const progress = spend / MAX_SPEND * 100;
  const format = (value: number) => value.toLocaleString('en-IN');
  const responder = useMemo(() => {
    const move = (pageX: number) => {
      const { left, width } = geometry.current;
      if (width <= 1) return;
      const ratio = Math.max(0, Math.min(1, (pageX - left) / width));
      setSpend(Math.round(ratio * MAX_SPEND / STEP) * STEP);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: event => {
        const pageX = event.nativeEvent.pageX;
        track.current?.measureInWindow((left, _top, width) => { geometry.current = { left, width }; move(pageX); });
      },
      onPanResponderMove: (_event, gesture) => move(gesture.moveX),
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  return <View style={styles.card} testID="savings-calculator">
    <View style={styles.header}>
      <View style={styles.icon}><Ionicons name="calculator" size={21} color="#1B283A" /></View>
      <View><GradientSectionHeading style={styles.title}>Savings Calculator</GradientSectionHeading><Text style={styles.subtitle}>Calculate your guaranteed local perks</Text></View>
    </View>
    <View style={styles.labelRow}><Text style={styles.label}>Estimated Monthly Spend</Text><Text style={styles.rate}>15% avg. savings</Text></View>
    <View style={styles.inputBox}>
      <Text style={styles.currency}>₹</Text>
      <TextInput accessibilityLabel="Estimated monthly spend" testID="savings-spend-input" keyboardType="number-pad" style={styles.input} value={format(spend)}
        onChangeText={value => setSpend(calculateEstimatedSavings(Number(value.replace(/[^0-9]/g, ''))).spend)} />
      <Text style={styles.perMonth}>PER MONTH</Text>
    </View>
    {Platform.OS === 'web' ? <View style={styles.webSlider}>
      {createElement('style', null, '.intown-savings-range::-webkit-slider-thumb{appearance:none;width:15px;height:15px;border-radius:50%;background:#ff7900;cursor:grab}.intown-savings-range::-moz-range-thumb{width:15px;height:15px;border:0;border-radius:50%;background:#ff7900;cursor:grab}')}
      {createElement('input', {
        type: 'range', className: 'intown-savings-range', min: 0, max: MAX_SPEND, step: STEP, value: spend,
        'aria-label': 'Estimated monthly spend', 'aria-valuetext': `₹${format(spend)} per month`, 'data-testid': 'savings-spend-slider',
        onChange: (event: { target: { value: string } }) => setSpend(Number(event.target.value)),
        style: { appearance: 'none', width: '100%', height: 8, margin: 0, borderRadius: 8, cursor: 'pointer', background: `linear-gradient(to right,#ff7900 ${progress}%,#e1e7f0 ${progress}%)` },
      })}
    </View> : <View ref={track} style={styles.sliderTouch} {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Estimated monthly spend"
      accessibilityValue={{ min: 0, max: MAX_SPEND, now: spend, text: `₹${format(spend)} per month` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={event => setSpend(previous => Math.max(0, Math.min(MAX_SPEND, previous + (event.nativeEvent.actionName === 'increment' ? STEP : -STEP))))}>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /><View style={[styles.thumb, { left: `${progress}%` }]} /></View>
    </View>}
    <View style={styles.results}>
      <View style={[styles.result, styles.monthly]}><Text style={styles.monthLabel}>MONTHLY SAVINGS</Text><Text style={styles.monthValue} testID="savings-monthly">₹ {format(monthly)}</Text></View>
      <View style={[styles.result, styles.annual]}><Text style={styles.annualLabel}>ANNUAL SAVINGS</Text><Text style={styles.annualValue} testID="savings-annual">₹ {format(annual)}</Text></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 10, marginVertical: 16, padding: 20, backgroundColor: '#FFF', borderRadius: 26, borderWidth: 1, borderColor: '#E3EAF3', shadowColor: '#223653', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }, icon: { backgroundColor: '#FFF4E6', borderRadius: 9, padding: 5 },
  title: { fontSize: 16, fontWeight: '800', color: '#101C2D' }, subtitle: { fontSize: 11, color: '#72819B', marginTop: 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 8 }, label: { fontSize: 12, color: '#3E526F' }, rate: { fontSize: 12, fontWeight: '600', color: '#FF7900' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 17, paddingHorizontal: 16, minHeight: 54, backgroundColor: '#F0F4F9', borderWidth: 1, borderColor: '#E1E8F2' },
  currency: { fontSize: 18, fontWeight: '800', color: '#101C2D', marginRight: 6 }, input: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '800', color: '#101C2D', paddingVertical: 12 }, perMonth: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7, color: '#94A3BA' },
  webSlider: { height: 40, justifyContent: 'center' }, sliderTouch: { height: 40, justifyContent: 'center', paddingHorizontal: 8 }, track: { height: 8, backgroundColor: '#E1E7F0', borderRadius: 8 }, fill: { height: 8, backgroundColor: '#FF7900', borderRadius: 8 }, thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF7900', position: 'absolute', top: -4, marginLeft: -8 },
  results: { flexDirection: 'row', gap: 12 }, result: { flex: 1, minWidth: 0, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 17 }, monthly: { backgroundColor: '#FFFBEF', borderWidth: 1, borderColor: '#FFE39A' }, annual: { backgroundColor: '#FF7900', shadowColor: '#FF7900', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 3 },
  monthLabel: { fontSize: 10, fontWeight: '700', color: '#AD5400', marginBottom: 6 }, annualLabel: { fontSize: 10, fontWeight: '700', color: '#FFF', marginBottom: 6 }, monthValue: { fontSize: 19, fontWeight: '800', color: '#923D00' }, annualValue: { fontSize: 19, fontWeight: '800', color: '#FFF' },
});
