import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  Image,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { 
  getUserLocationWithDetails, 
  searchLocations, 
  setManualLocation 
} from '../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontStylesWithFallback } from '../utils/fonts';
import Footer from '../components/Footer'
import { useRef } from 'react';

const { width } = Dimensions.get('window');

// ===== MERCHANT CAROUSEL CONFIG (SAME AS MEMBER) =====
const SLIDE_WIDTH = Math.round(width);
const CAROUSEL_HEIGHT = 160;

const MERCHANT_CAROUSEL_IMAGES = [
  require('../assets/images/1.jpg'),
  require('../assets/images/2.jpg'),
  require('../assets/images/3.jpg'),
  require('../assets/images/4.jpg'),
  require('../assets/images/5.jpg'),
  require('../assets/images/6.jpg'),
];
// =================================



interface ApiSale {
  transactionId: number;
  customerName: string;
  customerPhone: string;
  totalSalesValue: number;
  totalDiscountGiven: number;
  totalAmountReceived: number;
  transactionDate: string;
}

interface ApiSummary {
  totalSalesValue: number;
  totalDiscountGiven: number;
  totalAmountReceived: number;
  salesCount: number;
}

const formatTransactionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function MerchantDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string; merchantId?: string }>();
  const { user, logout, token } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userType, setUserType] = useState<string>('Merchant');
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sales, setSales] = useState<ApiSale[]>([]);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [lifetimeTotals, setLifetimeTotals] = useState<ApiSummary | null>(null);
  const [periodTotals, setPeriodTotals] = useState<{
    today: ApiSummary | null;
    thisMonth: ApiSummary | null;
    thisYear: ApiSummary | null;
  }>({
    today: null,
    thisMonth: null,
    thisYear: null,
  });
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [debugMerchantId, setDebugMerchantId] = useState<string | null>(null);

  // Location store
  const location = useLocationStore((state) => state.location);
  const isLocationLoading = useLocationStore((state) => state.isLoading);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);

  // Location modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{
    name: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // ===== MERCHANT CAROUSEL STATE =====
