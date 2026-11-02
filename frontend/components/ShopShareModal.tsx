import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { buildShopShareContent, createShopShareImage } from '../utils/shopShare';
import { INTOWN_API_BASE } from '../utils/api';

type Network = 'Facebook' | 'Instagram' | 'WhatsApp';
const networks = [
  { name: 'Facebook' as const, icon: 'logo-facebook' as const, color: '#1877F2' },
  { name: 'Instagram' as const, icon: 'logo-instagram' as const, color: '#C13584' },
  { name: 'WhatsApp' as const, icon: 'logo-whatsapp' as const, color: '#16A765' },
];

export function ShopShareModal({ visible, onClose, shop, images }: { visible: boolean; onClose: () => void; shop: any; images: string[] }) {
  const cardRef = useRef<View>(null);
  const [now, setNow] = useState(Date.now());
  const [merchantImages, setMerchantImages] = useState<{ id: string; images: unknown[] } | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const shareShop = useMemo(() => merchantImages?.id === String(shop?.id) ? {
    ...shop, images: [...(Array.isArray(shop?.images) ? shop.images : []), ...merchantImages.images],
  } : shop, [shop, merchantImages]);
  const content = useMemo(() => buildShopShareContent(shareShop, images, now), [shareShop, images, now]);
  const [file, setFile] = useState<File | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [retry, setRetry] = useState(0);
  const shareKey = `${content.caption}\n${content.imageUrl}`;

  useEffect(() => {
    if (!visible || shop?.id == null) return;
    let alive = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setLoadingImages(true);
    // Merchant profile uploads are served separately from nearby shop details.
    fetch(`${INTOWN_API_BASE}/s3?merchantId=${encodeURIComponent(String(shop.id))}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const body = await response.json(); const data = body?.data ?? body;
        const list = (value: any) => Array.isArray(value) ? value : value ? [value] : [];
        const gallery = Array.isArray(data) ? data : [...list(data?.images), ...list(data?.s3ImageUrl), ...list(data?.profileImage), ...list(data?.profileImageUrl)];
        if (alive) setMerchantImages({ id: String(shop.id), images: gallery });
      }).catch(() => { /* Keep images already supplied by the merchant details. */ })
      .finally(() => { clearTimeout(timeout); if (alive) setLoadingImages(false); });
    return () => { alive = false; clearTimeout(timeout); controller.abort(); };
  }, [visible, shop?.id, retry]);

  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible || loadingImages) return;
    let alive = true;
    setError(null); setHint(''); setFile(null); setLaidOut(false); setImageReady(!content.imageUrl);
    if (Platform.OS === 'web') {
      setPreparing(true);
      createShopShareImage(content).then(blob => {
        if (alive) setFile(new File([blob], content.filename, { type: 'image/png' }));
      }).catch(reason => { if (alive) setError(reason?.message || 'Could not prepare the post.'); })
        .finally(() => { if (alive) setPreparing(false); });
    }
    return () => { alive = false; };
    // shareKey includes the image and all caption fields; time ticks alone do not rebuild the post.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, shareKey, retry, loadingImages]);

  const ready = !loadingImages && (Platform.OS === 'web' ? !!file : imageReady && laidOut);
  const copyCaption = async () => {
    try { await Clipboard.setStringAsync(content.caption); setHint('Caption copied. Paste it into your post.'); }
    catch { setHint('Select and copy the caption shown above.'); }
  };
  const download = () => {
    if (!file || loadingImages) return;
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = content.filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  const sharePost = async (network?: Network) => {
    if (busy || !ready) return;
    if (buildShopShareContent(shareShop, images).caption !== content.caption) {
      setNow(Date.now()); setHint('The offer changed. Please wait for the updated post and share again.'); return;
    }
    setBusy(true); setError(null);
    let captured: string | null = null;
    try {
      if (Platform.OS === 'web') {
        const nav = navigator;
        if (file && nav.canShare?.({ files: [file] }) && nav.share) {
          // Called directly from the tap, while the browser's user activation is valid.
          await nav.share({ files: [file], title: content.title, text: content.caption });
        } else {
          download();
          const destination = network === 'WhatsApp' ? `https://wa.me/?text=${encodeURIComponent(content.caption)}` : network === 'Facebook' ? 'https://www.facebook.com/' : network === 'Instagram' ? 'https://www.instagram.com/' : null;
          // Open before awaiting clipboard access so popup blockers see the user tap.
          if (destination) window.open(destination, '_blank', 'noopener,noreferrer');
          try { await Clipboard.setStringAsync(content.caption); setHint(`Post image downloaded and caption copied. Attach the image${network ? ` in ${network}` : ' to your post'} and paste the caption.`); }
          catch { setHint('Post image downloaded. Attach it to your post and copy the caption above.'); }
        }
      } else {
        if (!(await Sharing.isAvailableAsync())) throw new Error('Image sharing is not available on this device.');
        // Some social apps ignore captions in share intents, so all offer details
        // are embedded in the PNG as well as available on the clipboard.
        try { await Clipboard.setStringAsync(content.caption); } catch {}
        captured = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile', width: 1080 });
        setHint(network ? `Choose ${network} in the share menu. The caption is also ready to paste.` : 'Choose Facebook, Instagram or WhatsApp in the share menu.');
        await Sharing.shareAsync(captured, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: network ? `Share post to ${network}` : 'Share merchant post' });
      }
    } catch (reason: any) {
      if (reason?.name !== 'AbortError') setError(reason?.message || 'Could not share the post. Please try again.');
    } finally {
      // Keep the temporary file available while the receiving app reads it.
      // view-shot cleans up its tmpfile captures when the app exits.
      setBusy(false);
    }
  };

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <View style={styles.backdrop}><View style={styles.panel} accessibilityViewIsModal>
      <View style={styles.heading}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.title}>Share this merchant</Text><Text style={styles.subtitle}>A post with their image and latest offers</Text></View><TouchableOpacity onPress={onClose} disabled={busy} style={styles.close} accessibilityRole="button" accessibilityLabel="Close share preview"><Ionicons name="close" size={24} color="#344054" /></TouchableOpacity></View>
      {visible && <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View key={`${shareKey}-${retry}-${loadingImages}`} ref={cardRef} collapsable={false} onLayout={() => setLaidOut(true)} style={styles.post} testID="shop-share-post-preview">
          <View style={styles.brand}><Text style={styles.brandText}>INtown · Discover local</Text></View>
          {content.imageUrl ? <Image source={{ uri: content.imageUrl }} style={styles.photo} resizeMode="cover" onLoad={() => setImageReady(true)} onError={() => { setImageReady(false); setError('Merchant image could not load. Retry to include the image in your post.'); }} /> : <View style={[styles.photo, styles.placeholder]}><Ionicons name="storefront-outline" size={64} color="#FF8A00" /></View>}
          <View style={styles.postBody}><Text style={styles.merchant}>{content.title}</Text><Text style={styles.kicker}>{content.offers.length ? content.special ? 'SPECIAL OFFER' : 'OFFERS' : 'SHOP LOCAL WITH INTOWN'}</Text>
            {content.offers.map((offer, index) => <Text key={index} style={styles.offer}>• {offer}</Text>)}
            {!!content.validTill && <Text style={styles.valid}>Valid till {content.validTill}</Text>}
            <Text style={styles.footer}>Find this merchant on the INtown app</Text>
          </View>
        </View>
        <Text selectable style={styles.caption} testID="shop-share-caption">{content.caption}</Text>
        {Platform.OS === 'web' && !!file && <TouchableOpacity onPress={download} disabled={busy} accessibilityRole="button" testID="shop-share-download"><Text style={styles.retry}>Download post image</Text></TouchableOpacity>}
      </ScrollView>}
      {!!error && <View style={styles.notice}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => setRetry(value => value + 1)} accessibilityRole="button"><Text style={styles.retry}>Retry image</Text></TouchableOpacity></View>}
      {!!hint && <Text style={styles.hint} accessibilityLiveRegion="polite">{hint}</Text>}
      {(preparing || loadingImages) && <View style={styles.progress}><ActivityIndicator color="#FF8A00" /><Text style={styles.subtitle}>{loadingImages ? 'Loading merchant image...' : 'Preparing post image...'}</Text></View>}
      <Text style={styles.instructions}>{Platform.OS === 'web' ? 'Share the image when supported, or download it and attach it to your post.' : 'Choose your app in the phone’s share menu, then review and publish your post.'}</Text>
      <View style={styles.networks}>{networks.map(network => <TouchableOpacity key={network.name} style={[styles.network, (!ready || busy) && styles.disabled]} onPress={() => sharePost(network.name)} disabled={!ready || busy} accessibilityRole="button" accessibilityLabel={`Share post to ${network.name}`} testID={`shop-share-${network.name.toLowerCase()}`}><Ionicons name={network.icon} size={27} color={network.color} /><Text style={styles.networkText}>{network.name}</Text></TouchableOpacity>)}</View>
      <View style={styles.actions}><TouchableOpacity style={styles.copy} onPress={copyCaption} disabled={busy} accessibilityRole="button"><Ionicons name="copy-outline" size={18} color="#667085" /><Text style={styles.copyText}>Copy caption</Text></TouchableOpacity><TouchableOpacity style={[styles.share, (!ready || busy) && styles.disabled]} onPress={() => sharePost()} disabled={!ready || busy} accessibilityRole="button" testID="shop-share-post"><Ionicons name="share-social-outline" size={18} color="#FFF" /><Text style={styles.shareText}>{busy ? 'Sharing...' : Platform.OS === 'web' ? 'Share / download' : 'Share post'}</Text></TouchableOpacity></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.48)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 440, maxHeight: '92%', borderRadius: 24, padding: 18, backgroundColor: '#FFF' }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }, title: { fontSize: 18, fontWeight: '700', color: '#182030' }, subtitle: { fontSize: 12, color: '#667085', marginTop: 4 }, close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 12 }, post: { backgroundColor: '#FFF8EF', borderRadius: 16, overflow: 'hidden' }, brand: { backgroundColor: '#FF8A00', padding: 14 }, brandText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, photo: { width: '100%', aspectRatio: 1.9, backgroundColor: '#FFE5C4' }, placeholder: { alignItems: 'center', justifyContent: 'center' }, postBody: { padding: 18, gap: 9 }, merchant: { fontSize: 23, fontWeight: '800', color: '#182030' }, kicker: { fontSize: 11, letterSpacing: 1.2, color: '#E87500', fontWeight: '800' }, offer: { fontSize: 15, lineHeight: 23, color: '#273244' }, valid: { fontSize: 12, fontWeight: '700', color: '#E87500', marginTop: 6 }, footer: { color: '#667085', fontSize: 11, marginTop: 8 }, caption: { fontSize: 12, lineHeight: 18, color: '#667085', marginTop: 14 },
  notice: { paddingVertical: 8, gap: 8 }, error: { color: '#B42318', fontSize: 12, lineHeight: 18 }, retry: { color: '#E87500', fontSize: 13, fontWeight: '700' }, hint: { color: '#344054', fontSize: 12, lineHeight: 18, paddingVertical: 8 }, progress: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8 }, instructions: { fontSize: 11, color: '#667085', lineHeight: 16, marginVertical: 10 }, networks: { flexDirection: 'row', gap: 10 }, network: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#F8F9FB', gap: 6 }, networkText: { fontSize: 11, color: '#344054', fontWeight: '600' }, actions: { flexDirection: 'row', gap: 10, marginTop: 14 }, copy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 }, copyText: { fontSize: 12, color: '#667085', fontWeight: '700' }, share: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: '#FF8A00' }, shareText: { fontSize: 12, color: '#FFF', fontWeight: '700' }, disabled: { opacity: 0.45 },
});
