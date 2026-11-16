import { StyleSheet } from 'react-native';
export const walletStyles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 16, padding: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#FFE1BD' },
  section: { paddingTop: 16, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0E5DA' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  copy: { fontSize: 13, lineHeight: 20, color: '#465269', flexShrink: 1, marginTop: 6 },
  caption: { color: '#667085', fontSize: 12, lineHeight: 18, marginTop: 8 },
  amount: { color: '#E96C00', fontSize: 32, fontWeight: '800', marginTop: 12 },
  reward: { fontSize: 13, fontWeight: '700', color: '#B94E00' },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF2DF', borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#A94800', fontSize: 13, fontWeight: '700' },
  error: { fontSize: 13, color: '#B42318', marginTop: 8 },
});
