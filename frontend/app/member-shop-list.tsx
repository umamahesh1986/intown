import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchByProductNames, getMerchantImageByShopId, extractImageUrls, INTOWN_API_BASE } from '../utils/api';
import { useLocationStore } from '../store/locationStore';
import { formatDistance } from '../utils/formatDistance';

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
  }>();

  const categoryId = toParam(rawParams.categoryId);
  const categoryName = toParam(rawParams.categoryName);
  const query = toParam(rawParams.query);
  const source = toParam(rawParams.source);

  const { location, loadFromStorage } = useLocationStore();

  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const getFirstImageUrl = (img: unknown): string | null => {
    const urls = extractImageUrls(img);
    return urls[0] ?? null;
  };

  const fetchShopsByCategory = async () => {
    setIsLoading(true);
    try {
      if (!categoryId || !location?.latitude || !location?.longitude) {
        setShops([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `${INTOWN_API_BASE}/search/by-product-names?categoryId=${encodeURIComponent(categoryId)}&customerLatitude=${location.latitude}&customerLongitude=${location.longitude}`
      );

      if (!res.ok) {
        console.error('Category search failed with status:', res.status);
        setShops([]);
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      const list = Array.isArray(data) ? data : [];
      
      // Process shops with error handling for each item
      const enriched: any[] = [];
      for (const shop of list) {
        try {
          const shopId = shop?.id ?? shop?.merchantId ?? shop?.merchant_id;
          let image = null;
          try {
            image = await getMerchantImageByShopId(shopId);
          } catch (imgErr) {
            console.warn('Failed to get image for shop:', shopId);
          }
          const img = image ?? shop?.image ?? shop?.s3ImageUrl;
          enriched.push({ ...shop, image: getFirstImageUrl(img) });
        } catch (itemErr) {
          console.warn('Error processing shop item:', itemErr);
          enriched.push({ ...shop, image: null });
        }
      }
      setShops(enriched);
    } catch (error) {
      console.error('Failed to fetch category shops', error);
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };


  // 🔹 PRODUCT SEARCH (EXISTING LOGIC + FALLBACK)
  const fetchRealShops = async () => {
    setIsLoading(true);
    try {
      if (!query || !location?.latitude || !location?.longitude) {
        setShops([]);
        setIsLoading(false);
        return;
      }

      const data = await searchByProductNames(
        query,
        location.latitude,
        location.longitude
      );

      const mappedShops = Array.isArray(data)
        ? data.map((item: any) => ({
          id: item.id?.toString?.() ?? String(item.id ?? ''),
          name: item.businessName ?? item.shopName,
          businessName: item.businessName,
          shopName: item.shopName ?? item.businessName,
          contactName: item.contactName,
          category: item.businessCategory,
          businessCategory: item.businessCategory,
          distance: item.distance,
          image: getFirstImageUrl(item.s3ImageUrl),
          latitude: item.latitude,
          longitude: item.longitude,
        }))
        : [];

      if (mappedShops.length > 0) {
        const enriched = await Promise.all(
          mappedShops.map(async (shop: any) => {
            const shopId = shop?.id ?? shop?.merchantId ?? shop?.merchant_id;
            const image = await getMerchantImageByShopId(shopId);
            const img = image ?? shop?.image ?? shop?.s3ImageUrl;
            return { ...shop, image: getFirstImageUrl(img) };
          })
        );
        setShops(enriched);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Failed to fetch shops', error);
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };


  // 🔹 RUN SEARCH WHEN PARAMS OR LOCATION CHANGES
  useEffect(() => {
    if (!categoryId && !query) {
      setIsLoading(false);
      setShops([]);
      return;
    }
    if (categoryId) {
      fetchShopsByCategory();
    } else if (query) {
      fetchRealShops();
    }
  }, [categoryId, query, location?.latitude, location?.longitude]);

  const handleViewShop = (shop: any) => {
    try {
      if (!shop) {
        console.error('handleViewShop: shop is null or undefined');
        return;
      }
      const shopId = shop?.id ?? shop?.merchantId ?? shop?.merchant_id ?? '';
      if (!shopId) {
        console.error('handleViewShop: shopId is empty');
        return;
      }
      // Only pass shopId and source - fetch full details in member-shop-details
      router.push({
        pathname: '/member-shop-details',
        params: { 
          shopId: String(shopId), 
          categoryId: categoryId ?? '',
          source: source ?? 'user' 
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
          {/* <Text style={styles.emptyTitle}>Coming Soon!</Text> */}
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
          renderItem={({ item }) => {
            // Wrap entire render in try-catch to prevent crashes
            try {
              if (!item) return null;
              const imageUri = getFirstImageUrl(item?.image);
              const shopName = item?.businessName || item?.shopName || item?.name || item?.contactName || 'Shop';
              const categoryText = item?.businessCategory || item?.category || 'General';
              const contactName = item?.contactName;
              const showContactName = contactName && contactName !== item?.shopName;
              
              return (
                <View style={styles.shopCard}>
                  {/* TOP ROW */}
                  <View style={styles.shopRow}>
                    {/* LEFT: ICON */}
                    <View style={styles.shopImageContainer}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{ width: 60, height: 60, borderRadius: 10 }}
                        />
                      ) : (
                        <Ionicons name="storefront" size={40} color="#FF8A00" />
                      )}
                    </View>

                    {/* RIGHT: INFO */}
                    <View style={styles.shopInfoRight}>
                      <View style={styles.shopInfoRightnew}>
                        <Text style={styles.shopName} numberOfLines={1}>
                          {shopName}
                        </Text>

                        <Text style={styles.categoryText}>
                          {categoryText}
                        </Text>

                        {showContactName && (
                          <Text style={styles.contactNameText} numberOfLines={1}>
                            {contactName}
                          </Text>
                        )}
                      </View>
                      <View style={styles.distanceRow}>
                        <Ionicons name="location" size={14} color="#FF8A00" />
                        <Text style={styles.distanceText}>
                          {formatDistance(item?.distance)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* BUTTON */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewShop(item)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } catch (renderErr) {
              console.error('Error rendering shop item:', renderErr);
              return null;
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  placeholder: { width: 40 },
  listContent: { padding: 16 },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 25,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  shopCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  shopImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shopInfo: { marginBottom: 12 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6, maxWidth: 190 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  distanceText: { fontSize: 14, color: '#FF8A00', marginLeft: 4 }, 
  categoryText: { fontSize: 14, color: '#999' },
  contactNameText: { fontSize: 12, color: '#999', marginTop: 2 },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  viewButton: {
    flex: 1,
    backgroundColor: '#FF8A00',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    textTransform: 'uppercase',
  },
  viewButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  shopInfoRight: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfoRightnew: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

});