const [carouselIndex, setCarouselIndex] = useState(0);
const carouselRef = useRef<ScrollView | null>(null);
// =================================


  // Merchant shop details (would come from registration)
  const merchantShop = {
    name: shopName || user?.name || 'My Shop',
    category: 'Retail Store',
    rating: 4.5,
    totalPayments: sales.length,
  };

  useEffect(() => {
    loadUserType();
    requestLocationOnMount();
    // ===== MERCHANT CAROUSEL AUTO SLIDE =====
  const timer = setInterval(() => {
    setCarouselIndex(prev => {
      const next = (prev + 1) % MERCHANT_CAROUSEL_IMAGES.length;
      carouselRef.current?.scrollTo({
        x: next * SLIDE_WIDTH,
        animated: true,
      });
      return next;
    });
  }, 3500);

  return () => clearInterval(timer);
  // =====================================
  }, []);

  // Request location permission on mount
  const requestLocationOnMount = async () => {
    await loadLocationFromStorage();
    const storedLocation = useLocationStore.getState().location;
    if (!storedLocation) {
      setTimeout(async () => {
        await getUserLocationWithDetails();
      }, 1000);
    }
  };

  // Location handlers
  const handleLocationSearch = async (text: string) => {
    setLocationSearchQuery(text);
    if (text.length >= 3) {
      setIsSearchingLocation(true);
      const results = await searchLocations(text);
      setLocationSearchResults(results);
      setIsSearchingLocation(false);
    } else {
      setLocationSearchResults([]);
    }
  };

  const handleSelectLocation = async (item: { latitude: number; longitude: number }) => {
    const result = await setManualLocation(item.latitude, item.longitude);
    if (result) {
      setShowLocationModal(false);
      setLocationSearchQuery('');
      setLocationSearchResults([]);
    }
  };

  const handleUseCurrentLocation = async () => {
    const result = await getUserLocationWithDetails();
    if (result) {
      setShowLocationModal(false);
    }
  };

  const getLocationDisplayText = () => {
    if (isLocationLoading) return 'Getting location...';
    if (location?.area) return location.area;
    if (location?.city) return location.city;
    return 'Set Location';
  };

  const loadUserType = async () => {
    try {
      if (params.userType) {
        setUserType(formatUserType(params.userType));
      } else {
        const storedUserType = await AsyncStorage.getItem('user_type');
        if (storedUserType) {
          setUserType(formatUserType(storedUserType));
        }
      }
    } catch (error) {
      console.log('Error loading user type:', error);
    }
  };

  const getProfileImageSource = (value: string | null) => {
    if (!value) return null;
    if (
      value.startsWith('http') ||
      value.startsWith('file:') ||
      value.startsWith('content:') ||
      value.startsWith('data:')
    ) {
      return { uri: value };
    }
    return { uri: `data:image/jpeg;base64,${value}` };
  };

  const formatUserType = (type: string): string => {
    const lower = type.toLowerCase();
    if (lower === 'new_user' || lower === 'new' || lower === 'user') return 'User';
    if (lower.includes('customer')) return 'Customer';
    if (lower.includes('merchant')) return 'Merchant';
    if (lower === 'dual') return 'Customer & Merchant';
    return 'Merchant';
  };

  useEffect(() => {
    let isMounted = true;

    const normalizeId = (value: string | string[] | null | undefined) => {
      if (!value) return null;
      if (Array.isArray(value)) return value[0] ?? null;
      return value;
    };

    const init = async () => {
      try {
        const storedShopName = await AsyncStorage.getItem('merchant_shop_name');
        if (storedShopName && isMounted) {
          setShopName(storedShopName);
        }
        const storedProfileImage = await AsyncStorage.getItem('merchant_profile_image');
        if (storedProfileImage && isMounted) {
          setProfileImage(storedProfileImage);
        }

        const storedId =
          (await AsyncStorage.getItem('merchant_id')) ??
          (await AsyncStorage.getItem('merchantId'));
        const resolvedId =
          normalizeId(params.merchantId) ??
          normalizeId(storedId) ??
          (user?.id ?? null);

        if (isMounted) {
          setDebugMerchantId(resolvedId ? String(resolvedId) : null);
        }
        if (!resolvedId) return;
        if (isMounted) {
          setMerchantId(String(resolvedId));
        }
        if (params.merchantId) {
          await AsyncStorage.setItem('merchant_id', String(params.merchantId));
        }
      } catch (error) {
        console.error('Error initializing merchant data:', error);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [params.merchantId, user?.id]);

  useEffect(() => {
    if (!merchantId) return;

    const fetchSales = async () => {
      setIsSalesLoading(true);
      try {
        const res = await fetch(
          `https://devapi.intownlocal.com/IN/transactions/merchants/${merchantId}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                }
              : { Accept: 'application/json' },
          }
        );
        if (!res.ok) {
          throw new Error(`Sales fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setSales(data?.sales ?? []);
        setLifetimeTotals(data?.lifetime ?? null);
        setPeriodTotals({
          today: data?.today ?? null,
          thisMonth: data?.thisMonth ?? null,
          thisYear: data?.thisYear ?? null,
        });
      } catch (error) {
        console.error('Error loading sales:', error);
        setSales([]);
        setLifetimeTotals(null);
        setPeriodTotals({ today: null, thisMonth: null, thisYear: null });
      } finally {
        setIsSalesLoading(false);
      }
    };

    fetchSales();
  }, [merchantId, token]);

 const handleLogout = async () => {
  try {
    // 1️⃣ Clear local storage
    await AsyncStorage.clear();

    // 2️⃣ Clear auth store
    logout();

    // 3️⃣ Force redirect
    router.replace('/login');
  } catch (error) {
    console.error('Logout error:', error);
    router.replace('/login');
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="location" size={16} color="#FF6600" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationText} numberOfLines={1}>
                {getLocationDisplayText()}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name ?? 'Merchant'}</Text>
              <Text style={styles.userPhone}>
                {(user as any)?.phone ?? (user as any)?.email ?? ''}
              </Text>
            </View>
            {profileImage ? (
              <Image
                source={getProfileImageSource(profileImage) ?? undefined}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons
                name="person"
                size={20}
                color="#ff6600"
                style={styles.profileIconButton}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showDropdown && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
              }}
            >
              <Ionicons name="person-outline" size={20} color="#666666" />
              <Text style={styles.dropdownText}>Account Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowDropdown(false);
              }}
            >
              <Ionicons name="storefront-outline" size={20} color="#666666" />
              <Text style={styles.dropdownText}>Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF0000" />
              <Text style={[styles.dropdownText, { color: '#FF0000' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== MERCHANT CAROUSEL ===== */}
<View style={styles.carouselWrapper}>
  <ScrollView
    ref={carouselRef}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    snapToInterval={SLIDE_WIDTH}
    decelerationRate="fast"
    onMomentumScrollEnd={(e) => {
      const index = Math.round(
        e.nativeEvent.contentOffset.x / SLIDE_WIDTH
      );
      setCarouselIndex(index);
    }}
  >
    {MERCHANT_CAROUSEL_IMAGES.map((img, index) => (
      <View key={index} style={styles.carouselSlide}>
        <Image source={img} style={styles.carouselImage} />
      </View>
    ))}
  </ScrollView>

  <View style={styles.carouselDots}>
    {MERCHANT_CAROUSEL_IMAGES.map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          carouselIndex === i && styles.dotActive,
        ]}
      />
    ))}
  </View>
