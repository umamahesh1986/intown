import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientSectionHeading } from './GradientSectionHeading';
import { getActiveSpecialOffers, formatOfferTimeLeft, getSpecialOfferImageUrl } from '../utils/specialOffer';
import { getTrendingTaps } from '../utils/offerAnalytics';

interface DealsStripProps {
  shops: any[];
  onPressShop: (shop: any) => void;
}

const formatKm = (d: any) => (typeof d === 'number' && isFinite(d) ? `${d.toFixed(1)} km` : '');

// Horizontal "Deals near you" row for the member home — only shops with an active special offer,
// ranked by taps in the last 7 days (trending first), then by the original (distance) order.
export const DealsStrip = ({ shops, onPressShop }: DealsStripProps) => {
  const { fontScale } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const baseDeals = useMemo(
    () =>
      (shops || [])
        .map((s) => ({ shop: s, offers: getActiveSpecialOffers(s, now) }))
        .filter((d) => d.offers.length > 0),
    [shops, now],
  );
  const idsKey = baseDeals.map((d) => String(d.shop.id)).join(',');
  const [taps, setTaps] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!idsKey) return;
    let alive = true;
    getTrendingTaps(idsKey.split(',')).then((t) => alive && setTaps(t));
    return () => {
      alive = false;
    };
  }, [idsKey]);

  const deals = useMemo(
    () => [...baseDeals].sort((a, b) => (taps[String(b.shop.id)] || 0) - (taps[String(a.shop.id)] || 0)),
    [baseDeals, taps],
  );
  if (deals.length === 0) return null;

  return (
    <View style={styles.section} testID="deals-strip">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="gift" size={18} color="#FF8A00" />
          <GradientSectionHeading>Deals near you</GradientSectionHeading>
          <View style={styles.countPill}>
            <Text style={styles.countText} testID="deals-strip-count">{deals.length} Active</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowAll(value => !value)} accessibilityRole="button" accessibilityLabel={showAll ? 'Show fewer nearby deals' : 'See all nearby deals'} testID="deals-see-all"><Text style={styles.seeAll}>{showAll ? 'Show less' : 'See all'}</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal={!showAll} nestedScrollEnabled style={{ height: (showAll ? Math.min(deals.length, 3) * 254 : 256) * Math.max(1, fontScale), flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, showAll && styles.allRow]}>
        {deals.map(({ shop, offers }) => {
          const name = shop.businessName || shop.shopName || shop.name || 'Shop';
          const timeLeft = formatOfferTimeLeft(shop);
          const dealImage = getSpecialOfferImageUrl(shop) || (typeof shop.image === 'string' ? shop.image : null);
          return (
            <TouchableOpacity
              key={String(shop.id)}
              style={[styles.card, showAll && styles.fullCard]}
              activeOpacity={0.9}
              onPress={() => onPressShop(shop)}
              testID={`deal-card-${shop.id}`}
            >
              <View style={styles.imageWrap}>
                {dealImage ? (
                  <Image source={{ uri: dealImage }} style={styles.image} resizeMode="cover" testID={`deal-image-${shop.id}`} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="storefront" size={26} color="#FF8A00" />
                  </View>
                )}
                <LinearGradient colors={['#FF8A00', '#FF4D00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tag}>
                  <Ionicons name="pricetag" size={10} color="#FFF" />
                  <Text style={styles.tagText}>OFFER</Text>
                </LinearGradient>
              </View>
              <View style={styles.body}>
                <Text style={styles.shop} numberOfLines={1}>{name}</Text>
                <Text style={styles.offer} numberOfLines={2}>{offers[0]}</Text>
                <View style={styles.metaRow}>
                  {typeof shop.distance === 'number' && Number.isFinite(shop.distance) && (
                    <Text style={styles.meta}>
                      <Ionicons name="location-outline" size={12} color="#8FA0B8" /> {formatKm(shop.distance)}
                    </Text>
                  )}
                  {timeLeft && (
                    <View style={[styles.expiryPill, timeLeft.urgent && styles.expiryPillUrgent]} testID={`deal-expiry-${shop.id}`}>
                      <Ionicons name={timeLeft.urgent ? 'alarm-outline' : 'time-outline'} size={10} color={timeLeft.urgent ? '#C62828' : '#009B73'} />
                      <Text style={[styles.expiryText, timeLeft.urgent && styles.expiryTextUrgent]}>{timeLeft.urgent ? timeLeft.label : `Till ${new Date(shop.specialOfferEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#101C2D' },
  countPill: { backgroundColor: '#FFF1C5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  countText: { color: '#FF6B00', fontWeight: '600', fontSize: 11 },
  seeAll: { fontSize: 12, color: '#FF6B00', paddingLeft: 8 },
  row: { gap: 14, paddingRight: 4, paddingBottom: 12, alignItems: 'stretch' },
  allRow: { paddingRight: 0, paddingBottom: 8 },
  fullCard: { width: '100%', minHeight: 242 },
  card: {
    width: 278,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTrending: { borderColor: '#FF8A00', borderWidth: 1.5 },
  trendingTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6D00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trendingText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  metaTaps: { fontSize: 11, color: '#FF6D00', fontWeight: '700', marginTop: 4 },
  imageWrap: { height: 124, overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  body: { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
  offer: { fontSize: 12, fontWeight: '600', color: '#FF7900', lineHeight: 18, minHeight: 36 },
  shop: { fontSize: 14, fontWeight: '800', color: '#101C2D' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF2F7' },
  meta: { fontSize: 11, color: '#7587A3' },
  metaValid: { fontSize: 11, color: '#558B2F', fontWeight: '600' },
  expiryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAFBF3',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  expiryPillUrgent: { backgroundColor: '#FDECEC' },
  expiryText: { fontSize: 10, fontWeight: '700', color: '#009B73' },
  expiryTextUrgent: { color: '#C62828' },
});
