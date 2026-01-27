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
} from 'react-native';
import {
  CATEGORY_IMAGE_LIST,
  FALLBACK_CATEGORY_IMAGE,
} from '../utils/categoryImageList';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import {
  getCategories,
  getNearbyShops,
  getNearbyShopsByCategory,
} from '../utils/api';


import {
  getUserLocationWithDetails,
  searchLocations,
  setManualLocation
} from '../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer'
import { CATEGORY_ICON_MAP } from '../utils/categoryIconMap';
import { FontStylesWithFallback } from '../utils/fonts';



const { width } = Dimensions.get('window');

// ===== MEMBER CAROUSEL CONFIG =====
const SLIDE_WIDTH = Math.round(width);
const CAROUSEL_HEIGHT = 160;

const MEMBER_CAROUSEL_IMAGES = [
 {uri: 'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage1.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage2.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage3.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage4.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage5.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage6.png'},
    {uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/CarouselImage7.png'},

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
  merchantName: string;
  totalBillAmount: number;
  savedAmount: number;
  finalPaidAmount: number;
  transactionDate: string;
}

interface ApiSummary {
  totalBillAmount: number;
  totalSavedAmount: number;
  totalPaidAmount: number;
  transactionCount: number;
}

const TransactionRow = ({
  transaction,
}: {
  transaction: ApiTransaction;
}) => (
  <View style={styles.transactionRow}>
    <View style={styles.transactionLeft}>
      <Text style={styles.transactionMerchant} numberOfLines={1}>
        {transaction.merchantName}
      </Text>
      <Text style={styles.transactionDate}>
        {formatTransactionDate(transaction.transactionDate)}
      </Text>
    </View>
    <View style={styles.transactionRight}>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Bill</Text>
        <Text style={styles.transactionAmountValue}>
          ₹{transaction.totalBillAmount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Saved</Text>
        <Text style={styles.transactionAmountValue}>
          ₹{transaction.savedAmount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.transactionAmountBlock}>
        <Text style={styles.transactionAmountLabel}>Paid</Text>
        <Text style={styles.transactionAmountValue}>
          ₹{transaction.finalPaidAmount.toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);
const getCategoryImageByIndex = (index: number) => {
  return CATEGORY_IMAGE_LIST[index] ?? FALLBACK_CATEGORY_IMAGE;
};

const formatTransactionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function MemberDashboard() {
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
  // Nearby shops (REAL API)
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);


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
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


  const scrollX = useRef(new Animated.Value(0)).current;
  const categoryScrollX = useRef(new Animated.Value(0)).current;
  const placeholderAnim = useRef(new Animated.Value(0)).current;
  const contentScrollRef = useRef<ScrollView | null>(null);
  const CARD_WIDTH = 172;


  const CATEGORY_CARD_WIDTH = 100;
  const CATEGORY_CARD_GAP = 12;

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // ===== MEMBER CAROUSEL STATE =====
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);
  // ================================


  useEffect(() => {
    loadCategories();
    loadUserType();
    requestLocationOnMount();
    // load cached local photo if exists
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('member_photo_uri');
        if (saved) setPhotoUri(saved);
      } catch (e) {
        // ignore
      }

    })();

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

  //  Call nearby shops API when location is available
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadNearbyShops();
    }
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    if (nearbyShops.length > 0) {
      startAutoScroll(nearbyShops.length);
    }
  }, [nearbyShops.length]);



  useEffect(() => {
    if (categories.length === 0) return;

    const totalWidth =
      categories.length * (CATEGORY_CARD_WIDTH + CATEGORY_CARD_GAP);

    categoryScrollX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(categoryScrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 30,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [categories, CATEGORY_CARD_GAP, CATEGORY_CARD_WIDTH, categoryScrollX]);

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
    const loadCustomerId = async () => {
      try {
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

    loadCustomerId();
  }, [params.customerId]);

  useEffect(() => {
    const effectiveCustomerId = customerId ?? user?.id;
    if (!effectiveCustomerId) return;

    const fetchTransactions = async () => {
      setIsTransactionsLoading(true);
      try {
        const res = await fetch(
          `https://devapi.intownlocal.com/IN/transactions/customers/${effectiveCustomerId}`,
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
    const storedLocation = useLocationStore.getState().location;
    if (!storedLocation) {
      setTimeout(async () => {
        const locationResult = await getUserLocationWithDetails();
        if (!locationResult) {
          Alert.alert(
            'Location Access',
            'Please enable location access to see nearby shops.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Set Manually', onPress: () => setShowLocationModal(true) }
            ]
          );
        }
      }, 1000);
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


      // Backend response format: { data: [...] }
      setNearbyShops(Array.isArray(response) ? response : []);

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
    },
  });
};






  const startAutoScroll = (count: number) => {
    if (count <= 1) return;

    const totalWidth = count * CARD_WIDTH;
    scrollX.setValue(0);

    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: totalWidth * 50,
        useNativeDriver: true,
      })
    ).start();
  };


  const todaySavedAmount = periodTotals.today?.totalSavedAmount ?? 0;
  const monthSavedAmount = periodTotals.thisMonth?.totalSavedAmount ?? 0;
  const yearSavedAmount = periodTotals.thisYear?.totalSavedAmount ?? 0;

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await AsyncStorage.clear();
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
      router.push({ pathname: '/member-shop-list', params: { query: searchQuery } });
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
      });

      // handle new expo result shape (assets)
      const pickedUri =
        (result as any).assets?.[0]?.uri ??
        (result as any).uri ??
        null;

      // ✅ use .canceled (new API), not .cancelled
      if (!result.canceled && pickedUri) {
        setPhotoUri(pickedUri);
        await AsyncStorage.setItem('member_photo_uri', pickedUri); // cache locally
        uploadPhotoToServer(pickedUri);
      }
    } catch (err) {
      console.error('Image pick error', err);
    }
  };

  const uploadPhotoToServer = async (uri: string) => {
    setUploading(true);
    try {
      const form = new FormData();
      const filename = uri.split('/').pop() ?? 'photo.jpg';

      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // @ts-ignore — FormData file object
      form.append('photo', {
        uri,
        name: filename,
        type,
      });

      // Replace with your real API if needed
      const uploadUrl = 'https://your-api.example.com/members/upload-photo';

      /*
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: form,
      });
      const json = await res.json();
      console.log('Upload result', json);
      */

      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error('Upload error', err);
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
              onPress={(e) => {
                e.stopPropagation();
                toggleDropdown();
              }}
              style={styles.profileButton}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name ?? 'Member'}</Text>
                <Text style={styles.userPhone}>
                  {(user as any)?.phone ?? (user as any)?.email ?? ''}
                </Text>
              </View>
              <Ionicons
                name="person"
                size={20}
                color="#ff6600"
                style={styles.profileIconButton}
              />
            </TouchableOpacity>
          </View>

          {/* Membership Banner */}
          <View style={styles.membershipBanner}>
            <Ionicons name="ribbon-outline" size={18} color="#FF6600" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.membershipBannerTitle}>{currentPlan} Member</Text>
              <Text style={styles.membershipBannerSubtitle}>
                Enjoy instant savings at partnered local shops.
              </Text>
            </View>
          </View>



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
                          params: { query: item },
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
          </View>
          {/* === END MEMBER CAROUSEL === */}




          {/* CATEGORIES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.categoriesAutoScrollContainer}>
              <Animated.View
                style={[
                  styles.categoriesAutoScrollContent,
                  { transform: [{ translateX: categoryScrollX }] },
                ]}
              >
                {[...categories, ...categories].map((category, index) => (
                 <TouchableOpacity
  key={`${category.id}-${index}`}
  style={styles.categoryCard}
  onPress={() => handleCategoryClick(category)}
  activeOpacity={0.8}
>

                    <View style={styles.categoryImageContainer}>
                      <Image
                        source={getCategoryImageByIndex(index % categories.length)}
                        style={styles.categoryImage}
                        resizeMode="cover"
                      />
                      <View style={styles.categoryGradient} />
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* SUMMARY SECTION */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Today's Savings </Text>
                <Text style={styles.summaryValue}>₹{todaySavedAmount.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Month's Savings</Text>
                <Text style={styles.summaryValue}>₹{monthSavedAmount.toFixed(0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Year's Savings</Text>
                <Text style={styles.summaryValue}>₹{yearSavedAmount.toFixed(0)}</Text>
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
                <ActivityIndicator size="small" color="#FF6600" />
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

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/search')}
              >
                <Ionicons name="search" size={24} color="#FF6600" />
                <Text style={styles.actionText}>Find Shops</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Ionicons name="gift" size={24} color="#FF6600" />
                <Text style={styles.actionText}>My Rewards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Ionicons name="card" size={24} color="#FF6600" />
                <Text style={styles.actionText}>Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setShowSupportModal(true);
                }}
              >
                <Ionicons name="help-circle" size={24} color="#FF6600" />
                <Text style={styles.actionText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* NEARBY SHOPS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Shops</Text>

            <View style={styles.autoScrollContainer}>
              <Animated.View
                style={[
                  styles.autoScrollContent,
                  { transform: [{ translateX: scrollX }] },
                ]}
              >
                {[...nearbyShops, ...nearbyShops].map((shop, index) => (

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
                      <Ionicons name="storefront" size={40} color="#FF6600" />
                    </View>

                    <Text style={styles.shopCardName} numberOfLines={1}>
                      {shop.shopName || shop.merchantName || 'Shop'}
                    </Text>

                    <Text style={styles.shopCardCategory}>
                      {shop.businessCategory || 'General'}
                    </Text>

                    <View style={styles.shopCardFooter}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFA500" />
                        <Text style={styles.ratingText}>
                          {shop.rating ?? '4.0'}
                        </Text>
                      </View>

                      <View style={styles.distanceContainer}>
                        <Ionicons name="location" size={14} color="#FF6600" />
                        <Text style={styles.distanceText}>
                          {shop.distance ? `${shop.distance.toFixed(2)} km` : 'Nearby'}
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* FOOTER */}
          <Footer />
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
                source={require('../assets/images/intown-logo.jpg')}
                style={styles.supportLogo}
              />
              <Text style={styles.supportTitle}>Intown Customer Support</Text>
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
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.panelAvatar} />
              ) : (
                <View style={styles.panelAvatarPlaceholder}>
                  <Ionicons name="person" size={22} color="#fff" />
                </View>
              )}


              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userPanelName}>{user?.name ?? 'Member'}</Text>
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
              <Ionicons name="person-outline" size={22} color="#FF6600" />
              <Text style={styles.userPanelText}>My Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/member-card');
              }}
            >
              <Ionicons name="card-outline" size={22} color="#FF6600" />
              <Text style={styles.userPanelText}>Member Card</Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront-outline" size={22} color="#FF6600" />
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
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  userPhone: { fontSize: 10, color: '#666666', marginTop: 2 },

  membershipBanner: {
    marginHorizontal: 16,
    marginTop: 8,
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
    backgroundColor: '#FF6600',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
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
    color: '#ff6600',
    fontWeight: '500',
  },

  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1A1A1A' },

  categoriesAutoScrollContainer: {
    overflow: 'hidden',
  },
  categoriesAutoScrollContent: {
    flexDirection: 'row',
  },
  categoryCard: {
    width: 100,
    height: 100,
    marginRight: 12,
  },
  categoryImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
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
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  summarySection: {
    backgroundColor: '#ff6600',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },
  summaryValue: {
    ...FontStylesWithFallback.h3,
    color: '#fe6f09',
    fontWeight: '700',
    marginTop: 6,
  },

  transactionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6600',
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
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
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
  footerTagline: { fontSize: 18, color: '#FF6600', fontWeight: '700', textAlign: 'center' },
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
    backgroundColor: '#FF6600',
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
  userPanelName: { fontSize: 16, fontWeight: '700' },
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
    backgroundColor: '#FF6600',
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
    backgroundColor: '#FF6600',
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
    height: 160,
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
    backgroundColor: '#FF6600',
  },
  // =================================

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
