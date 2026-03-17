// user-dashboard.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Footer from '../components/Footer';
import {
  CATEGORY_IMAGE_LIST,
  FALLBACK_CATEGORY_IMAGE,
} from '../utils/categoryImageList';



import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  Animated,
  Image,
  Easing,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useLocationStore, LocationDetails } from '../store/locationStore';
import { getPlans, getCategories, getNearbyShops, getMerchantImageByShopId, extractImageUrls } from '../utils/api';

import {
  getUserLocationWithDetails,
  searchLocations,
  setManualLocation,
  DEFAULT_LOCATION
} from '../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FontStylesWithFallback } from '../utils/fonts';
import { formatDistance } from '../utils/formatDistance';

interface Plan {
  id: string;
  name: string;
  pricePerMonth: number;
  benefits: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}
const { width } = Dimensions.get('window');
// ===== MEMBER STYLE CAROUSEL CONFIG =====
const SLIDE_WIDTH = Math.round(width);
const getCategoryImage = (category: any, index: number) => {
  if (category?.imageUrl) {
    return { uri: category.imageUrl };
  }
  return CATEGORY_IMAGE_LIST[index] ?? FALLBACK_CATEGORY_IMAGE;
};




// ------------------- RESPONSIVE CAROUSEL DIMENSION ADJUSTMENT -------------------
const slideWidth = Math.round(width);


const CAROUSEL_NATIVE_HEIGHT = 160;

const CAROUSEL_ASPECT_RATIO = width > 800 ? 3 / 1 : 4 / 3;



const CAROUSEL_HEIGHT =
  Platform.OS === 'web'
    ? slideWidth / CAROUSEL_ASPECT_RATIO
    : CAROUSEL_NATIVE_HEIGHT;

// ---------------------------------------------------------------------------------

