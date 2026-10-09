import React, { forwardRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Share, Linking, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

interface OfferShareCardProps {
  shopName: string;
  offers: string[];
  validTill?: string;
  currentOffer?: string;
  imageUrl?: string | null;
  onImageReady?: (ready: boolean) => void;
}

export const buildOfferShareText = ({ shopName, offers, validTill, currentOffer, imageUrl }: OfferShareCardProps) => {
  const lines = [
    `🎁 Special Offer at ${shopName}!`,
    '',
    ...offers.map((o) => `• ${o}`),
  ];
  if (currentOffer) lines.push('', `Also: ${currentOffer}`);
  if (validTill) lines.push('', `⏳ Valid till ${validTill}`);
  if (imageUrl) lines.push('', `🖼 See the offer: ${imageUrl.split('?')[0]}`);
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
// `isImageReady` lets the caller delay capture until the banner image has loaded.
export const shareOfferAsImage = async (cardRef: React.RefObject<View | null>, isImageReady?: () => boolean) => {
  if (Platform.OS === 'web' || !cardRef.current) {
    Alert.alert('Not supported', 'Image sharing is available in the mobile app.');
    return;
  }
  try {
    if (isImageReady) {
      for (let i = 0; i < 20 && !isImageReady(); i += 1) await new Promise((r) => setTimeout(r, 150));
    }
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
export const OfferShareCard = forwardRef<View, OfferShareCardProps>(
  ({ shopName, offers, validTill, currentOffer, imageUrl, onImageReady }, ref) => {
    const [imgFailed, setImgFailed] = useState(false);
    const showImage = !!imageUrl && !imgFailed;
    return (
      <View ref={ref} collapsable={false} style={styles.card} testID="offer-share-card">
        {showImage && (
          <View style={styles.bannerWrap}>
            <Image
              source={{ uri: imageUrl! }}
              style={styles.banner}
              resizeMode="cover"
              onLoad={() => onImageReady?.(true)}
              onError={() => { setImgFailed(true); onImageReady?.(true); }}
              testID="offer-share-card-image"
            />
            <View style={styles.bannerTag}>
              <Ionicons name="gift" size={12} color="#FFF" />
              <Text style={styles.bannerTagText}>SPECIAL OFFER</Text>
            </View>
          </View>
        )}
        <View style={styles.topRow}>
          <View style={styles.brandPill}>
            <Text style={styles.brandText}>INtown</Text>
          </View>
          {!showImage && <Ionicons name="gift" size={28} color="#FFF" />}
        </View>
        {!showImage && <Text style={styles.kicker}>SPECIAL OFFER</Text>}
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
    );
  },
);
OfferShareCard.displayName = 'OfferShareCard';

const styles = StyleSheet.create({
  card: { width: 360, backgroundColor: '#2E7D32', borderRadius: 20, padding: 22, overflow: 'hidden' },
  bannerWrap: { marginHorizontal: -22, marginTop: -22, marginBottom: 16, position: 'relative' },
  banner: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#1B5E20' },
  bannerTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  bannerTagText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
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
