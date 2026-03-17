import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
  Easing,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import {
  CATEGORY_IMAGE_LIST,
  FALLBACK_CATEGORY_IMAGE,
} from '../utils/categoryImageList';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import {
  getCategories,
  getNearbyShops,
  getNearbyShopsByCategory,
} from '../utils/api';
import { getCustomerProfile, getMerchantImageByShopId, extractImageUrls } from '../utils/api';


import {
  getUserLocationWithDetails,
  searchLocations,
  setManualLocation
} from '../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer'
import { CATEGORY_ICON_MAP } from '../utils/categoryIconMap';
import { FontStylesWithFallback } from '../utils/fonts';
import { formatDistance } from '../utils/formatDistance';
import CommonBottomTabs from "../components/CommonBottomTabs";


const { width } = Dimensions.get('window');

// ===== MEMBER CAROUSEL CONFIG =====
const SLIDE_WIDTH = Math.round(width);
const CAROUSEL_HEIGHT = 160;

const MEMBER_CAROUSEL_IMAGES = [
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner1.jpg' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner2.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner3.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner4.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner5.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner6.png' },
  { uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner7.png' },

];
// =================================

// Category images from Unsplash/Pexels - mapped to API category names




const SEARCH_ITEMS = [
  'Grocery',
  'Vegetables',
  'Fruits',
  'Salon',
  'Restaurant',
  'Pharmacy',
  'Fashion',
  'Electronics',
];


const SEARCH_PRODUCTS = [
  'Tomato',
  'Onion',
  'Potato',
  'Apple',
  'Banana',
  'Milk',
  'Bread',
  'Rice',
  'Shampoo',
  'Soap',
];


interface Category {
  id: string;
  name: string;
  icon: string;
}
interface ApiTransaction {
  transactionId: number;
  businessName?: string;
  merchantName?: string;
  totalPrice?: number;
  inTownPrice?: number;
  intownSavings?: number;
  payablePrice?: number;
  transactionDate: string;
}

interface ApiSummary {
  totalPrice?: number;
  intownPrice?: number;
  intownSavings?: number;
  totalPayablePrice?: number;
  transactionCount?: number;
}

