import { createElement } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export function LegalDocumentModal({ visible, onClose, title, html }: { visible: boolean; onClose: () => void; title: string; html: string }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.card} accessibilityViewIsModal>
      <View style={styles.header}><Text style={styles.title}>{title}</Text><TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close legal document" style={styles.close}><Ionicons name="close" size={24} color="#344054" /></TouchableOpacity></View>
      {visible && (Platform.OS === 'web'
        ? createElement('iframe', { srcDoc: html, title, style: { flex: 1, width: '100%', border: 0, background: '#FFF' } })
        : <WebView source={{ html }} style={{ flex: 1 }} nestedScrollEnabled startInLoadingState originWhitelist={['*']} />)}
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(16,24,40,0.45)', padding: 20, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 650, height: '85%', backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#17243A' }, close: { padding: 10 },
});
