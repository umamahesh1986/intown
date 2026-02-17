import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';



// ===== MERCHANT CAROUSEL CONFIG (SAME AS MEMBER) =====
const { width } = Dimensions.get('window');

const SLIDE_WIDTH = Math.round(width);
const CAROUSEL_HEIGHT = 160;

const SHOP_IMAGE_WIDTH = width - 64;



const MERCHANT_CAROUSEL_IMAGES = [
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner1.jpg' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner2.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner3.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner4.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner5.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner6.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner7.png' },
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
  const [merchantContactName, setMerchantContactName] = useState<string | null>(null);
  const [merchantDescription, setMerchantDescription] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [shopImageIndex, setShopImageIndex] = useState(0);
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
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  // =================================

  const shopImageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shopImageScrollRef = useRef<ScrollView | null>(null);


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

  useEffect(() => {
    if (shopImages.length <= 1) return;
    if (shopImageTimerRef.current) {
      clearInterval(shopImageTimerRef.current);
    }
    shopImageTimerRef.current = setInterval(() => {
      setShopImageIndex((prev) => (prev + 1) % shopImages.length);
    }, 3000);
    return () => {
      if (shopImageTimerRef.current) {
        clearInterval(shopImageTimerRef.current);
      }
    };
  }, [shopImages]);

  useEffect(() => {
    if (!shopImageScrollRef.current || shopImages.length === 0) return;
    shopImageScrollRef.current.scrollTo({
      x: shopImageIndex * SHOP_IMAGE_WIDTH,
      animated: true,
    });
  }, [shopImageIndex, shopImages.length]);

  const handlePrevShopImage = () => {
    if (shopImages.length === 0) return;
    setShopImageIndex((prev) =>
      prev === 0 ? shopImages.length - 1 : prev - 1
    );
  };

  const handleNextShopImage = () => {
    if (shopImages.length === 0) return;
    setShopImageIndex((prev) => (prev + 1) % shopImages.length);
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refreshProfileImage = async () => {
        try {
          const storedProfileImage =
            (await AsyncStorage.getItem('merchant_profile_image')) ??
            (await AsyncStorage.getItem('user_profile_image'));
          if (storedProfileImage && isActive) {
            setProfileImage(storedProfileImage);
          }
          const storedShopImagesRaw = await AsyncStorage.getItem('merchant_shop_images');
          if (storedShopImagesRaw && isActive) {
            try {
              const storedImages = JSON.parse(storedShopImagesRaw);
              if (Array.isArray(storedImages) && storedImages.length > 0) {
                setShopImages(storedImages);
                setShopImageIndex(0);
                if (!storedProfileImage) {
                  const firstImage = storedImages[0];
                  setProfileImage(firstImage);
                  await AsyncStorage.setItem('merchant_profile_image', firstImage);
                }
              }
            } catch {
              // ignore parse issues
            }
          }
        } catch (error) {
          console.error('Error refreshing profile image:', error);
        }
      };
      refreshProfileImage();
      return () => {
        isActive = false;
      };
    }, [])
  );

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
        const storedDescription = await AsyncStorage.getItem('merchant_description');
        if (storedDescription && isMounted) {
          setMerchantDescription(storedDescription);
        }
        const storedContactName = await AsyncStorage.getItem('merchant_contact_name');
        if (storedContactName && isMounted) {
          setMerchantContactName(storedContactName);
        }
        const storedProfileImage =
          (await AsyncStorage.getItem('merchant_profile_image')) ??
          (await AsyncStorage.getItem('user_profile_image'));
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
        await loadMerchantImages(String(resolvedId));
      } catch (error) {
        console.error('Error initializing merchant data:', error);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [params.merchantId, user?.id]);

  const loadMerchantImages = async (id: string) => {
    try {
      const storedProfileImage =
        (await AsyncStorage.getItem('merchant_profile_image')) ??
        (await AsyncStorage.getItem('user_profile_image'));
      const storedImagesRaw = await AsyncStorage.getItem('merchant_shop_images');
      if (storedImagesRaw) {
        try {
          const storedImages = JSON.parse(storedImagesRaw);
          if (Array.isArray(storedImages) && storedImages.length > 0) {
            setShopImages(storedImages);
            setShopImageIndex(0);
            if (!storedProfileImage) {
              const firstImage = storedImages[0];
              setProfileImage(firstImage);
              await AsyncStorage.setItem('merchant_profile_image', firstImage);
            }
            return;
          }
        } catch {
          // ignore storage parse errors and fall back to fetch
        }
      }
      const res = await fetch(`https://api.intownlocal.com/IN/s3/upload?userType=IN_MERCHANT&?merchantId=${id}`);
      if (!res.ok) {
        throw new Error(`S3 image fetch failed: ${res.status}`);
      }
      const data = await res.json();
      const images = Array.isArray(data?.s3ImageUrl) ? data.s3ImageUrl : [];
      if (images.length > 0) {
        setShopImages(images);
        setShopImageIndex(0);
        if (!storedProfileImage) {
          const firstImage = images[0];
          setProfileImage(firstImage);
          await AsyncStorage.setItem('merchant_profile_image', firstImage);
        }
        await AsyncStorage.setItem('merchant_shop_images', JSON.stringify(images));
      }
    } catch (error) {
      console.error('Error loading merchant images:', error);
    }
  };

  useEffect(() => {
    if (!merchantId) return;

    const fetchSales = async () => {
      setIsSalesLoading(true);
      try {
        const res = await fetch(
          `https://api.intownlocal.com/IN/transactions/merchants/${merchantId}`,
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
      const keys = await AsyncStorage.getAllKeys();
      const preserve = new Set(['user_profile_image', 'merchant_profile_image']);
      const keysToRemove = keys.filter((key) => !preserve.has(key));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      // 2️⃣ Clear auth store
      logout();

      // 3️⃣ Force redirect
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowDropdown(false));
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
              <Text style={styles.welcomeText}>
                Welcome {merchantShop.name || merchantContactName || user?.name || 'My Shop'}
              </Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {getLocationDisplayText()}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={(e) => {
              e.stopPropagation();
              showDropdown ? closeDropdown() : openDropdown();
            }}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{shopName || merchantContactName || 'Merchant'}</Text>
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

        {/* Shop Details Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopImageContainer}>
            {shopImages.length > 0 ? (
              <>
                <ScrollView
                  ref={shopImageScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}

                  style={styles.shopImageScroll}
                  contentContainerStyle={styles.shopImageScrollContent}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / SHOP_IMAGE_WIDTH
                    );
                    setShopImageIndex(index);
                  }}
                >
                  {shopImages.map((img, index) => (
                    <Image
  key={`${img}-${index}`}
  source={{ uri: img }}
  style={styles.shopImageCarousel}
  resizeMode="cover"
/>

                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.shopArrow, styles.shopArrowLeft]}
                  onPress={handlePrevShopImage}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shopArrow, styles.shopArrowRight]}
                  onPress={handleNextShopImage}
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="storefront" size={80} color="#2196F3" />
            )}
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

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {merchantDescription || 'No description available'}
            </Text>
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
          <View style={styles.sectionPaymentHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity onPress={() => setShowAllPayments(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
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
        <Footer dashboardType="merchant" />
      </ScrollView>

      {/* BACKDROP */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* MERCHANT DROPDOWN PANEL */}
      {showDropdown && (
        <Animated.View
          style={[
            styles.userPanel,
            {
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.userPanelHeader}>
            {profileImage ? (
              <Image
                source={getProfileImageSource(profileImage) ?? undefined}
                style={styles.panelAvatar}
              />
            ) : (
              <View style={styles.panelAvatarPlaceholder}>
                <Ionicons name="storefront" size={22} color="#fff" />
              </View>
            )}

            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userPanelName}>{shopName || merchantContactName || user?.name || 'Merchant'}</Text>
              <Text style={styles.userPanelPhone}>{(user as any)?.phone ?? (user as any)?.email ?? ''}</Text>
              <Text style={styles.userPanelTag}>Merchant Account</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.userPanelItem}
            onPress={() => {
              closeDropdown();
              router.push('/account');
            }}
          >
            <Ionicons name="person-outline" size={22} color="#FF6600" />
            <Text style={styles.userPanelText}>My Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userPanelItem}
            onPress={() => {
              closeDropdown();
              // TODO: Navigate to offers page
            }}
          >
            <Ionicons name="pricetag-outline" size={22} color="#FF6600" />
            <Text style={styles.userPanelText}>My Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userPanelItem}
            onPress={() => {
              closeDropdown();
              setShowAllPayments(true);
            }}
          >
            <Ionicons name="receipt-outline" size={22} color="#FF6600" />
            <Text style={styles.userPanelText}>All Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userPanelItem}
            onPress={() => {
              closeDropdown();
              handleLogout();
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF0000" />
            <Text style={[styles.userPanelText, { color: '#FF0000' }]}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.locationModalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.locationModalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.locationModalContent}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.locationModalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#ff6600" />
              </TouchableOpacity>
            </View>

            {/* Search Input - At the top for visibility */}
            <View style={styles.locationSearchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.locationSearchInput}
                placeholder="Search for area, street name..."
                placeholderTextColor="#999"
                value={locationSearchQuery}
                onChangeText={handleLocationSearch}
                returnKeyType="search"
              />
              {locationSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {isSearchingLocation && (
              <ActivityIndicator size="small" color="#FF6600" style={{ marginTop: 12 }} />
            )}

            {/* Search Results */}
            {locationSearchResults.length > 0 ? (
              <ScrollView 
                style={styles.locationSearchResults}
                keyboardShouldPersistTaps="handled"
              >
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
            ) : (
              <>
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
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
  welcomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
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
  
  // Backdrop
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  
  // User Panel (same as member dashboard)
  userPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2000,
  },
  userPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  panelAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6600',
  },
  panelAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPanelName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  userPanelPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  userPanelTag: { fontSize: 12, color: '#FF6600', marginTop: 2, fontWeight: '600' },
  userPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  userPanelText: { fontSize: 15, marginLeft: 12, color: '#333' },
  
  // Old dropdown styles (keeping for backwards compatibility)
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
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
  width: SHOP_IMAGE_WIDTH,
  aspectRatio: 16 / 9,
  borderRadius: 10,
  overflow: 'hidden',
  marginBottom: 16,
  position: 'relative',
},


  shopImageScroll: {
  flex: 1,
},

shopImageScrollContent: {
  flexGrow: 1,
},


shopImageCarousel: {
  width: SHOP_IMAGE_WIDTH,
  height: '100%',
  resizeMode: 'cover',
},



  shopArrow: {
    position: 'absolute',
    top: '50%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -14 }],
  },
  shopArrowLeft: {
    left: 8,
  },
  shopArrowRight: {
    right: 8,
  },
  shopName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  shopCategory: { fontSize: 16, color: '#666666', marginBottom: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 16, fontWeight: '600', color: '#666666', marginLeft: 8 },
  descriptionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EEEEEE' },
  descriptionText: { fontSize: 14, color: '#666666', lineHeight: 20 },
  section: { padding: 16 },
  sectionNoHorizontalPadding: {
    paddingHorizontal: 0,
  },
  sectionPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height: 160,
  },

 carouselSlide: {
  width: SLIDE_WIDTH,
  height: 160,
  paddingHorizontal: 16,
  backgroundColor: '#FFFFFF',  
  justifyContent: 'center',
  alignItems: 'center',
},



  carouselImage: {
  width: '100%',
  height: 160,
  borderRadius: 12,
  resizeMode: 'contain',
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
  // Location Modal Styles
  locationModalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    minHeight: 300,
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
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
    paddingVertical: 0,
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