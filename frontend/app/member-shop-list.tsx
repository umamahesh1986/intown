import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMerchantImageByShopId, extractImageUrls, INTOWN_API_BASE } from '../utils/api';
import { useLocationStore } from '../store/locationStore';
import { formatDistance } from '../utils/formatDistance';
import axios from 'axios';
import * as Location from 'expo-location';

// Normalize param (expo-router can return string | string[] on native)
const toParam = (v: string | string[] | undefined): string | undefined =>
  v == null ? undefined : Array.isArray(v) ? v[0] : String(v);

export default function MemberShopList() {
  const router = useRouter();
  const rawParams = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
    query?: string;
    source?: string;
    lat?: string;
    lng?: string;
  }>();

  const categoryId = toParam(rawParams.categoryId);
  const categoryName = toParam(rawParams.categoryName);
  const query = toParam(rawParams.query);
  const source = toParam(rawParams.source);
  const paramLat = toParam(rawParams.lat);
  const paramLng = toParam(rawParams.lng);

  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getFirstImageUrl = (img: unknown): string | null => {
    const urls = extractImageUrls(img);
    return urls[0] ?? null;
  };

  // ALWAYS fetch fresh GPS location for search
  useEffect(() => {
    if (!categoryId && !query) {
      setIsLoading(false);
      return;
    }

    const runSearch = async () => {
      let lat: number | null = null;
      let lng: number | null = null;

      // 1. ALWAYS try live GPS first (user's current device location)
      try {
        if (Platform.OS === 'web') {
          const pos = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            const t = setTimeout(() => resolve(null), 10000);
            navigator.geolocation.getCurrentPosition(
              (p) => { clearTimeout(t); resolve({ lat: p.coords.latitude, lng: p.coords.longitude }); },
              () => { clearTimeout(t); resolve(null); },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          });
          if (pos) {
            lat = pos.lat;
            lng = pos.lng;
            console.log('[ShopList] Using LIVE GPS (web):', lat, lng);
          }
        } else {
          // Mobile: request permission and get current position
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.status === 'granted') {
            // Try lastKnown first (instant, recent)
            try {
              const lastKnown = await Promise.race([
                Location.getLastKnownPositionAsync(),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
              ]);
              if (lastKnown && lastKnown.coords) {
                lat = lastKnown.coords.latitude;
                lng = lastKnown.coords.longitude;
                console.log('[ShopList] Using lastKnown GPS:', lat, lng);
              }
            } catch (e) {}

            // If no lastKnown, get fresh position
            if (!lat || !lng) {
              const pos = await Promise.race([
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
              ]);
              if (pos && 'coords' in pos) {
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                console.log('[ShopList] Using LIVE GPS (mobile):', lat, lng);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[ShopList] Live GPS failed:', e);
      }

      // 2. Only if GPS completely fails, try stored location
      if (!lat || !lng) {
        console.log('[ShopList] GPS unavailable, trying stored location...');
        try {
          const stored = useLocationStore.getState().location;
          if (stored?.latitude && stored?.longitude) {
            lat = stored.latitude;
            lng = stored.longitude;
            console.log('[ShopList] Fallback to store coords:', lat, lng);
          }
        } catch (e) {}
      }

      if (!lat || !lng) {
        try {
          await useLocationStore.getState().loadFromStorage();
          const loaded = useLocationStore.getState().location;
          if (loaded?.latitude && loaded?.longitude) {
            lat = loaded.latitude;
            lng = loaded.longitude;
            console.log('[ShopList] Fallback to AsyncStorage coords:', lat, lng);
          }
        } catch (e) {}
      }

      if (!lat || !lng) {
        console.log('[ShopList] No location available');
        setShops([]);
        setIsLoading(false);
        return;
      }

      // Update store with fresh GPS coords for other screens
      try {
        useLocationStore.getState().setLocation({
          latitude: lat, longitude: lng,
          area: '', city: '', state: '', country: '', pincode: '', fullAddress: ''
        });
      } catch (e) {}

      // Fire search with current location
      if (categoryId) {
        await fetchShopsByCategory(lat, lng);
      } else if (query) {
        await fetchShopsByProduct(lat, lng);
      }
    };

    runSearch();
  }, [categoryId, query]);

  // Category search
  const fetchShopsByCategory = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const url = `${INTOWN_API_BASE}/search/by-product-names?categoryId=${encodeURIComponent(categoryId!)}&customerLatitude=${lat}&customerLongitude=${lng}`;
      console.log('[ShopList] Category search URL:', url);

      const response = await axios.get(url, { timeout: 30000 });
      const data = response.data;
      console.log('[ShopList] Category results:', Array.isArray(data) ? data.length : 'not array');

      const list = Array.isArray(data) ? data : [];
      const mapped = list.map((item: any) => ({
        ...item,
        id: item.id?.toString?.() ?? String(item.id ?? ''),
        image: getFirstImageUrl(item.s3ImageUrl),
      }));
      setShops(mapped);
      setIsLoading(false);
      enrichImagesInBackground(mapped);
    } catch (error: any) {
      console.error('[ShopList] Category search error:', error?.message || error);
      // API returns 500 for unsupported areas — treat as no shops found
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Product name search
  const fetchShopsByProduct = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const url = `${INTOWN_API_BASE}/search/by-product-names?productNames=${encodeURIComponent(query!)}&customerLatitude=${lat}&customerLongitude=${lng}`;
      console.log('[ShopList] Product search URL:', url);

      const response = await axios.get(url, { timeout: 30000 });
      const data = response.data;
      console.log('[ShopList] Product results:', Array.isArray(data) ? data.length : 'not array');

      const list = Array.isArray(data) ? data : [];
      const mapped = list.map((item: any) => ({
        ...item,
        id: item.id?.toString?.() ?? String(item.id ?? ''),
        image: getFirstImageUrl(item.s3ImageUrl),
      }));
      setShops(mapped);
      setIsLoading(false);
      enrichImagesInBackground(mapped);
    } catch (error: any) {
      console.error('[ShopList] Product search error:', error?.message || error);
      // API returns 500 for unsupported areas — treat as no shops found
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Background image enrichment — does NOT block shop display
  const enrichImagesInBackground = async (shopList: any[]) => {
    try {
      const enriched = [...shopList];
      let updated = false;
      for (let i = 0; i < enriched.length; i++) {
        try {
          const shopId = enriched[i]?.id;
          if (!shopId) continue;
          const image = await getMerchantImageByShopId(shopId);
          if (image) {
            enriched[i] = { ...enriched[i], image: getFirstImageUrl(image) || enriched[i].image };
            updated = true;
          }
        } catch {}
      }
      if (updated) {
        setShops([...enriched]);
      }
    } catch {}
  };

  const handleViewShop = (shop: any) => {
    try {
      if (!shop) return;
      const shopId = shop?.id ?? shop?.merchantId ?? shop?.merchant_id ?? '';
      if (!shopId) return;
      router.push({
        pathname: '/member-shop-details',
        params: {
          shopId: String(shopId),
          categoryId: categoryId ?? '',
          source: source ?? 'user',
          shopData: JSON.stringify(shop),
        },
      });
    } catch (err) {
      console.error('handleViewShop error', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName || query || 'Nearby Shops'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Searching shops...</Text>
        </View>
      ) : shops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#FF8A00" />
          <Text style={styles.emptyMessage}>
            We are onboarding stores in your area.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item, index) => String(item?.id ?? item?.merchantId ?? index)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Stores near you</Text>
          }
          renderItem={({ item }) => {
            try {
              if (!item) return null;
              const imageUri = getFirstImageUrl(item?.image);
              const shopName = item?.businessName || item?.shopName || item?.name || item?.contactName || 'Shop';
              const categoryText = item?.businessCategory || item?.category || 'General';
              const contactName = item?.contactName;

              return (
                <TouchableOpacity style={styles.shopCard} onPress={() => handleViewShop(item)} activeOpacity={0.9}>
                  {/* Hero Image */}
                  <View style={styles.imageWrapper}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.heroPlaceholder}>
                        <Ionicons name="storefront" size={48} color="#FF8A00" />
                      </View>
                    )}
                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{categoryText}</Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
                        <View style={styles.distanceRow}>
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text style={styles.distanceText}>{formatDistance(item?.distance)} away</Text>
                        </View>
                        {contactName && (
                          <Text style={styles.contactText} numberOfLines={1}>{contactName}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.viewButton} onPress={() => handleViewShop(item)}>
                      <Text style={styles.viewButtonText}>View Shop</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            } catch {
              return null;
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  placeholder: { width: 40 },
  listContent: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  emptyMessage: {
    fontSize: 22,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 28,
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  goBackButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  // Card styles
  shopCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 138, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  distanceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  viewButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 28,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