const TransactionRow = ({
  transaction,
}: {
  transaction: ApiTransaction;
}) => (
  <View style={styles.transactionRow}>
    <View style={styles.transactionLeft}>
      <Text style={styles.transactionMerchant} numberOfLines={1}>
        {transaction.businessName || transaction.merchantName || 'Unknown'}
      </Text>
      <Text style={styles.transactionDate}>
        {formatTransactionDate(transaction.transactionDate)}
      </Text>
    </View>
    <View style={styles.transactionRight}>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Bill</Text>
        <Text style={styles.transactionAmountValue}>
          {(transaction.totalPrice ?? 0).toFixed(2)}
        </Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Saved</Text>
        <Text style={styles.transactionAmountValue}>
          {(transaction.intownSavings ?? 0).toFixed(2)}
        </Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Paid</Text>
        <Text style={styles.transactionAmountValue}>
          {(transaction.payablePrice ?? 0).toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);
const getCategoryImage = (category: any, index: number) => {
  if (category?.imageUrl) {
    return { uri: category.imageUrl };
  }
  return CATEGORY_IMAGE_LIST[index] ?? FALLBACK_CATEGORY_IMAGE;
};

const formatTransactionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function MemberDashboard() {
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const router = useRouter();
  const params = useLocalSearchParams<{
    userType?: string;
    customerId?: string;
  }>();
  const { user, logout, token } = useAuthStore();
  const [userType, setUserType] = useState<string>('Customer');

  // Location store
  const location = useLocationStore((state) => state.location);
  const isLocationLoading = useLocationStore((state) => state.isLoading);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
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
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const normalizeId = (value?: string | number | null) => {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? String(num) : null;
  };

  const [customerName, setCustomerName] = useState<string | null>(null);
  // Nearby shops (REAL API)
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);


  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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

  // photo state and uploading indicator
  const [uploading, setUploading] = useState(false);


  const placeholderAnim = useRef(new Animated.Value(0)).current;
  const contentScrollRef = useRef<ScrollView | null>(null);
  const CARD_WIDTH = 172;


  const CATEGORY_CARD_WIDTH = 100;
  const CATEGORY_CARD_GAP = 12;

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // ===== MEMBER CAROUSEL STATE =====
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);
  const categoriesScrollRef = useRef<ScrollView | null>(null);
  const nearbyScrollRef = useRef<ScrollView | null>(null);
  // ================================


  useEffect(() => {
    loadCustomerProfile();
    loadCategories();
    loadUserType();

    requestLocationOnMount();
    // ===== MEMBER CAROUSEL AUTO SLIDE =====
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % MEMBER_CAROUSEL_IMAGES.length;
        carouselRef.current?.scrollTo({
          x: next * SLIDE_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, []);
  const loadCustomerProfile = async () => {
    try {
      setProfileLoading(true);
      const resolvedCustomerId =
        customerId ??
        (await AsyncStorage.getItem('customer_id')) ??
        (user?.id != null ? String(user.id) : null);
      if (!resolvedCustomerId) return;
      const data = await getCustomerProfile(Number(resolvedCustomerId));
      setCustomerProfile(data);
    } catch (error) {
      console.error('Customer profile fetch failed:', error);
    } finally {
      setProfileLoading(false);
    }
  };


  //  Call nearby shops API when location is available
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadNearbyShops();
    }
  }, [location?.latitude, location?.longitude]);

  const stopCategoriesAutoScroll = () => { };
  const stopNearbyAutoScroll = () => { };

  const categoryColumns = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryColumns.push(categories.slice(i, i + 2));
  }

  const placeholderItems = [
    'Grocery',
    'Salon',
    'Fashion',
    'Vegetables',
    'Fruits',
    'Restaurant',
    'Pharmacy',
    'Electronics',];
  const placeholderOpacity = placeholderAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  const placeholderTranslateY = placeholderAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [16, 0, 0, -16],
  });

  useEffect(() => {
    let isMounted = true;

    const animatePlaceholder = () => {
      placeholderAnim.setValue(0);
      Animated.timing(placeholderAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !isMounted) return;
        setPlaceholderIndex((prev) => (prev + 1) % placeholderItems.length);
        animatePlaceholder();
      });
    };

    animatePlaceholder();

    return () => {
      isMounted = false;
      placeholderAnim.stopAnimation();
    };
  }, [placeholderAnim, placeholderItems.length]);

  useEffect(() => {
    const loadCustomerMeta = async () => {
      try {
        // Try multiple sources for customer name
        let name = await AsyncStorage.getItem('customer_contact_name');
        if (!name) {
          name = await AsyncStorage.getItem('customer_name');
        }
        if (!name) {
          const userSearchResponse = await AsyncStorage.getItem('user_search_response');
          if (userSearchResponse) {
            try {
              const searchData = JSON.parse(userSearchResponse);
              name = searchData?.customer?.contactName || searchData?.customer?.name || null;
            } catch {
              // ignore parse errors
            }
          }
        }
        if (name) {
          setCustomerName(name);
          // Also save to standard key for consistency
          await AsyncStorage.setItem('customer_name', name);
        }

        const storedProfileImage = await AsyncStorage.getItem('user_profile_image');
        if (storedProfileImage) {
          setProfileImage(storedProfileImage);
        }
        if (params.customerId) {
          setCustomerId(params.customerId);
          await AsyncStorage.setItem('customer_id', params.customerId);
          return;
        }
        const storedCustomerId = await AsyncStorage.getItem('customer_id');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customer id:', error);
      }
    };

    loadCustomerMeta();
  }, [params.customerId]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refreshProfileImage = async () => {
        try {
          const storedProfileImage = await AsyncStorage.getItem('user_profile_image');
          if (storedProfileImage && isActive) {
            setProfileImage(storedProfileImage);
          }
          if (!storedProfileImage) {
            const storedCustomerImages = await AsyncStorage.getItem('customer_profile_images');
            if (storedCustomerImages && isActive) {
              try {
                const parsedImages = JSON.parse(storedCustomerImages);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  const firstImage = parsedImages[0];
                  setProfileImage(firstImage);
                  await AsyncStorage.setItem('user_profile_image', firstImage);
                }
              } catch {
                // ignore parse issues
              }
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

  useEffect(() => {
    const effectiveCustomerId =
      normalizeId(customerId) ?? normalizeId(user?.id ?? null);
    if (!effectiveCustomerId) return;

    const fetchTransactions = async () => {
      setIsTransactionsLoading(true);
      try {
        const res = await fetch(
          `https://api.intownlocal.com/IN/transactions/customers/${effectiveCustomerId}`,
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
          throw new Error(`Transactions fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setTransactions(data?.transactions ?? []);
        setLifetimeTotals(data?.lifetime ?? null);
        setPeriodTotals({
          today: data?.today ?? null,
          thisMonth: data?.thisMonth ?? null,
          thisYear: data?.thisYear ?? null,
        });
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
        setLifetimeTotals(null);
        setPeriodTotals({ today: null, thisMonth: null, thisYear: null });
      } finally {
        setIsTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [customerId, token, user?.id]);

  // Request location permission on mount
  const requestLocationOnMount = async () => {
    await loadLocationFromStorage();
    try {
      const locationResult = await getUserLocationWithDetails();
      if (!locationResult) {
        const storedLocation = useLocationStore.getState().location;
        if (!storedLocation) {
          Alert.alert(
            'Location Access',
            'Please enable location access to see nearby shops.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Set Manually', onPress: () => setShowLocationModal(true) }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Location search handler
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

  // Select location from search results
  const handleSelectLocation = async (item: { latitude: number; longitude: number }) => {
    const result = await setManualLocation(item.latitude, item.longitude);
    if (result) {
      setShowLocationModal(false);
      setLocationSearchQuery('');
      setLocationSearchResults([]);
    }
  };

  // Use current location
  const handleUseCurrentLocation = async () => {
    const result = await getUserLocationWithDetails();
    if (result) {
      setShowLocationModal(false);
    } else {
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  // Get display location text
  const getLocationDisplayText = () => {
    if (isLocationLoading) return 'Getting location...';
    if (location?.area) return location.area;
    if (location?.city) return location.city;
    return 'Set Location';
  };

  const getProfileImageSource = (value: string | null) => {
    if (!value) return undefined;
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

  const formatUserType = (type: string): string => {
    const lower = type.toLowerCase();
    if (lower === 'new_user' || lower === 'new' || lower === 'user') return 'User';
    if (lower.includes('customer')) return 'Customer';
    if (lower.includes('merchant')) return 'Merchant';
    if (lower === 'dual') return 'Customer & Merchant';
    return 'Customer';
  };
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  //  Load nearby shops using real API
  const loadNearbyShops = async () => {
    // location comes from useLocationStore (already implemented)
    if (!location?.latitude || !location?.longitude) return;

    try {
      setIsNearbyLoading(true);

      const response = await getNearbyShops(
        location.latitude,
        location.longitude
      );


      const list = Array.isArray(response) ? response : [];
      const enriched = await Promise.all(
        list.map(async (shop: any) => {
          const shopId = shop?.id ?? shop?.merchantId ?? shop?.merchant_id;
          const image = await getMerchantImageByShopId(shopId);
          const img = image ?? shop?.image ?? shop?.s3ImageUrl;
          const urls = extractImageUrls(img);
          return { ...shop, image: urls[0] ?? null };
        })
      );
      setNearbyShops(enriched);

    } catch (error) {
      console.error('Failed to load nearby shops:', error);
      setNearbyShops([]);
    } finally {
      setIsNearbyLoading(false);
    }
  };

  /* ================= CATEGORY CLICK HANDLER ================= */

  const handleCategoryClick = (category: Category) => {
    router.push({
      pathname: '/member-shop-list',
      params: {
        categoryId: String(category.id),
        categoryName: category.name,
        source: 'member',
      },
    });
  };









  const todaySavedAmount = periodTotals.today?.intownSavings ?? 0;
  const monthSavedAmount = periodTotals.thisMonth?.intownSavings ?? 0;
  const yearSavedAmount = periodTotals.thisYear?.intownSavings ?? 0;

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const preserve = new Set(['user_profile_image', 'merchant_profile_image']);
      const keysToRemove = keys.filter((key) => !preserve.has(key));
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      await logout();
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/');
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (error) {
      console.error('LOGOUT ERROR:', error);
      router.replace('/login');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/member-shop-list', params: { query: searchQuery, source: 'member' } });
    }
  };

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setShowDropdown(false));
  };

  const toggleDropdown = () => {
    if (showDropdown) closeDropdown();
    else openDropdown();
  };

  const rawPlan = (user as any)?.membershipPlan;
  const currentPlan =
    rawPlan === 'IT Max' || rawPlan === 'IT Max Plus' ? rawPlan : 'IT Max';

  const memberId = (user as any)?.membershipId || 'ITM-9876-1234';
  const membershipValidTill =
    (user as any)?.membershipValidTill || '31 Dec 2025';

  // -------------- IMAGE PICKER HANDLERS ----------------
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please grant photo library permissions to upload a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });

      // handle new expo result shape (assets)
      const asset = (result as any).assets?.[0];
      const pickedUri = asset?.uri ?? (result as any).uri ?? null;
      const pickedBase64 = asset?.base64 ?? null;

      // ✅ use .canceled (new API), not .cancelled
      if (!result.canceled && pickedUri) {
        await uploadPhotoToServer(pickedUri, pickedBase64);
      }
    } catch (err) {
      console.error('Image pick error', err);
    }
  };

  const fetchLatestCustomerImage = async (inTownId: string | number) => {
    const res = await fetch(`https://api.intownlocal.com/IN/s3?customerId=${inTownId}`);
    if (!res.ok) {
      throw new Error(`Image fetch failed: ${res.status}`);
    }
    const data = await res.json();
    const images = Array.isArray(data?.s3ImageUrl) ? data.s3ImageUrl : [];
    if (!images.length) {
      throw new Error('No image URL returned from image fetch.');
    }
    const latestImage = images[images.length - 1];
    await AsyncStorage.setItem('user_profile_image', latestImage);
    await AsyncStorage.setItem('customer_profile_images', JSON.stringify(images));
    setProfileImage(latestImage);
  };

  const buildImageFormData = async (uri: string, fileName: string) => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      formData.append(
        'file',
        {
          uri,
          name: fileName,
          type: 'image/jpeg',
        } as any
      );
    }
    return formData;
  };

  const uploadPhotoToServer = async (uri: string, base64?: string | null) => {
    setUploading(true);
    try {
      const inTownId =
        (await AsyncStorage.getItem('customer_id')) ??
        (user?.id ?? null);
      if (!inTownId) {
        throw new Error('Missing customer id for image upload.');
      }

      const uploadUrl = `https://api.intownlocal.com/IN/s3/upload?userType=IN_CUSTOMER&inTownId=${inTownId}`;
      const fileName = `customer_${inTownId}_${Date.now()}.jpg`;
      const formData = await buildImageFormData(uri, fileName);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
      const raw = await res.text();
      let parsed: any = raw;
      try {
        parsed = raw ? JSON.parse(raw) : raw;
      } catch {
        // keep raw string if not JSON
      }
      if (!res.ok) {
        throw new Error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
      }
      const uploadedUrl = Array.isArray(parsed)
        ? parsed[parsed.length - 1]?.url
        : parsed?.url;
      const resolvedImage = uploadedUrl || uri;
      await AsyncStorage.setItem('user_profile_image', resolvedImage);
      setProfileImage(resolvedImage);
      // Do not override with GET s3 response; use upload response URL
    } catch (err) {
      console.error('Upload error', err);
      Alert.alert('Upload failed', 'Unable to update profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------------------------------



  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView ref={contentScrollRef} showsVerticalScrollIndicator={false}>


          {/* HEADER */}
          <View style={styles.header}>
          
            {/* LOCATION */}
            <TouchableOpacity
              style={styles.locationSection}
              onPress={() => setShowLocationModal(true)}
            >
              <View style={styles.locationIconBox}>
              <MaterialIcons name="location-on" size={24} color="#FF8C00" />
              </View>

              <View>
                <Text style={styles.locationLabel}>YOUR LOCATION</Text>
                <Text style={styles.locationName}>
                  {getLocationDisplayText()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* RIGHT ICONS */}
            <View style={styles.headerIcons}>

              {/* Notification */}
              <TouchableOpacity style={styles.notificationIconBtn}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleDropdown();
                }}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <Ionicons name="person-outline" size={22} color="#FF8C00" />
                )}
              </TouchableOpacity>

            </View>

          </View>

          {/* Membership Banner */}
          {/* <View style={styles.membershipBanner}>
            <Ionicons name="ribbon-outline" size={18} color="#FF8C00" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.membershipBannerTitle}>{currentPlan} Customer</Text>
              <Text style={styles.membershipBannerSubtitle}>
                Enjoy instant savings at partnered local shops.
              </Text>
            </View>
          </View> */}



          {/* SEARCH */}
          <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
            <View style={styles.searchContainer}>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={24} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder=""
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);

                    if (text.trim().length > 0) {
                      const combined = [...SEARCH_ITEMS, ...SEARCH_PRODUCTS];
                      const filtered = combined.filter(item =>
                        item.toLowerCase().includes(text.toLowerCase())
                      );

                      setSuggestions(filtered);
                      setShowSuggestions(true);
                    } else {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => {
                    router.push('/search');
                  }}

                  onBlur={() => {
                    setIsSearchFocused(false);
                  }}
                  onSubmitEditing={handleSearch}
                  placeholderTextColor="#999"
                />
                {/* FILTER BUTTON */}
                <TouchableOpacity style={styles.filterButton}>
                  <Ionicons name="options-outline" size={22} color="#FF8C00" />
                </TouchableOpacity>
                {searchQuery.length === 0 && (
                  <View pointerEvents="none" style={styles.animatedPlaceholder}>
                    <Text style={styles.animatedPlaceholderPrefix}>Search for </Text>
                    <Animated.Text
                      style={[
                        styles.animatedPlaceholderWord,
                        { opacity: placeholderOpacity, transform: [{ translateY: placeholderTranslateY }] },
                      ]}
                    >
                      {placeholderItems[placeholderIndex]}
                    </Animated.Text>
                  </View>
                )}
              </View>
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={`${item}-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(item);
                        setShowSuggestions(false);

                        router.push({
                          pathname: '/member-shop-list',
                          params: { query: item, source: 'member' },
                        });
                      }}
                    >
                      <Ionicons name="search" size={16} color="#666" />
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* ===== MEMBER CAROUSEL ===== */}
          {/* <View style={styles.carouselWrapper}>
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
              {MEMBER_CAROUSEL_IMAGES.map((img, index) => (
                <View key={index} style={styles.carouselSlide}>
                  <Image source={img} style={styles.carouselImage} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.carouselDots}>
              {MEMBER_CAROUSEL_IMAGES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    carouselIndex === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View> */}
          {/* === END MEMBER CAROUSEL === */}

          {/* EXCLUSIVE OFFER BANNER */}
          {/* <View style={styles.offerBanner}>
  <View style={styles.offerTag}>
    <Text style={styles.offerTagText}>EXCLUSIVE OFFER</Text>
  </View>

  <Text style={styles.offerTitle}>Accountability by InTown</Text>

  <Text style={styles.offerSubtitle}>
    Unlock verified savings at 200+ local partners.
  </Text>
</View> */}
          {/* SUMMARY SECTION */}
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            <Text style={[styles.sectionTitle, { margin: 0, fontSize: 18 }]}>INtown Savings</Text>
          </View>
          <View style={styles.summarySection}>
            {/* <Text style={styles.sectionTitle}>Savings History </Text> */}
            {/* <Text style={styles.normalText}>(Depends on Participating at Stores):</Text> */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Today </Text>
                <Text style={styles.summaryValue}>{todaySavedAmount.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Month</Text>
                <Text style={styles.summaryValue}>{monthSavedAmount.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Year</Text>
                <Text style={styles.summaryValue}>{yearSavedAmount.toFixed(0)}</Text>
              </View>
            </View>
          </View>

          

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {isTransactionsLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#FF8C00" />
              </View>
            ) : transactions.length > 0 ? (
              transactions.slice(0, 10).map((transaction) => (
                <TransactionRow
                  key={transaction.transactionId}
                  transaction={transaction}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            )}
          </View>

          {/* CATEGORIES */}
          <View style={styles.section}>

            {/* TITLE ROW */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Feature Categories</Text>

              {/* <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity> */}
            </View>

            <ScrollView
              ref={categoriesScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CATEGORY_CARD_WIDTH + CATEGORY_CARD_GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.categoriesCarouselContent}
              onScrollBeginDrag={stopCategoriesAutoScroll}
            >
              {categoryColumns.map((column, columnIndex) => (
                <View key={`col-${columnIndex}`} style={styles.categoryColumn}>
                  {column.map((category, rowIndex) => {
                    const index = columnIndex * 2 + rowIndex;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.categoryCard}
                        onPress={() => handleCategoryClick(category)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.categoryImageContainer}>
                          <Image
                            source={getCategoryImage(category, index)}
                            style={styles.categoryImage}
                            resizeMode="cover"
                          />
                        </View>
                        <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/search')}
              >
                <Ionicons name="search" size={24} color="#FF8C00" />
                <Text style={styles.actionText}>Find Shops</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Ionicons name="gift" size={24} color="#FF8C00" />
                <Text style={styles.actionText}>My Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Ionicons name="card" size={24} color="#FF8C00" />
                <Text style={styles.actionText}>Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setShowSupportModal(true);
                }}
              >
                <Ionicons name="help-circle" size={24} color="#FF8C00" />
                <Text style={styles.actionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NEARBY SHOPS */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Shops</Text>

            <ScrollView
              ref={nearbyScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.nearbyCarouselContent}
              onScrollBeginDrag={stopNearbyAutoScroll}
            >
              {nearbyShops.map((shop, index) => (
                <TouchableOpacity
                  key={`${shop.id}-${index}`}
                  style={styles.shopCard}
                  onPress={() =>
                    router.push({
                      pathname: '/member-shop-details',
                      params: { shopId: shop.id, shop: JSON.stringify(shop) },
                    })
                  }
                >
                  <View style={styles.shopImagePlaceholder}>
                    {(() => {
                      const urls = extractImageUrls(shop.image ?? shop.s3ImageUrl);
                      const uri = urls[0] ?? (typeof shop.image === 'string' ? shop.image : null);
                      return uri ? (
                        <Image source={{ uri }} style={styles.shopImageThumb} />
                      ) : (
                        <Ionicons name="storefront" size={40} color="#FF8C00" />
                      );
                    })()}
                  </View>

                  <Text style={styles.shopCardName} numberOfLines={1}>
                    {shop.businessName || shop.shopName || shop.contactName || 'Shop'}
                  </Text>

                  <Text style={styles.shopCardCategory}>
                    {shop.businessCategory || 'General'}
                  </Text> */}

          {/* <View style={styles.shopCardFooter}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFA500" />
                      <Text style={styles.ratingText}>
                        {shop.rating ?? '4.0'}
                      </Text>
                    </View> */}

          {/* <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={14} color="#FF8C00" />
                      <Text style={styles.distanceText}>
                        {formatDistance(
                          typeof shop.distance === 'number' ? shop.distance : null
                        )}
                      </Text>
                    </View>
                 
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View> */}

          {/* FOOTER */}
          <Footer dashboardType="member" />
        </ScrollView>

        {/* Support Modal */}
        <Modal
          visible={showSupportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSupportModal(false)}
        >
          <View style={styles.supportModalOverlay}>
            <View style={styles.supportModalContent}>
              <Image
                source={{ uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/app_logo/intown-logo.jpg' }}
                style={styles.supportLogo}
              />
              <Text style={styles.supportTitle}>INtown Customer Support</Text>
              <Text style={styles.supportText}>Phone: 9390932585</Text>
              <Text style={styles.supportText}>Email: support@intownlocal.com</Text>
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => setShowSupportModal(false)}
              >
                <Text style={styles.supportButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* All Transactions Modal */}
        <Modal
          visible={showAllTransactions}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAllTransactions(false)}
        >
          <View style={styles.transactionsModalOverlay}>
            <View style={styles.transactionsModalContent}>
              <View style={styles.transactionsModalHeader}>
                <Text style={styles.transactionsModalTitle}>All Transactions</Text>
                <TouchableOpacity
                  onPress={() => setShowAllTransactions(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TransactionRow
                      key={`all-${transaction.transactionId}`}
                      transaction={transaction}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={48} color="#CCCCCC" />
                    <Text style={styles.emptyText}>No transactions yet</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* BACKDROP */}
        {showDropdown && (
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}

        {/* MEMBER DROPDOWN PANEL */}
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
                  source={getProfileImageSource(profileImage) as any}
                  style={styles.panelAvatar}
                />
              ) : (
                <View style={styles.panelAvatarPlaceholder}>
                  <Ionicons name="person" size={22} color="#fff" />
                </View>
              )}


              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userPanelName}>{customerName || user?.name || 'Member'}</Text>
                <Text style={styles.userPanelPhone}>{(user as any)?.phone ?? (user as any)?.email ?? ''}</Text>
                <Text style={styles.userPanelTag}>Plan: {currentPlan}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push({ pathname: '/account' as any });

              }}
            >
              <Ionicons name="person-outline" size={22} color="#FF8C00" />
              <Text style={styles.userPanelText}>My Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/member-card');
              }}
            >
              <Ionicons name="card-outline" size={22} color="#FF8C00" />
              <Text style={styles.userPanelText}>Customer Card</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront-outline" size={22} color="#FF8C00" />
              <Text style={styles.userPanelText}>Become a Merchant</Text>
            </TouchableOpacity>








            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#FF0000" />
              <Text style={[styles.userPanelText, { color: '#FF0000' }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

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
                <Ionicons name="close" size={24} color="#FF8C00" />
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
              <ActivityIndicator size="small" color="#FF8C00" style={{ marginTop: 12 }} />
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
                  <Ionicons name="locate" size={20} color="#FF8C00" />
                  <Text style={styles.useCurrentLocationText}>
                    {isLocationLoading ? 'Getting location...' : 'Use Current Location'}
                  </Text>
                  {isLocationLoading && <ActivityIndicator size="small" color="#FF8C00" style={{ marginLeft: 8 }} />}
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
  container: { 
    flex: 1, 
    backgroundColor: "rgba(248,247,245,1)", 
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
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
    color: '#FF8C00',
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
    borderColor: '#FF8C00',
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
    borderColor: '#FF8C00',
    marginLeft: 10,
  },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  userPhone: { fontSize: 10, color: '#666666', marginTop: 2 },

  membershipBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBannerTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  membershipBannerSubtitle: { fontSize: 11, color: '#555' },

  memberCard: {
    margin: 16,
    backgroundColor: '#1A237E',
    borderRadius: 16,
    padding: 16,
  },
  memberCardLeft: { flex: 1 },
  memberCardLabel: { fontSize: 11, color: '#C5CAE9' },
  memberCardValue: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // avatar + upload
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#283593',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C53A1',
  },
  avatar: { width: '100%', height: '100%' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

  searchContainer: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  animatedPlaceholder: {
    position: 'absolute',
    left: 52,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedPlaceholderPrefix: {
    ...FontStylesWithFallback.body,
    color: '#999999',
  },
  animatedPlaceholderWord: {
    ...FontStylesWithFallback.body,
    color: '#FF8C00',
    fontWeight: '500',
  },

  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, color: '#1A1A1A' },

  categoriesAutoScrollContainer: {
    overflow: 'hidden',
  },
  categoriesAutoScrollContent: {
    flexDirection: 'row',
  },
  categoriesCarouselContent: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingRight: 12,
  },
  categoryColumn: {
    width: 100,
    marginRight: 12,
  },
  categoryCard: {
    width: 100,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  categoryName: {
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 6,
    width: 100,
    height: 28,
  },

  summarySection: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 18,
    marginHorizontal: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    paddingVertical: 18,
    marginHorizontal: 6,
    borderRadius: 18,   // bigger rounded curve
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  summaryLabel: {
    ...FontStylesWithFallback.caption,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
  },

  transactionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: {
    color: "#FF8C00",
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '600',
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
    alignItems: 'flex-start',
    flex: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditIcon: {
    backgroundColor: '#E8F5E9',
  },
  debitIcon: {
    backgroundColor: '#FFEBEE',
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
    minWidth: 62,
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
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#9E9E9E',
    marginTop: 10,
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  actionButton: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    textAlign: 'center',
  },

  autoScrollContainer: { overflow: 'hidden' },
  autoScrollContent: { flexDirection: 'row' },
  nearbyCarouselContent: {
    paddingRight: 12,
  },

  shopCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopImageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  shopCardName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginTop: 8 },
  shopCardCategory: { fontSize: 12, color: '#777', marginTop: 2 },
  shopCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, marginLeft: 4 },
  distanceContainer: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 12, marginLeft: 4 },

  footer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
  },
  footerTagline: { fontSize: 18, color: '#FF8C00', fontWeight: '700', textAlign: 'center' },
  footerDescription: { color: '#ccc', fontSize: 14, textAlign: 'center', marginVertical: 16 },
  footerCopyright: { fontSize: 12, color: '#999' },

  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  supportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  supportModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  supportLogo: {
    width: '60%',
    height: 85,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    textAlign: 'center',
  },
  supportButton: {
    marginTop: 16,
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  userPanelName: { fontSize: 14, fontWeight: '700' },
  userPanelPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  userPanelTag: { fontSize: 12, color: '#FF8C00', marginTop: 2, fontWeight: '600' },

  userPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  userPanelText: { fontSize: 15, marginLeft: 12, color: '#333' },
  suggestionBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    zIndex: 20,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginVertical: 8,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },

  headerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },

  headerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  panelAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== MEMBER CAROUSEL STYLES =====
  carouselWrapper: {
    marginTop: 12,
    marginBottom: 8,
  },

  carouselSlide: {
    width: SLIDE_WIDTH,
    alignItems: 'center',
  },

  carouselImage: {
    width: SLIDE_WIDTH - 32,
    maxHeight: 'fit-content' as any,
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: '#eee',
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
    backgroundColor: '#FF8C00',
  },
  // =================================

  // Location Modal Styles
  locationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  locationModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    height: '50%',
    maxHeight: 400,
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
    color: '#FF8C00',
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
  normalText: {
    fontWeight: 'normal',
    color: '#666',
  },
  offerBanner: {
    backgroundColor: '#FF7A00',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 18,
    borderRadius: 18,
  },

  offerTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },

  offerTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  offerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },

  offerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.95,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE8D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  locationLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },

  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    maxWidth: 200,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    backgroundColor: "#fff",
  },
  filterButton: {
    padding: 6,
    marginLeft: 6,
  },
  notificationIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },



});