export default function UserDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string }>();
  const { user, logout } = useAuthStore();
  const [userType, setUserType] = useState<string>('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);





  const DUMMY_NEARBY_SHOPS = [
    { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5 },
    { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8 },
    { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2 },
    { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3 },
    { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5 },
    { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0 },
  ];

  const DUMMY_CATEGORIES = [
    { id: '1', name: 'Grocery', icon: 'storefront' },
    { id: '2', name: 'Salon', icon: 'cut' },
    { id: '3', name: 'Restaurant', icon: 'restaurant' },
    { id: '4', name: 'Pharmacy', icon: 'medical' },
    { id: '5', name: 'Fashion', icon: 'shirt' },
    { id: '6', name: 'Electronics', icon: 'phone-portrait' },
  ];

  // ----------------- CAROUSEL IMAGES (FIXED for Web compatibility) -----------------

  // ---------------------------------------------------------------------------------


  const location = useLocationStore((state) => state.location);
  const isLocationLoading = useLocationStore((state) => state.isLoading);
  const setLocationInStore = useLocationStore((state) => state.setLocation);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);

  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>(DUMMY_CATEGORIES);
  // Nearby shops (real API)
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);


  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Dropdown animation value
  const dropdownAnim = useRef(new Animated.Value(0)).current;



  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);

  const carouselRef = useRef<ScrollView | null>(null);
  const autoPlayTimer = useRef<number | null>(null);
  const categoriesScrollRef = useRef<ScrollView | null>(null);
  const nearbyScrollRef = useRef<ScrollView | null>(null);

  // ================= CAROUSEL IMAGES FROM S3 =================
  // const loadCarouselImages = () => {
  //   setCarouselImages([
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner1.jpg',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner2.png',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner3.png',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner4.png',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner5.png',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner6.png',
  //     'https://intown-dev.s3.ap-south-1.amazonaws.com/CarouselImages/Banner7.png',

  //   ]);
  // };
  // ==========================================================


  const placeholderAnim = useRef(new Animated.Value(0)).current;
  const CATEGORY_CARD_WIDTH = 100;
  const CATEGORY_CARD_GAP = 12;
  const CARD_WIDTH = 172; // 160 + 12 (margin)



  useEffect(() => {
    loadData();
    loadUserType();
    loadProfileImage();

    requestLocationOnMount();

    // loadCarouselImages(); 
  }, []);
  useEffect(() => {
    if (carouselImages.length === 0) return;

    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % carouselImages.length;
        carouselRef.current?.scrollTo({
          x: next * SLIDE_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [carouselImages]);

  const stopCategoriesAutoScroll = () => { };
  const stopNearbyAutoScroll = () => { };

  const categoryColumns = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryColumns.push(categories.slice(i, i + 2));
  }


  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadNearbyShops();
    }
  }, [location?.latitude, location?.longitude]);


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

  const placeholderItems = [
    'Grocery',
    'Salon',
    'Fashion',
    'Vegetables',
    'Fruits',
    'Restaurant',
    'Pharmacy',
    'Electronics',
  ];
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

  // Request location permission on mount
  const requestLocationOnMount = async () => {
    // Load stored location first for instant display
    await loadLocationFromStorage();

    // Always try to get fresh location in background
    try {
      const locationResult = await getUserLocationWithDetails();
      if (!locationResult) {
        // Only alert if no stored location either
        const storedLocation = useLocationStore.getState().location;
        if (!storedLocation) {
          Alert.alert(
            'Location Access',
            'Please enable location access to see nearby shops and get personalized recommendations.',
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

  const loadUserType = async () => {
    try {
      // First check params, then AsyncStorage
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

  const loadProfileImage = async () => {
    try {
      const storedImage = await AsyncStorage.getItem('user_profile_image');
      if (storedImage) {
        setProfileImage(storedImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };



  const formatUserType = (type: string): string => {
    const lower = type.toLowerCase();
    if (lower === 'new_user' || lower === 'new' || lower === 'user') return 'User';
    if (lower.includes('customer')) return 'Customer';
    if (lower.includes('merchant')) return 'Merchant';
    if (lower === 'dual') return 'Customer & Merchant';
    return 'User';
  };


  useEffect(() => {
    // if user changes, hide dropdown
    setShowDropdown(false);
    dropdownAnim.setValue(0);
  }, [user]);




  const loadData = async () => {
    try {
      const [plansData, categoriesData] = await Promise.all([getPlans(), getCategories()]);
      setPlans(plansData || []);
      setCategories(categoriesData && categoriesData.length > 0 ? categoriesData : DUMMY_CATEGORIES);
    } catch (error) {
      console.error('Error loading data:', error);
      setPlans([]);
      setCategories(DUMMY_CATEGORIES);
    }
  };
  //  Load nearby shops using location only
  const loadNearbyShops = async () => {
    try {
      // location already comes from store
      if (!location?.latitude || !location?.longitude) return;

      const response = await getNearbyShops(
        location.latitude,
        location.longitude
      );

      // backend returns ARRAY, not { data: [] }
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
      console.error('Failed to load nearby shops', error);
      setNearbyShops([]);
    }
  };


  const calculateSavings = () => {
    const spend = parseFloat(monthlySpend) || 0;
    const monthlySavings = spend * 0.1;
    const annualSavings = monthlySavings * 12;
    return { monthlySavings, annualSavings };
  };

  const { monthlySavings, annualSavings } = calculateSavings();

  const handleLogout = () => {
    logout();
    // close dropdown with animation
    Animated.timing(dropdownAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setShowDropdown(false);
      router.replace('/login');
    });
  };

  const toggleDropdown = (e?: any) => {
    // prevent parent touch handlers
    e?.stopPropagation?.();
    if (!showDropdown) {
      setShowDropdown(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => setShowDropdown(false));
    }
  };

  const handleSearchChange = (text: string) => {
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
      setSuggestions([]);
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
      Alert.alert('Error', 'Could not get your current location. Please try again or enter manually.');
    }
  };

  // Get display location text
  const getLocationDisplayText = () => {
    if (isLocationLoading) return 'Getting location...';
    if (location?.area) return location.area;
    if (location?.city) return location.city;
    return 'Set Location';
  };


  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };




  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}

          <View style={styles.headerRow}>

            <TouchableOpacity
              style={styles.locationWrapper}
              onPress={() => setShowLocationModal(true)}
            >
              <View style={styles.locationIcon}>
              <MaterialIcons name="location-on" size={24} color="#FF8C00" />
              </View>

              <View>
                <Text style={styles.locationLabel}>YOUR LOCATION</Text>

                <Text style={styles.locationText}>
                  {getLocationDisplayText()}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerIcons}>

              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={24} color="#475569" />
              </TouchableOpacity>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleDropdown(e);
                  }}
                  style={styles.iconCircleActive}
                >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <Ionicons name="person-outline" size={20} color="#FF7A00" />
                )}
              </TouchableOpacity>

            </View>

          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>

            <Ionicons
              name="search-outline"
              size={24}
              color="#8A97A6"
              style={styles.searchIcon}
            />

            <TextInput
              style={styles.searchInput}
              placeholder=""
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => {
                router.push({ pathname: '/search', params: { source: 'user' } });
              }}
              onBlur={handleSearchBlur}
              placeholderTextColor="#999999"
            />

            {/* Filter Icon */}
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#FF7A00" />
            </TouchableOpacity>

            {searchQuery.length === 0 && (
              <View pointerEvents="none" style={styles.animatedPlaceholder}>
                <Text style={styles.animatedPlaceholderPrefix}>Search for </Text>

                <Animated.Text
                  style={[
                    styles.animatedPlaceholderWord,
                    {
                      opacity: placeholderOpacity,
                      transform: [{ translateY: placeholderTranslateY }],
                    },
                  ]}
                >
                  {placeholderItems[placeholderIndex]}
                </Animated.Text>
              </View>
            )}

          </View>

          {/* Search Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <TouchableOpacity style={styles.searchDropdownContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.searchDropdown}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item}-${index}`}
                    style={styles.searchDropdownItem}
                    onPress={() => {
                      setSearchQuery(item);
                      setShowSuggestions(false);
                      router.push({
                        pathname: '/member-shop-list',
                        params: { query: item, source: 'user' },
                      });
                    }}
                  >
                    <View style={styles.searchDropdownItemContent}>
                      <View style={styles.searchDropdownItemLeft}>
                        <Ionicons name="search" size={20} color="#FF8C00" />
                        <Text style={styles.searchDropdownItemText}>{item}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          )}
          {/* Exclusive Offer Card */}

          <View style={styles.offerCard}>

            <View style={styles.offerTag}>
              <Text style={styles.offerTagText}>VOCAL FOR LOCAL</Text>
            </View>

            <Text style={styles.offerTitle}>
              Shop Local, Save Local
            </Text>

            <Text style={styles.offerSubtitle}>
            Exclusive privilege access at nearby shops
            </Text>

          </View>



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
              {carouselImages.map((url, index) => (
                <View key={index} style={styles.carouselSlide}>
                  <Image
                    source={{ uri: url }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                </View>
              ))}

            </ScrollView>

            <View style={styles.carouselDots}>
              {carouselImages.map((_, i) => (

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


          {/* Popular Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Feature Categories</Text>

              {/* <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity> */}
            </View>

            {categories.length > 0 ? (
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
                  <View
                    key={`col-${columnIndex}`}
                    style={styles.categoryColumn}
                  >
                    {column.map((category, rowIndex) => {
                      const index = columnIndex * 2 + rowIndex;
                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={styles.categoryCard}
                          onPress={() => {
                            const id = category?.id ?? category?.name;
                            if (id == null || id === '') return;
                            router.push({
                              pathname: '/member-shop-list',
                              params: {
                                categoryId: String(id),
                                categoryName: String(category?.name ?? ''),
                                source: 'user',
                              },
                            });
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.categoryImageContainer}>
                            <Image
                              source={getCategoryImage(category, index)}
                              style={styles.categoryImage}
                              resizeMode="cover"
                            />
                          </View>
                          <Text style={styles.categoryName} numberOfLines={2}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noCategoriesText}>No categories available</Text>
            )}
          </View>

          {/* Savings Calculator */}

          <View style={styles.savingsCard}>

            {/* Title */}
            <View style={styles.savingsHeader}>
              <Ionicons name="calculator-outline" size={22} color="#FF7A00" />
              <Text style={styles.savingsTitle}>Savings Calculator</Text>
            </View>

            {/* Monthly Spend Label */}
            <Text style={styles.savingsLabel}>
              Estimated Monthly Spend
            </Text>

            {/* Input */}
            <View style={styles.inputBox}>
              <Text style={styles.currency}>₹</Text>

              <TextInput
                style={styles.savingsInput}
                keyboardType="numeric"
                value={monthlySpend}
                onChangeText={setMonthlySpend}
              />
            </View>

            {/* Savings Result Row */}
            <View style={styles.resultRow}>

              <View style={styles.monthlyBox}>
                <Text style={styles.resultLabel}>MONTHLY SAVINGS</Text>

                <Text style={styles.monthlyValue}>
                  ₹ {Math.floor(Number(monthlySpend) * 0.15)}
                </Text>
              </View>

              <View style={styles.annualBox}>
                <Text style={styles.annualLabel}>ANNUAL SAVINGS</Text>

                <Text style={styles.annualValue}>
                  ₹ {Math.floor(Number(monthlySpend) * 0.15 * 12)}
                </Text>
              </View>

            </View>

          </View>




          {/* Membership Plans */}
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>Customer Plans</Text> */}

            {/* Tab Navigation */}

            <View style={styles.toggleContainer}>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'customer' && styles.activeToggle
                ]}
                onPress={() => setActiveTab('customer')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    activeTab === 'customer' && styles.activeToggleText
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  activeTab === 'merchant' && styles.activeToggle
                ]}
                onPress={() => setActiveTab('merchant')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    activeTab === 'merchant' && styles.activeToggleText
                  ]}
                >
                  Merchant
                </Text>
              </TouchableOpacity>

            </View>

            {/* Customer Tab Content */}
            {activeTab === 'customer' && (
              <View style={styles.tabContent}>
                {/* Silver Plan */}
                <View style={styles.planCard}>
                  <Text style={styles.planName}>Silver</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}><s>₹399</s> Free</Text>
                    <Text style={styles.planDuration}>/ 3 months</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('/register-member')}
                  >
                    <Text style={styles.registerButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>

                {/* Gold Plan */}
                <View style={[styles.planCard, styles.popularPlan]}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                  <Text style={styles.planName}>Gold</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}><s>₹599</s> Free</Text>
                    <Text style={styles.planDuration}>/ 6 months</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.purchaseButton, styles.purchaseButtonPrimary]}
                    onPress={() => router.push('/register-member')}
                  >
                    <Text style={styles.purchaseButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>

                {/* Platinum Plan */}
                <View style={styles.planCard}>
                  <Text style={styles.planName}>Platinum</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}><s>₹999</s> Free</Text>
                    <Text style={styles.planDuration}>/ Year</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => router.push('/register-member')}
                  >
                    <Text style={styles.registerButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Merchant Tab Content */}
            {activeTab === 'merchant' && (
              <View style={styles.tabContent}>
                <View style={styles.merchantContent}>
                  <Text style={styles.merchantTagline}>"Local. Trusted. Rewarding."</Text>
                  <Text style={styles.merchantDescription}>
                    Grow your business with our merchant friendly platform that puts you in your control.
                  </Text>

                  <View style={styles.featuresList}>
                    {/* <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Zero Commissions</Text>
                    </View> */}
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Hassle free onboard</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Boost Walk-ins</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Control Your Offers</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Effective  Promotion</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.featureText}>Customer Loyalty</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.registerMerchantButton}
                    onPress={() => router.push('/register-merchant')}
                  >
                    <Text style={styles.registerMerchantButtonText}>Register as Merchant</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Nearby Shops Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Stores </Text>
            <Text style={styles.normalText}>(Based on Location):</Text>
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
                      params: {
                        shopId: shop.id,
                        shop: JSON.stringify(shop),
                        source: 'user',
                      },
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
                    {shop.businessCategory}
                  </Text>
                  <View style={styles.shopCardDistance}>
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

          {/* Footer */}
          <Footer dashboardType="user" />
        </ScrollView>

        {/* BACKDROP */}
        {showDropdown && (
          <TouchableWithoutFeedback onPress={() => toggleDropdown()}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}

        {/* Animated User Panel (Swiggy-style) */}
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
                  {
                    scale: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}
          >

            <View style={styles.userPanelHeader}>
  <View style={styles.panelAvatarPlaceholder}>
    {profileImage ? (
      <Image source={{ uri: profileImage }} style={{ width: 40, height: 40, borderRadius: 20 }} />
    ) : (
      <Ionicons name="person" size={22} color="#fff" />
    )}
  </View>

  <View style={{ marginLeft: 10 }}>
    {/* <Text style={styles.userPanelName}>
      {user?.name || 'User'}
    </Text> */}
<Text style={styles.userPanelTag}>
      User
    </Text>
    <Text style={styles.userPanelPhone}>
  {(user as any)?.phone || (user as any)?.mobile || (user as any)?.phoneNumber || ''}
</Text>

    
  </View>
</View>

<View style={styles.divider} />




            {/* MY ACCOUNT */}
            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                toggleDropdown();
                router.push('/account');
              }}
            >
              <Ionicons name="person-outline" size={20} color="#FF8C00" />
              <Text style={styles.userPanelText}>My Account</Text>
            </TouchableOpacity>

            {/* BECOME A Customer */}
            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                toggleDropdown();
                router.push('/register-member');
              }}
            >
              <Ionicons name="star-outline" size={20} color="#FF8C00" />
              <Text style={styles.userPanelText}>Become a Customer</Text>
            </TouchableOpacity>

            {/* BECOME A MERCHANT */}
            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                toggleDropdown();
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront-outline" size={20} color="#FF8C00" />
              <Text style={styles.userPanelText}>Become a Merchant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userPanelItem, { marginTop: 6 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#FF0000" />
              <Text style={[styles.userPanelText, { color: '#FF0000' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Registration Modal */}
      <Modal
        visible={showRegistrationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Registration Type</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-member');
              }}
            >
              <Ionicons name="person" size={24} color="#FF8C00" />
              <Text style={styles.modalButtonText}>Register as Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront" size={24} color="#FF8C00" />
              <Text style={styles.modalButtonText}>Register as Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRegistrationModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
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
            {/* Modal Header */}
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
                {/* Use Current Location Button */}
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

                {/* Current Location Display */}
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
    backgroundColor: "#F2F4F7",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ff00ff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 50,
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
    fontWeight: '700',
    flex: 1,
    color: "#0F172A",
    maxWidth: 200,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    ...FontStylesWithFallback.body,
    marginLeft: 12,
    fontWeight: '500',
  },
  profileInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  userName: {
    ...FontStylesWithFallback.bodySmall,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  userPhone: {
    ...FontStylesWithFallback.caption,
    color: '#666666',
    fontSize: 10,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },

  /* --- New userPanel styles (Swiggy-like) --- */
  userPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
    zIndex: 2000,
  },

  userPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },

  userPanelName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },

 userPanelPhone: {
  fontSize: 14,
  color: "#000",   
  marginTop: 2,
  fontWeight: "500",
},

  userPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  userPanelText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#333',
    fontWeight: '500',
  },
  /* --- end new userPanel styles --- */

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 52,
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...FontStylesWithFallback.body,
    color: '#1A1A1A',
  },
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
  searchHint: {
    ...FontStylesWithFallback.caption,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  searchDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  searchDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
  },
  searchDropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  searchDropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchDropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchDropdownItemText: {
    ...FontStylesWithFallback.body,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    display: 'flex',
    flexDirection: 'row',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    ...FontStylesWithFallback.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewButtonNavigate: {
    ...FontStylesWithFallback.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },








  // ---------- CAROUSEL STYLES ----------
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
  //----------------------------------------------

  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  normalText: {
    fontWeight: 'normal',
    color: '#666',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#e6e6e6',
  },
  activeTab: {
    backgroundColor: '#FF8C00',
  },
  tabText: {
    ...FontStylesWithFallback.bodyMedium,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 8,
  },
  merchantContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  merchantTagline: {
    ...FontStylesWithFallback.h3,
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  merchantDescription: {
    ...FontStylesWithFallback.body,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureText: {
    ...FontStylesWithFallback.body,
    color: '#1A1A1A',
    marginLeft: 12,
    fontWeight: '500',
  },
  registerMerchantButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  registerMerchantButtonText: {
    ...FontStylesWithFallback.buttonLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },

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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'transparent',
    backgroundImage: Platform.OS === 'web' ? 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))' : undefined,
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

  noCategoriesText: {
    ...FontStylesWithFallback.body,
    color: '#666666',
    textAlign: 'center',
    padding: 20,
  },

  themeSection: {
    backgroundColor: '#FF8C00',
    padding: 24,
    alignItems: 'center',
  },
  themeTitle: {
    ...FontStylesWithFallback.h2,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '800',
    fontSize: 32,
    textTransform: 'uppercase',
  },
  themeSubtitle: {
    ...FontStylesWithFallback.body,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'none',
  },

  calculatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calculatorRowLast: {
    marginBottom: 8,
  },
  calculatorLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  calculatorLabelNote: {
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '500',
    display: 'block' as any,
  },
  calculatorLabelSpend: {
    color: '#777777',
  },
  calculatorInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#777777',
    backgroundColor: '#e4e4e4',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 100,
    maxWidth: 110,
    textAlign: 'right',
  },
  calculatorValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  calculatorValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  calculatorHint: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
    width: '100%',
    textAlign: 'center',
  },
  calculatorHintContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    marginHorizontal: -16,
    marginBottom: -16,
    borderTopWidth: 1,
    borderTopColor: '#FF8C00',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  popularPlan: {
    borderColor: "#FF8A00",
    borderWidth: 2
  },
  popularBadge: {
    position: "absolute",
    right: -1,
    top: -1,
    backgroundColor: "#FF8A00",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8A00',
  },
  planDuration: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  strikePrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },

  freePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',      // BLACK color
  },

  planPeriod: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  planFeatures: {
    marginBottom: 16,
  },
  planFeatureText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  purchaseButton: {
    backgroundColor: "#FF8A00",
    borderRadius: 30,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#FF8A00",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  purchaseButtonPrimary: {
    backgroundColor: '#FF8C00',
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  merchantButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  autoScrollContainer: {
    overflow: 'hidden',
  },
  autoScrollContent: {
    flexDirection: 'row',
  },
  nearbyCarouselContent: {
    paddingRight: 12,
  },
  shopCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shopImageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  shopCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shopCardCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  shopCardDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopCardDistanceText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  footer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginLeft: 12,
  },
  modalCancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },

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
    height: '75%',
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
  distanceText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  offerCard: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    paddingRight: 160,
    borderRadius: 18,
    backgroundColor: "#FF8A00",
  },

  offerTag: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },

  offerTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  offerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },

  offerSubtitle: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 0,
    marginTop: 20,
  },
  viewAll: {
    color: "#FF8C00",
    fontWeight: "600",
  },

  savingsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },

  savingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  savingsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },

  savingsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    marginBottom: 10,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 30,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },

  currency: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 6,
  },

  savingsInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  monthlyBox: {
    flex: 1,
    backgroundColor: "#F7EFE6",
    borderRadius: 20,
    padding: 15,
    marginRight: 10,
  },

  annualBox: {
    flex: 1,
    backgroundColor: "#FF8A00",
    borderRadius: 20,
    padding: 15,
  },

  resultLabel: {
    fontSize: 11,
    color: "#666",
  },

  monthlyValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF8A00",
    marginTop: 5,
  },

  annualLabel: {
    fontSize: 11,
    color: "#fff",
  },

  annualValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 5,
  },


  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E9EEF5',
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 15,
    padding: 4,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },

  activeToggle: {
    backgroundColor: '#FFFFFF',
  },

  toggleText: {
    fontSize: 15,
    color: '#7A8A9A',
    fontWeight: '600',
  },

  activeToggleText: {
    color: '#000',
    fontWeight: '700',
  },


  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10
  },

  locationWrapper: {
    flexDirection: "row",
    alignItems: "center"
  },

  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFE9D6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },

  locationLabel: {
    fontSize: 11,
    color: "#8A97A6",
    fontWeight: "600"
  },



  headerIcons: {
    flexDirection: "row",
    alignItems: "center"
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },

  iconCircleActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FF7A00",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },

  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  registerButton: {
    backgroundColor: "#E5E8ED",
    borderRadius: 30,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15
  },

  registerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A"
  },
   panelAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
userPanelTag: {
  fontSize: 14,
  color: "#000",
  fontWeight: "500",
  marginTop: 2,
},
divider: {
  height: 1,
  backgroundColor: "#E5E7EB",
  marginVertical: 12,
},

});
