import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { extractImageUrls } from '../utils/api';
import { getActiveSpecialOffers, formatOfferValidTill } from '../utils/specialOffer';

interface Props {
  shop: any;
  onPress: (shop: any) => void;
  testID?: string;
}

export const hasSpecialOffer = (shop: any) => getActiveSpecialOffers(shop).length > 0;

// Shops with an active special offer first, keeping the original order otherwise.
export const sortSpecialOffersFirst = (shops: any[]) =>
  [...(shops || [])].sort((a, b) => Number(hasSpecialOffer(b)) - Number(hasSpecialOffer(a)));

// Horizontal "nearby shops" card used on the member & dual dashboards.
// Merchants with an active special offer get a highlighted treatment (ribbon, green frame, offer pill).
export const NearbyMerchantCard = ({ shop, onPress, testID }: Props) => {
  const urls = extractImageUrls(shop.image ?? shop.s3ImageUrl);
  const imageUri = urls[0] ?? (typeof shop.image === 'string' ? shop.image : null);
  const shopName = shop.businessName || shop.shopName || shop.contactName || 'Shop';
  const category = shop.businessCategory || 'General';
  const offers = getActiveSpecialOffers(shop);
  const special = offers.length > 0;
  const validTill = special ? formatOfferValidTill(shop) : '';
  const offerText = shop.offer || '';

  return (
    <TouchableOpacity
      style={[styles.card, special && styles.cardSpecial]}
      activeOpacity={0.9}
      onPress={() => onPress(shop)}
      testID={testID ?? `nearby-merchant-${shop.id}`}
    >
      {special && <View style={styles.topBar} />}
      <View style={styles.imageWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="storefront" size={36} color="#FF8A00" />
          </View>
        )}
        {special ? (
          <>
            <View style={styles.imageTint} />
            <View style={styles.ribbon} testID={`nearby-merchant-ribbon-${shop.id}`}>
              <Text style={styles.ribbonText}>SPECIAL OFFER</Text>
            </View>
            <View style={styles.offerCountPill}>
              <Ionicons name="gift" size={11} color="#FFF" />
              <Text style={styles.offerCountText}>{offers.length > 1 ? `${offers.length} deals` : 'Deal'}</Text>
            </View>
          </>
        ) : null}
        <View style={[styles.categoryBadge, special && styles.categoryBadgeSpecial]}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{shopName}</Text>
        {shop.contactName && shop.contactName !== shopName && (
          <Text style={styles.contact} numberOfLines={1}>{shop.contactName}</Text>
        )}
        {shop.address ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color="#888" />
            <Text style={styles.infoText} numberOfLines={1}>{shop.address}</Text>
          </View>
        ) : null}

        {special ? (
          <View style={styles.specialBox}>
            <View style={styles.specialRow}>
              <Ionicons name="sparkles" size={14} color="#FF8A00" />
              <Text style={styles.specialText} numberOfLines={2}>{offers[0]}</Text>
            </View>
            {!!validTill && <Text style={styles.specialValid}>Valid till {validTill}</Text>}
          </View>
        ) : offerText ? (
          <View style={styles.offerBadge}>
            <Ionicons name="pricetag" size={12} color="#4CAF50" />
            <Text style={styles.offerText} numberOfLines={1}>{offerText}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const GREEN = '#2E7D32';
const ORANGE = '#FF8A00';

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardSpecial: {
    borderWidth: 2,
    borderColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  topBar: { height: 4, backgroundColor: ORANGE },
  imageWrapper: { width: '100%', height: 120, backgroundColor: '#FFF3E0', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27, 94, 32, 0.12)' },
  ribbon: {
    position: 'absolute',
    top: 14,
    left: -34,
    width: 150,
    paddingVertical: 4,
    backgroundColor: ORANGE,
    transform: [{ rotate: '-35deg' }],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  ribbonText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  offerCountPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GREEN,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  offerCountText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 138, 0, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeSpecial: { backgroundColor: 'rgba(27, 94, 32, 0.9)' },
  categoryText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  content: { padding: 12, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  contact: { fontSize: 12, color: '#666' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: '#888', flex: 1 },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  offerText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  specialBox: {
    marginTop: 6,
    backgroundColor: '#F1F8E9',
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 3,
  },
  specialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  specialText: { flex: 1, fontSize: 12.5, fontWeight: '800', color: GREEN, lineHeight: 17 },
  specialValid: { fontSize: 10.5, color: '#558B2F', fontWeight: '600', marginLeft: 20 },
});
