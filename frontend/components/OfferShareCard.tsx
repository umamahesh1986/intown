import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Platform, Share, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

interface OfferShareCardProps {
  shopName: string;
  offers: string[];
  validTill?: string;
  currentOffer?: string;
}

export const buildOfferShareText = ({ shopName, offers, validTill, currentOffer }: OfferShareCardProps) => {
  const lines = [
    `🎁 Special Offer at ${shopName}!`,
    '',
    ...offers.map((o) => `• ${o}`),
  ];
  if (currentOffer) lines.push('', `Also: ${currentOffer}`);
  if (validTill) lines.push('', `⏳ Valid till ${validTill}`);
  lines.push('', 'Find us on the INtown app and pick up at the shop.');
  return lines.join('\n');
};

export const shareOfferOnWhatsApp = async (text: string) => {
  const encoded = encodeURIComponent(text);
  const appUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;
  try {
    if (Platform.OS !== 'web' && (await Linking.canOpenURL(appUrl))) {
      await Linking.openURL(appUrl);
      return;
    }
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert('WhatsApp not available', 'Could not open WhatsApp on this device.');
  }
};

export const shareOfferText = async (text: string) => {
  try {
    if (Platform.OS === 'web') {
      const nav: any = (globalThis as any).navigator;
      if (nav?.share) return await nav.share({ text });
      await nav?.clipboard?.writeText?.(text);
      Alert.alert('Copied', 'Offer text copied to clipboard.');
      return;
    }
    await Share.share({ message: text });
  } catch {}
};

// Captures the rendered card as PNG and opens the system share sheet (native only).
export const shareOfferAsImage = async (cardRef: React.RefObject<View | null>) => {
  if (Platform.OS === 'web' || !cardRef.current) {
    Alert.alert('Not supported', 'Image sharing is available in the mobile app.');
    return;
  }
  try {
    const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing unavailable', 'This device cannot share images.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share special offer' });
  } catch (e: any) {
    Alert.alert('Share failed', e?.message || 'Could not create the offer image.');
  }
};

// Visual card rendered off-screen and captured for image sharing.
export const OfferShareCard = forwardRef<View, OfferShareCardProps>(({ shopName, offers, validTill, currentOffer }, ref) => (
  <View ref={ref} collapsable={false} style={styles.card} testID="offer-share-card">
    <View style={styles.topRow}>
      <View style={styles.brandPill}>
        <Text style={styles.brandText}>INtown</Text>
      </View>
      <Ionicons name="gift" size={28} color="#FFF" />
    </View>
    <Text style={styles.kicker}>SPECIAL OFFER</Text>
    <Text style={styles.shop} numberOfLines={2}>{shopName}</Text>
    <View style={styles.offersBox}>
      {offers.map((o, i) => (
        <Text key={i} style={styles.offer}>• {o}</Text>
      ))}
      {!!currentOffer && <Text style={styles.current}>Also: {currentOffer}</Text>}
    </View>
    {!!validTill && <Text style={styles.valid}>Valid till {validTill}</Text>}
    <Text style={styles.footer}>Pick up at the shop · Order on the INtown app</Text>
  </View>
));
OfferShareCard.displayName = 'OfferShareCard';

const styles = StyleSheet.create({
  card: { width: 360, backgroundColor: '#2E7D32', borderRadius: 20, padding: 22 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  brandPill: { backgroundColor: '#FF8A00', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  brandText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  kicker: { color: '#C8E6C9', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  shop: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 4, marginBottom: 14 },
  offersBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, gap: 6 },
  offer: { color: '#FFF', fontSize: 17, fontWeight: '700', lineHeight: 24 },
  current: { color: '#E8F5E9', fontSize: 13, marginTop: 6 },
  valid: { color: '#FFF3E0', fontSize: 13, fontWeight: '700', marginTop: 14 },
  footer: { color: '#C8E6C9', fontSize: 11, marginTop: 10 },
});
