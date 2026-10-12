import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' <-> parts
export const parseYmd = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  if (!m) {
    const d = new Date();
    return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() };
  }
  return { y: +m[1], mo: +m[2], d: +m[3] };
};
export const toYmd = (y: number, mo: number, d: number) => `${y}-${pad(mo)}-${pad(d)}`;
export const formatYmd = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : '';
};
const daysInMonth = (y: number, mo: number) => new Date(y, mo, 0).getDate();

interface Props {
  visible: boolean;
  title: string;
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (ymd: string) => void;
  onClose: () => void;
  onClear?: () => void;
}

// Day / Month / Year spinner in the same style as the account page time picker.
export const DateSpinnerModal = ({ visible, title, value, onChange, onClose, onClear }: Props) => {
  const { y, mo, d } = parseYmd(value);
  const set = (ny: number, nmo: number, nd: number) => onChange(toYmd(ny, nmo, Math.min(nd, daysInMonth(ny, nmo))));

  const col = (label: string, display: string, up: () => void, down: () => void, testID: string) => (
    <View style={styles.spinnerCol}>
      <Text style={styles.colLabel}>{label}</Text>
      <TouchableOpacity style={styles.spinnerArrow} onPress={up} testID={`${testID}-up`}>
        <Ionicons name="chevron-up" size={28} color="#AAA" />
      </TouchableOpacity>
      <View style={styles.spinnerBox}>
        <Text style={styles.spinnerText} testID={`${testID}-value`}>{display}</Text>
      </View>
      <TouchableOpacity style={styles.spinnerArrow} onPress={down} testID={`${testID}-down`}>
        <Ionicons name="chevron-down" size={28} color="#AAA" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard} testID="date-spinner-modal">
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.spinnerRow}>
            {col('Day', pad(d), () => set(y, mo, d >= daysInMonth(y, mo) ? 1 : d + 1), () => set(y, mo, d <= 1 ? daysInMonth(y, mo) : d - 1), 'date-day')}
            {col('Month', MONTHS[mo - 1], () => (mo >= 12 ? set(y + 1, 1, d) : set(y, mo + 1, d)), () => (mo <= 1 ? set(y - 1, 12, d) : set(y, mo - 1, d)), 'date-month')}
            {col('Year', String(y), () => set(y + 1, mo, d), () => set(y - 1, mo, d), 'date-year')}
          </View>
          <View style={styles.actions}>
            {onClear && (
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClear} testID="date-clear-btn">
                <Text style={styles.btnGhostText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onClose} testID="date-done-btn">
              <Text style={styles.btnPrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  spinnerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 16 },
  spinnerCol: { alignItems: 'center', flex: 1 },
  colLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  spinnerArrow: { padding: 8 },
  spinnerBox: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, minWidth: 64, alignItems: 'center', backgroundColor: '#FAFAFA', marginVertical: 4 },
  spinnerText: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: '#F2F2F2' },
  btnGhostText: { color: '#555', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#FF8A00' },
  btnPrimaryText: { color: '#FFF', fontWeight: '700' },
});
