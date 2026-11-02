import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import qrcode from 'qrcode-generator';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import { INTOWN_API_BASE, getAllNearbyShops, enrichShopsWithMerchantDetails } from '../utils/api';
import { getActiveSpecialOffers } from '../utils/specialOffer';
import { setNavShop } from '../utils/navCache';
import { passId, passValidity, PassRole, resolvePassRole } from '../utils/privilegePass';
import { getProfileImage, profileImageFromRecord, refreshProfileImage } from '../utils/profileImage';

type PassData = { role: PassRole; customerId: string | null; merchantId: string | null; name: string; image: string | null; validity?: string };
const parse = (raw: string | null) => { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } };
const unwrap = (data: any, role: string) => data?.[role] ?? data?.data?.[role] ?? data?.data ?? data;

export default function MemberCardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const qrSize = Math.min(240, Math.max(120, width - 136));
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const location = useLocationStore(state => state.location);
  const [pass, setPass] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [modal, setModal] = useState<'qr' | 'deals' | 'menu' | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setShowLogin(!isAuthenticated || isGuest);
    if (!isAuthenticated || isGuest) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const keys = ['customer_id', 'merchant_id', 'user_type', 'user_role', 'user_search_response', 'customer_profile_image', 'merchant_profile_image', 'user_profile_image'];
        const values = Object.fromEntries(await AsyncStorage.multiGet(keys));
        const cached = parse(values.user_search_response);
        const customerId = passId(cached?.customer?.id) || passId(values.customer_id);
        const merchantId = passId(cached?.merchant?.id) || passId(values.merchant_id);
        const role = resolvePassRole(from, `${values.user_type || ''} ${values.user_role || ''} ${user?.userType || ''}`, customerId, merchantId);
        // Fetch only the identity types shown on this pass; a merchant's auth ID
        // must never be used for a customer-profile request.
        const requests = [
          role !== 'merchant' && customerId ? axios.get(`${INTOWN_API_BASE}/customer/${encodeURIComponent(customerId)}/profile`, { timeout: 15000 }) : null,
          role !== 'customer' && merchantId ? axios.get(`${INTOWN_API_BASE}/merchant/${encodeURIComponent(merchantId)}`, { timeout: 15000 }) : null,
        ];
        const results = await Promise.allSettled(requests);
        if (!active) return;
        const customer = results[0].status === 'fulfilled' && results[0].value ? unwrap(results[0].value.data, 'customer') : cached.customer;
        const merchant = results[1].status === 'fulfilled' && results[1].value ? unwrap(results[1].value.data, 'merchant') : cached.merchant;
        const primary = role === 'merchant' ? merchant : customer;
        const imageRole = role === 'merchant' ? 'merchant' : 'customer';
        const savedImage = await getProfileImage(imageRole);
        if (!active) return;
        setPass({
          role, customerId, merchantId,
          name: primary?.contactName || primary?.name || user?.name || primary?.businessName || 'INtown Member',
          image: savedImage || profileImageFromRecord(primary) || profileImageFromRecord(role === 'merchant' ? cached.merchant : cached.customer),
          validity: primary?.validity,
        });
        void refreshProfileImage(imageRole, INTOWN_API_BASE).then(latestImage => {
          if (active && latestImage) setPass(current => current ? { ...current, image: latestImage } : current);
        }).catch(error => console.warn('[PrivilegePass] Could not refresh image:', error));
      } catch (error) {
        console.warn('[PrivilegePass] Unable to load pass:', error);
        if (active) setPass({ role: resolvePassRole(from, user?.userType || '', null, null), customerId: null, merchantId: null, name: user?.name || 'INtown Member', image: null });
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [from, isAuthenticated, isGuest, user?.name, user?.userType]));

  const validity = passValidity(pass?.validity);
  const canShowQr = !!pass && ((pass.role !== 'merchant' && !!pass.customerId) || (pass.role !== 'customer' && !!pass.merchantId));
  const qrRows = useMemo(() => {
    if (!pass || !((pass.role !== 'merchant' && pass.customerId) || (pass.role !== 'customer' && pass.merchantId))) return [];
    const code = qrcode(0, 'M');
    // Identity only: this QR is a pass identifier, never a payment authorization.
    code.addData(JSON.stringify({ type: 'intown-privilege-pass', ...(pass.role !== 'merchant' && pass.customerId ? { customerId: pass.customerId } : {}), ...(pass.role !== 'customer' && pass.merchantId ? { merchantId: pass.merchantId } : {}) }));
    code.make();
    return Array.from({ length: code.getModuleCount() }, (_, row) => Array.from({ length: code.getModuleCount() }, (_, column) => code.isDark(row, column)));
  }, [pass]);

  const openDeals = async () => {
    setModal('deals'); setDealsLoading(true); setDealsError(null);
    try {
      if (!location || location.latitude == null || location.longitude == null) {
        setDealsError('Choose your location on Home to see nearby privilege deals.'); return;
      }
      const nearby = await getAllNearbyShops(location.latitude, location.longitude);
      const enriched = await enrichShopsWithMerchantDetails(nearby);
      setDeals(enriched.filter(shop => getActiveSpecialOffers(shop).length > 0));
    } catch { setDealsError('Could not load nearby deals. Please try again.'); }
    finally { setDealsLoading(false); }
  };
  const sharePass = () => {
    setModal(null);
    void Share.share({ message: `INtown Privilege Pass\n${pass?.name || ''}${pass?.role !== 'merchant' && pass?.customerId ? `\nCustomer ID: ${pass.customerId}` : ''}${pass?.role !== 'customer' && pass?.merchantId ? `\nMerchant ID: ${pass.merchantId}` : ''}` }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <LoginRequiredModal isVisible={showLogin} onDismiss={() => { setShowLogin(false); if (!isAuthenticated) router.back(); }} message="Please log in to view your privilege pass" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.headerButton}><Ionicons name="arrow-back" size={25} color="#202A39" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Privilege Pass</Text>
        <TouchableOpacity onPress={() => setModal('menu')} disabled={!pass} accessibilityRole="button" accessibilityLabel="Pass options" style={styles.headerButton}><Ionicons name="ellipsis-vertical" size={19} color="#526071" /></TouchableOpacity>
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color="#FF8A00" /><Text style={styles.muted}>Loading privilege pass...</Text></View> : isAuthenticated && !isGuest && pass ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cardShadow}>
            <LinearGradient colors={['#FFA333', '#FF890E', '#E56300']} locations={[0, 0.48, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card} testID="privilege-pass">
              <View style={styles.brandRow}><View style={styles.star}><Ionicons name="star" size={13} color="#FFF" /></View><Text style={styles.brand}>INTOWN PRIVILEGE ACCESS</Text><Ionicons name="wifi" size={20} color="#FFF" style={{ transform: [{ rotate: '0deg' }] }} /></View>
              <View style={styles.identity}>
                <View style={styles.avatarRing}><View style={styles.avatarInner}>{pass.image ? <Image source={{ uri: pass.image }} style={styles.avatar} onError={() => setPass(current => current ? { ...current, image: null } : current)} /> : <Ionicons name="person" size={43} color="#FFF" />}</View><View style={styles.verified}><Ionicons name={validity.expired ? 'time' : 'checkmark'} size={15} color="#FFF" /></View></View>
                <Text style={styles.name}>{pass.name}</Text>
                <View style={styles.status}><Text style={styles.statusText}>{validity.expired ? 'Pass Expired' : pass.role === 'merchant' ? 'Merchant Account' : 'Active Member'}</Text></View>
              </View>
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  {pass.role !== 'merchant' && <View style={styles.detailCell} testID="pass-customer-id"><Text style={styles.label}>CUSTOMER ID</Text><Text style={styles.value} selectable>{pass.customerId || 'Not available'}</Text></View>}
                  {pass.role !== 'customer' && <View style={[styles.detailCell, pass.role === 'dual' && styles.rightCell]} testID="pass-merchant-id"><Text style={styles.label}>MERCHANT ID</Text><Text style={styles.value} selectable>{pass.merchantId || 'Not available'}</Text></View>}
                </View>
                <View style={styles.detailRow}><View style={styles.detailCell}><Text style={styles.label}>PLAN</Text><Text style={styles.value}>INtown</Text></View><View style={[styles.detailCell, styles.rightCell]}><Text style={styles.label}>VALID TILL</Text><Text style={styles.dateValue}>{validity.label}</Text></View></View>
              </View>
            </LinearGradient>
          </View>
          <TouchableOpacity style={styles.action} onPress={() => setModal('qr')} disabled={!canShowQr} accessibilityRole="button" accessibilityLabel="Show privilege pass QR code" testID="pass-show-qr"><View style={styles.actionIcon}><Ionicons name="qr-code-outline" size={21} color="#FF8000" /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Show QR Code</Text><Text style={styles.actionSubtitle}>{canShowQr ? 'Scan at store checkout to redeem' : 'Your account ID is unavailable'}</Text></View><Ionicons name="chevron-forward" size={21} color="#98A2B3" /></TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={openDeals} accessibilityRole="button" testID="pass-available-deals"><View style={styles.actionIcon}><Ionicons name="sparkles-outline" size={21} color="#FF8000" /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Available Privilege Deals</Text><Text style={styles.actionSubtitle}>Explore partner stores near you</Text></View><Ionicons name="chevron-forward" size={21} color="#98A2B3" /></TouchableOpacity>
        </ScrollView>
      ) : null}
      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.backdrop}><View style={styles.modalCard} accessibilityViewIsModal><View style={styles.modalHeader}><Text style={styles.modalTitle}>{modal === 'qr' ? 'Your Privilege QR Code' : modal === 'deals' ? 'Available Privilege Deals' : 'Pass Options'}</Text><TouchableOpacity onPress={() => setModal(null)} accessibilityRole="button" accessibilityLabel="Close"><Ionicons name="close" size={24} color="#202A39" /></TouchableOpacity></View>
          {modal === 'qr' && <><View style={styles.qrWrap}>{qrRows.map((row, i) => <View key={i} style={{ flexDirection: 'row' }}>{row.map((dark, j) => <View key={j} style={{ width: qrSize / row.length, height: qrSize / row.length, backgroundColor: dark ? '#152033' : '#FFF' }} />)}</View>)}</View><Text style={styles.qrName}>{pass?.name}</Text><Text style={styles.modalHint}>Show this pass identifier at the partner store.</Text></>}
          {modal === 'menu' && <><TouchableOpacity style={styles.menuAction} onPress={sharePass}><Ionicons name="share-outline" size={21} color="#FF8A00" /><Text style={styles.actionTitle}>Share pass details</Text></TouchableOpacity><TouchableOpacity style={styles.menuAction} onPress={() => { setModal(null); router.push({ pathname: '/account', params: { from: pass?.role === 'dual' ? 'dual-customer' : pass?.role === 'merchant' ? 'merchant' : 'member' } }); }}><Ionicons name="person-outline" size={21} color="#FF8A00" /><Text style={styles.actionTitle}>View my account</Text></TouchableOpacity></>}
          {modal === 'deals' && (dealsLoading ? <ActivityIndicator color="#FF8A00" style={{ padding: 32 }} /> : dealsError ? <Text style={styles.modalHint}>{dealsError}</Text> : <ScrollView style={{ maxHeight: 380 }}>{deals.length ? deals.map(shop => <TouchableOpacity key={shop.id || shop.merchantId} style={styles.deal} onPress={async () => { await setNavShop(shop); setModal(null); router.push({ pathname: '/member-shop-details', params: { shopId: String(shop.id || shop.merchantId) } }); }}><Text style={styles.actionTitle}>{shop.businessName || shop.shopName || 'Partner store'}</Text><Text style={styles.actionSubtitle}>{getActiveSpecialOffers(shop).join('\n')}</Text></TouchableOpacity>) : <Text style={styles.modalHint}>No privilege deals nearby right now. Check back soon.</Text>}</ScrollView>)}
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#202A39' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }, muted: { fontSize: 13, color: '#667085' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, width: '100%', maxWidth: 470, alignSelf: 'center' },
  cardShadow: { borderRadius: 28, shadowColor: '#D9740C', shadowOpacity: 0.23, shadowRadius: 15, shadowOffset: { width: 0, height: 12 }, elevation: 7, marginBottom: 20 },
  card: { borderRadius: 28, padding: 24, minHeight: 440 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, star: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', justifyContent: 'center', alignItems: 'center' },
  brand: { flex: 1, fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#FFF' },
  identity: { alignItems: 'center', paddingTop: 55, paddingBottom: 53 },
  avatarRing: { height: 80, width: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)', padding: 4, marginBottom: 17 },
  avatarInner: { flex: 1, borderRadius: 36, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }, avatar: { width: '100%', height: '100%' },
  verified: { position: 'absolute', right: -1, bottom: -1, height: 24, width: 24, borderRadius: 12, backgroundColor: '#08BA86', borderColor: '#FFAB53', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  status: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', marginTop: 4 }, statusText: { color: '#FFF', fontSize: 12 },
  details: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', paddingTop: 13, gap: 14 }, detailRow: { flexDirection: 'row', gap: 12 }, detailCell: { flex: 1, gap: 5 }, rightCell: { alignItems: 'flex-end' },
  label: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.88)' }, value: { fontSize: 15, fontWeight: '700', color: '#FFF' }, dateValue: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  action: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, paddingVertical: 13, backgroundColor: '#FFF', borderRadius: 17, borderWidth: 1, borderColor: '#E7E9ED', marginBottom: 12, shadowColor: '#101828', shadowOpacity: 0.035, shadowRadius: 2, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFF2E2', alignItems: 'center', justifyContent: 'center' }, actionCopy: { flex: 1, gap: 4 }, actionTitle: { fontSize: 14, fontWeight: '700', color: '#182030' }, actionSubtitle: { fontSize: 12, color: '#667085', lineHeight: 17 },
  backdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }, modalCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20 }, modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#202A39' }, qrWrap: { alignSelf: 'center', padding: 24, backgroundColor: '#FFF' }, qrName: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#202A39', marginTop: 12 }, modalHint: { textAlign: 'center', color: '#667085', fontSize: 13, lineHeight: 20, paddingVertical: 12 }, menuAction: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 16 }, deal: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EAECF0', gap: 7 },
});