</View>
{/* === END MERCHANT CAROUSEL === */}

        {/* DEBUG: Merchant ID */}
        <View style={styles.debugBanner}>
          <Text style={styles.debugText}>
            Merchant ID: {debugMerchantId ?? 'not found'}
          </Text>
        </View>


        {/* Shop Details Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopImageContainer}>
            <Ionicons name="storefront" size={80} color="#2196F3" />
          </View>
          <Text style={styles.shopName}>{merchantShop.name}</Text>
          <Text style={styles.shopCategory}>{merchantShop.category}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= merchantShop.rating ? 'star' : 'star-outline'}
                size={20}
                color="#FFA500"
              />
            ))}
            <Text style={styles.ratingText}>{merchantShop.rating}</Text>
          </View>
        </View>

        {/* Total Summary Section */}
        <View style={[styles.section, styles.sectionNoHorizontalPadding]}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Today's Sales</Text>
                <Text style={styles.summaryValue}>
                  ₹{(periodTotals.today?.totalSalesValue ?? 0).toFixed(0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>This Month's Sales</Text>
                <Text style={styles.summaryValue}>
                  ₹{(periodTotals.thisMonth?.totalSalesValue ?? 0).toFixed(0)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>This Year's Sales</Text>
                <Text style={styles.summaryValue}>
                  ₹{(periodTotals.thisYear?.totalSalesValue ?? 0).toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          <TouchableOpacity onPress={() => setShowAllPayments(true)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
          {isSalesLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : sales.length > 0 ? (
            sales.slice(0, 10).map((sale) => (
              <View key={sale.transactionId} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionMerchant} numberOfLines={1}>
                    {sale.customerName}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {sale.customerPhone}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(sale.transactionDate)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <View style={styles.transactionAmountBlock}>
                    <Text style={styles.transactionAmountLabel}>Sales</Text>
                    <Text style={styles.transactionAmountValue}>
                      ₹{sale.totalSalesValue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmountBlock}>
                    <Text style={styles.transactionAmountLabel}>Discount</Text>
                    <Text style={styles.transactionAmountValue}>
                      ₹{sale.totalDiscountGiven.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmountBlock}>
                    <Text style={styles.transactionAmountLabel}>Received</Text>
                    <Text style={styles.transactionAmountValue}>
                      ₹{sale.totalAmountReceived.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Footer/>
      </ScrollView>

      {/* All Payments Modal */}
      <Modal
        visible={showAllPayments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllPayments(false)}
      >
        <View style={styles.transactionsModalOverlay}>
          <View style={styles.transactionsModalContent}>
            <View style={styles.transactionsModalHeader}>
              <Text style={styles.transactionsModalTitle}>All Payments</Text>
              <TouchableOpacity
                onPress={() => setShowAllPayments(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <View key={`all-${sale.transactionId}`} style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionMerchant} numberOfLines={1}>
                        {sale.customerName}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {sale.customerPhone}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatTransactionDate(sale.transactionDate)}
                      </Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <View style={styles.transactionAmountBlock}>
                        <Text style={styles.transactionAmountLabel}>Sales</Text>
                        <Text style={styles.transactionAmountValue}>
                          ₹{sale.totalSalesValue.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.transactionAmountBlock}>
                        <Text style={styles.transactionAmountLabel}>Discount</Text>
                        <Text style={styles.transactionAmountValue}>
                          ₹{sale.totalDiscountGiven.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.transactionAmountBlock}>
                        <Text style={styles.transactionAmountLabel}>Received</Text>
                        <Text style={styles.transactionAmountValue}>
                          ₹{sale.totalAmountReceived.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No payments yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.locationModalContainer}>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#ff6600" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.useCurrentLocationBtn}
              onPress={handleUseCurrentLocation}
              disabled={isLocationLoading}
            >
              <Ionicons name="locate" size={20} color="#FF6600" />
              <Text style={styles.useCurrentLocationText}>
                {isLocationLoading ? 'Getting location...' : 'Use Current Location'}
              </Text>
              {isLocationLoading && <ActivityIndicator size="small" color="#FF6600" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>

            {location && (
              <View style={styles.currentLocationDisplay}>
                <Ionicons name="location" size={18} color="#4CAF50" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.currentLocationArea}>{location.area || location.city}</Text>
                  <Text style={styles.currentLocationFull} numberOfLines={2}>
                    {location.fullAddress}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.locationDivider}>
              <View style={styles.locationDividerLine} />
              <Text style={styles.locationDividerText}>OR</Text>
              <View style={styles.locationDividerLine} />
            </View>

            <View style={styles.locationSearchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search for area, street name..."
                placeholderTextColor="#999"
                value={locationSearchQuery}
                onChangeText={handleLocationSearch}
              />
            </View>

            {isSearchingLocation && (
              <ActivityIndicator size="small" color="#FF6600" style={{ marginTop: 16 }} />
            )}
            
            <ScrollView style={styles.locationSearchResults}>
              {locationSearchResults.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.locationSearchItem}
                  onPress={() => handleSelectLocation(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.locationSearchItemName}>{item.name}</Text>
                    <Text style={styles.locationSearchItemAddress} numberOfLines={2}>
                      {item.fullAddress}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rightContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6600',
    flex: 1,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  profileIconButton: {
    borderWidth: 2,
    borderColor: '#ff6600',
    padding: 4,
    borderRadius: 30,
    marginLeft: 10,
    width: 34,
    textAlign: 'center',
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#ff6600',
    marginLeft: 10,
  },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  userPhone: { fontSize: 10, color: '#666666', marginTop: 2 },
  dropdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownText: { fontSize: 14, color: '#666666', marginLeft: 12 },
  shopCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  shopImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shopName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  shopCategory: { fontSize: 16, color: '#666666', marginBottom: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#666666', marginLeft: 8 },
  section: { padding: 16 },
  sectionNoHorizontalPadding: {
    paddingHorizontal: 0,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', margin: 16 },
  summarySection: {
    backgroundColor: '#ff6600',
    paddingVertical: 18,
    paddingHorizontal: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 10,
  },
  summaryLabel: {
    ...FontStylesWithFallback.caption,
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryValue: {
    ...FontStylesWithFallback.h3,
    color: '#fe6f09',
    fontWeight: '700',
    marginTop: 6,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'column',
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  transactionAmountBlock: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  transactionAmountLabel: {
    fontSize: 10,
    color: '#999999',
    textTransform: 'uppercase',
  },
  transactionAmountValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6600',
    fontWeight: '600',
    marginBottom: 8,
  },
  transactionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  transactionsModalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  transactionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { backgroundColor: '#1A1A1A', padding: 24, alignItems: 'center', marginTop: 16 },
  footerTagline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  // ===== MERCHANT CAROUSEL STYLES =====
carouselWrapper: {
  marginTop: 12,
  marginBottom: 8,
},

carouselSlide: {
  width: SLIDE_WIDTH,
  height: 160,
  paddingHorizontal: 16,
},


carouselImage: {
  width: '100%',
  height: '100%',
  borderRadius: 12,
  resizeMode: 'cover',
},


carouselDots: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 8,
},

dot: {
  width: 8,
  height: 8,
  borderRadius: 8,
  backgroundColor: '#ddd',
  marginHorizontal: 4,
},

dotActive: {
  backgroundColor: '#FF6600',
},
// ===================================
  debugBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  debugText: {
    fontSize: 12,
    color: '#B45309',
  },

// Location Modal Styles
locationModalContainer: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
locationModalContent: {
  backgroundColor: '#FFFFFF',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  maxHeight: '80%',
},
locationModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
locationModalTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#1A1A1A',
},
useCurrentLocationBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF3E0',
  padding: 16,
  borderRadius: 12,
  marginBottom: 16,
},
useCurrentLocationText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FF6600',
  marginLeft: 12,
},
currentLocationDisplay: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  backgroundColor: '#E8F5E9',
  padding: 14,
  borderRadius: 12,
  marginBottom: 16,
},
currentLocationArea: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
},
currentLocationFull: {
  fontSize: 12,
  color: '#666',
  marginTop: 2,
},
locationDivider: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 16,
},
locationDividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: '#E0E0E0',
},
locationDividerText: {
  marginHorizontal: 16,
  fontSize: 12,
  color: '#999',
  fontWeight: '600',
},
locationSearchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F5F5F5',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
},
locationSearchInput: {
  flex: 1,
  fontSize: 16,
  marginLeft: 12,
  color: '#333',
},
locationSearchResults: {
  maxHeight: 250,
  marginTop: 8,
},
locationSearchItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F0F0',
},
locationSearchItemName: {
  fontSize: 15,
  fontWeight: '600',
  color: '#333',
},
locationSearchItemAddress: {
  fontSize: 12,
  color: '#666',
  marginTop: 2,
},

});