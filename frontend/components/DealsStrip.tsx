import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveSpecialOffers, formatOfferValidTill } from '../utils/specialOffer';
import { getTrendingTaps } from '../utils/offerAnalytics';

interface DealsStripProps {
  shops: any[];
  onPressShop: (shop: any) => void;
}

const formatKm = (d: any) => (typeof d === 'number' && isFinite(d) ? `${d.toFixed(1)} km` : '');

// Horizontal "Deals near you" row for the member home — only shops with an active special offer,
// ranked by taps in the last 7 days (trending first), then by the original (distance) order.
export const DealsStrip = ({ shops, onPressShop }: DealsStripProps) => {
  const baseDeals = useMemo(
    () =>
      (shops || [])
        .map((s) => ({ shop: s, offers: getActiveSpecialOffers(s) }))
        .filter((d) => d.offers.length > 0),
    [shops],
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
  const topTaps = taps[String(deals[0].shop.id)] || 0;

  return (
    <View style={styles.section} testID="deals-strip">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="gift" size={18} color="#2E7D32" />
          <Text style={styles.title}>Deals near you</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText} testID="deals-strip-count">{deals.length}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {deals.map(({ shop, offers }, idx) => {
          const name = shop.businessName || shop.shopName || shop.name || 'Shop';
          const validTill = formatOfferValidTill(shop);
          const shopTaps = taps[String(shop.id)] || 0;
          const trending = idx === 0 && topTaps > 0;
          return (
            <TouchableOpacity
              key={String(shop.id)}
              style={[styles.card, trending && styles.cardTrending]}
              activeOpacity={0.9}
              onPress={() => onPressShop(shop)}
              testID={`deal-card-${shop.id}`}
            >
              <View style={styles.imageWrap}>
                {shop.image ? (
                  <Image source={{ uri: shop.image }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="storefront" size={26} color="#FF8A00" />
                  </View>
                )}
                <View style={styles.tag}>
                  <Ionicons name="pricetag" size={10} color="#FFF" />
                  <Text style={styles.tagText}>{offers.length > 1 ? `${offers.length} offers` : 'Offer'}</Text>
                </View>
                {trending && (
                  <View style={styles.trendingTag} testID={`deal-trending-${shop.id}`}>
                    <Ionicons name="flame" size={11} color="#FFF" />
                    <Text style={styles.trendingText}>Trending</Text>
                  </View>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.offer} numberOfLines={2}>{offers[0]}</Text>
                <Text style={styles.shop} numberOfLines={1}>{name}</Text>
                <View style={styles.metaRow}>
                  {!!shop.distance && (
                    <Text style={styles.meta}>
                      <Ionicons name="location-outline" size={11} color="#888" /> {formatKm(shop.distance)}
                    </Text>
                  )}
                  {shopTaps > 0 ? (
                    <Text style={styles.metaTaps} testID={`deal-taps-${shop.id}`}>{shopTaps} tapped this week</Text>
                  ) : (
                    !!validTill && <Text style={styles.metaValid}>till {validTill}</Text>
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
  section: { marginBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  countPill: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  countText: { color: '#2E7D32', fontWeight: '800', fontSize: 12 },
  row: { gap: 12, paddingRight: 16 },
  card: {
    width: 220,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCEDC8',
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
  metaTaps: { fontSize: 11, color: '#FF6D00', fontWeight: '700' },
  imageWrap: { height: 96, backgroundColor: '#F1F8E9', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46,125,50,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  body: { padding: 12, gap: 4 },
  offer: { fontSize: 14, fontWeight: '800', color: '#2E7D32', lineHeight: 19, minHeight: 38 },
  shop: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  meta: { fontSize: 11, color: '#888' },
  metaValid: { fontSize: 11, color: '#558B2F', fontWeight: '600' },
});
