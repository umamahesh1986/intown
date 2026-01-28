import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  RefreshControl,
  FlatList,
  Platform,
  Image,
  Easing,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useFocusEffect } from '@react-navigation/native';
import Footer from '../components/Footer';
import { getNearbyShops } from '../utils/api';
import { 
  getUserLocationWithDetails, 
  searchLocations, 
  setManualLocation 
} from '../utils/location';
import { formatDistance } from '../utils/formatDistance';

const { width } = Dimensions.get('window');

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

/* ===============================
   INTERFACES
================================ */
interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed';
}

interface CustomerTransaction {
  transactionId: number;
  merchantName: string;
  totalBillAmount: number;
  savedAmount: number;
  finalPaidAmount: number;
  transactionDate: string;
}

interface MerchantSale {
  transactionId: number;
  customerName: string;
  customerPhone: string;
  totalSalesValue: number;
  totalDiscountGiven: number;
  totalAmountReceived: number;
  transactionDate: string;
}

interface CustomerSummary {
  totalBillAmount: number;
  totalSavedAmount: number;
  totalPaidAmount: number;
  transactionCount: number;
}

interface MerchantSummary {
  totalSalesValue: number;
  totalDiscountGiven: number;
  totalAmountReceived: number;
  salesCount: number;
}

interface TabProps {
  active: boolean;
  label: string;
  icon: string;
  onPress: () => void;
}


/* ===============================
   TAB BUTTON COMPONENT
================================ */
const TabButton = ({ active, label, icon, onPress }: TabProps) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Ionicons
      name={icon as any}
      size={20}
      color={active ? '#FF6600' : '#666666'}
    />
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ===============================
   TRANSACTION CARD COMPONENT
================================ */
const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
  <View style={styles.transactionCard}>
    <View style={styles.transactionLeft}>
      <View
        style={[
          styles.transactionIcon,
          transaction.type === 'credit'
            ? styles.creditIcon
            : styles.debitIcon,
        ]}
      >
        <Ionicons
          name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
          size={16}
          color={transaction.type === 'credit' ? '#4CAF50' : '#F44336'}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>{transaction.date}</Text>
      </View>
    </View>
    <View style={styles.transactionRight}>
      <Text
        style={[
          styles.transactionAmount,
          transaction.type === 'credit'
            ? styles.creditAmount
            : styles.debitAmount,
        ]}
      >
        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
      </Text>
      <Text
        style={[
          styles.transactionStatus,
          transaction.status === 'completed'
            ? styles.statusCompleted
            : transaction.status === 'pending'
            ? styles.statusPending
            : styles.statusFailed,
        ]}
      >
        {transaction.status}
      </Text>
    </View>
  </View>
);

/* ===============================
   MAIN COMPONENT
================================ */
export default function DualDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string }>();
  const { user, logout, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [userTypeLabel, setUserTypeLabel] = useState<string>('Dual');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [customerContactName, setCustomerContactName] = useState<string | null>(null);
  const [merchantContactName, setMerchantContactName] = useState<string | null>(null);
  const [merchantShopName, setMerchantShopName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [customerTotals, setCustomerTotals] = useState<{
    today: CustomerSummary | null;
    thisMonth: CustomerSummary | null;
    thisYear: CustomerSummary | null;
  }>({ today: null, thisMonth: null, thisYear: null });
  const [merchantTotals, setMerchantTotals] = useState<{
    today: MerchantSummary | null;
    thisMonth: MerchantSummary | null;
    thisYear: MerchantSummary | null;
  }>({ today: null, thisMonth: null, thisYear: null });
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isMerchantLoading, setIsMerchantLoading] = useState(false);
  const [nearbyShops, setNearbyShops] = useState<any[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);

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
  const placeholderAnim = useRef(new Animated.Value(0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const contentScrollRef = useRef<ScrollView | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172;

  /* ===============================
     LOAD USER DATA
  ================================ */
  useEffect(() => {
    loadUserData();
    loadTransactions();
    loadUserType();
    requestLocationOnMount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refreshProfileImage = async () => {
        try {
          const storedProfileImage = await AsyncStorage.getItem('user_profile_image');
          if (storedProfileImage && isActive) {
            setProfileImage(storedProfileImage);
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
    if (location?.latitude && location?.longitude) {
      loadNearbyShops();
    }
  }, [location?.latitude, location?.longitude]);

  useEffect(() => {
    if (nearbyShops.length > 0) {
      startAutoScroll(nearbyShops.length);
    }
  }, [nearbyShops.length]);

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

  const loadNearbyShops = async () => {
    if (!location?.latitude || !location?.longitude) return;

    try {
      setIsNearbyLoading(true);
      const response = await getNearbyShops(
        location.latitude,
        location.longitude
      );
      setNearbyShops(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load nearby shops:', error);
      setNearbyShops([]);
    } finally {
      setIsNearbyLoading(false);
    }
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
      }).start(({ finished }: { finished: boolean }) => {
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

  const loadUserType = async () => {
    try {
      if (params.userType) {
        setUserTypeLabel('Customer & Merchant');
      } else {
        const storedUserType = await AsyncStorage.getItem('user_type');
        if (storedUserType && storedUserType.toLowerCase() === 'dual') {
          setUserTypeLabel('Customer & Merchant');
        }
      }
    } catch (error) {
      console.log('Error loading user type:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('user_search_response');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      }
      const storedCustomerName = await AsyncStorage.getItem('customer_contact_name');
      if (storedCustomerName) {
        setCustomerContactName(storedCustomerName);
      }
      const storedMerchantName = await AsyncStorage.getItem('merchant_contact_name');
      if (storedMerchantName) {
        setMerchantContactName(storedMerchantName);
      }
      const storedShopName = await AsyncStorage.getItem('merchant_shop_name');
      if (storedShopName) {
        setMerchantShopName(storedShopName);
      }
      const storedProfileImage = await AsyncStorage.getItem('user_profile_image');
      if (storedProfileImage) {
        setProfileImage(storedProfileImage);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const [storedCustomerId, storedMerchantId] = await Promise.all([
        AsyncStorage.getItem('customer_id'),
        AsyncStorage.getItem('merchant_id'),
      ]);
      if (storedCustomerId) setCustomerId(storedCustomerId);
      if (storedMerchantId) setMerchantId(storedMerchantId);
    } catch (error) {
      console.error('Error loading dual ids:', error);
    }
  };

  useEffect(() => {
    const fetchCustomerTransactions = async (id: string) => {
      setIsCustomerLoading(true);
      try {
        const res = await fetch(
          `https://devapi.intownlocal.com/IN/transactions/customers/${id}`,
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
          throw new Error(`Customer transactions fetch failed: ${res.status}`);
        }
        const data = await res.json();
        const apiTransactions: CustomerTransaction[] = data?.transactions ?? [];
        setCustomerTransactions(
          apiTransactions.map((item) => ({
            id: String(item.transactionId),
            date: new Date(item.transactionDate).toLocaleDateString(),
            amount: item.finalPaidAmount ?? item.totalBillAmount ?? 0,
            description: item.merchantName,
            type: 'debit',
            status: 'completed',
          }))
        );
        setCustomerTotals({
          today: data?.today ?? null,
          thisMonth: data?.thisMonth ?? null,
          thisYear: data?.thisYear ?? null,
        });
      } catch (error) {
        console.error('Error loading customer transactions:', error);
        setCustomerTransactions([]);
        setCustomerTotals({ today: null, thisMonth: null, thisYear: null });
      } finally {
        setIsCustomerLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerTransactions(customerId);
    }
  }, [customerId, token]);

  useEffect(() => {
    const fetchMerchantSales = async (id: string) => {
      setIsMerchantLoading(true);
      try {
        const res = await fetch(
          `https://devapi.intownlocal.com/IN/transactions/merchants/${id}`,
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
          throw new Error(`Merchant sales fetch failed: ${res.status}`);
        }
        const data = await res.json();
        const apiSales: MerchantSale[] = data?.sales ?? [];
        setMerchantTransactions(
          apiSales.map((item) => ({
            id: String(item.transactionId),
            date: new Date(item.transactionDate).toLocaleDateString(),
            amount: item.totalAmountReceived ?? item.totalSalesValue ?? 0,
            description: item.customerName,
            type: 'credit',
            status: 'completed',
          }))
        );
        setMerchantTotals({
          today: data?.today ?? null,
          thisMonth: data?.thisMonth ?? null,
          thisYear: data?.thisYear ?? null,
        });
      } catch (error) {
        console.error('Error loading merchant sales:', error);
        setMerchantTransactions([]);
        setMerchantTotals({ today: null, thisMonth: null, thisYear: null });
      } finally {
        setIsMerchantLoading(false);
      }
    };

    if (merchantId) {
      fetchMerchantSales(merchantId);
    }
  }, [merchantId, token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadTransactions();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.replace('/login');
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/member-shop-list',
        params: { query: searchQuery, source: 'dual' },
      });
    }
  };

  const currentTransactions =
    activeTab === 'customer' ? customerTransactions : merchantTransactions;

  const customerTodaySaved = customerTotals.today?.totalSavedAmount ?? 0;
  const customerMonthSaved = customerTotals.thisMonth?.totalSavedAmount ?? 0;
  const customerYearSaved = customerTotals.thisYear?.totalSavedAmount ?? 0;
  const merchantTodaySales = merchantTotals.today?.totalSalesValue ?? 0;
  const merchantMonthSales = merchantTotals.thisMonth?.totalSalesValue ?? 0;
  const merchantYearSales = merchantTotals.thisYear?.totalSalesValue ?? 0;

  const getWelcomeName = () => {
    if (activeTab === 'customer' && userData?.customer?.name) {
      return userData.customer.name;
    }
    if (activeTab === 'merchant' && userData?.merchant?.businessName) {
      return userData.merchant.businessName;
    }
    if (activeTab === 'customer' && customerContactName) {
      return customerContactName;
    }
    if (activeTab === 'merchant') {
      return merchantShopName || merchantContactName || user?.phone || 'User';
    }
    return customerContactName || user?.phone || 'User';
  };

  const getProfileDisplayName = () => {
    const candidates = [
      customerContactName,
      merchantContactName,
      merchantShopName,
      user?.name,
    ];
    const normalized = candidates.find(
      (value) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.trim().toLowerCase() !== 'string'
    );
    return normalized ?? 'User';
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="location" size={16} color="#FF6600" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.welcomeText}>Welcome {getWelcomeName()}</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {getLocationDisplayText()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{getProfileDisplayName()}</Text>
            <Text style={styles.userPhone}>
              {(user as any)?.phone ?? (user as any)?.email ?? ''}
            </Text>
          </View>
          {profileImage ? (
            <Image
              source={getProfileImageSource(profileImage) as any}
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

      {/* Dropdown Panel */}
      {showDropdown && (
        <>
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
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
              <View style={styles.panelAvatarPlaceholder}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userPanelName}>{user?.name ?? 'User'}</Text>
                <Text style={styles.userPanelPhone}>
                  {(user as any)?.phone ?? (user as any)?.email ?? ''}
                </Text>
                <Text style={styles.userPanelTag}>Dual Account</Text>
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
                  setActiveTab('merchant');
              }}
            >
              <Ionicons name="storefront-outline" size={22} color="#FF6600" />
              <Text style={styles.userPanelText}>Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userPanelItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FF0000" />
              <Text style={[styles.userPanelText, { color: '#FF0000' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Search Section (Customer Only) */}
      {activeTab === 'customer' && (
        <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder=""
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim().length > 0) {
                    const combined = [...SEARCH_ITEMS, ...SEARCH_PRODUCTS];
                    const filtered = combined.filter((item) =>
                      item.toLowerCase().includes(text.toLowerCase())
                    );
                    setSuggestions(filtered);
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  router.push({ pathname: '/search', params: { source: 'dual' } });
                }}
                onSubmitEditing={handleSearch}
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
                        params: { query: item, source: 'dual' },
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
      )}

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TabButton
          active={activeTab === 'customer'}
          label="Customer"
          icon="person"
          onPress={() => setActiveTab('customer')}
        />
        <TabButton
          active={activeTab === 'merchant'}
          label="Merchant"
          icon="storefront"
          onPress={() => setActiveTab('merchant')}
        />
      </View>

      {/* Content */}
      <ScrollView
        ref={contentScrollRef}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Role Info Card */}
        <View style={styles.roleCard}>
          <View style={styles.roleIconContainer}>
            <Ionicons
              name={activeTab === 'customer' ? 'person' : 'storefront'}
              size={32}
              color="#FF6600"
            />
          </View>
          <View style={styles.roleInfo}>
            <Text style={styles.roleTitle}>
              {activeTab === 'customer' ? 'Customer Account' : 'Merchant Account'}
            </Text>
            <Text style={styles.roleSubtitle}>
              {activeTab === 'customer'
                ? 'View your purchases and rewards'
                : 'Manage your business transactions'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹
              {activeTab === 'customer'
                ? customerTodaySaved.toFixed(0)
                : merchantTodaySales.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer' ? "Today's Savings" : "Today's Sales"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹
              {activeTab === 'customer'
                ? customerMonthSaved.toFixed(0)
                : merchantMonthSales.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer'
                ? "This Month's Savings"
                : "This Month's Sales"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ₹
              {activeTab === 'customer'
                ? customerYearSaved.toFixed(0)
                : merchantYearSales.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer'
                ? "This Year's Savings"
                : "This Year's Sales"}
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'customer' && isCustomerLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : activeTab === 'merchant' && isMerchantLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#FF6600" />
            </View>
          ) : currentTransactions.length > 0 ? (
            currentTransactions.slice(0, 10).map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
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
            {activeTab === 'customer' ? (
              <>
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
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Ionicons name="bar-chart" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setShowOffersModal(true);
                  }}
                >
                  <Ionicons name="pricetag" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    contentScrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <Ionicons name="wallet" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Payouts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowSupportModal(true)}
                >
                  <Ionicons name="help-circle" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Support</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {/* Nearby Shops (Customer Only) */}
        {activeTab === 'customer' && (
          <View style={styles.nearbyShopsSection}>
            <Text style={styles.sectionTitle}>Nearby Shops</Text>
            {isNearbyLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#FF6600" />
              </View>
            ) : nearbyShops.length > 0 ? (
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
                      style={styles.nearbyCard}
                      onPress={() =>
                        router.push({
                          pathname: '/member-shop-details',
                          params: {
                            shopId: shop.id,
                            shop: JSON.stringify(shop),
                            source: 'dual',
                          },
                        })
                      }
                    >
                      <View style={styles.nearbyImagePlaceholder}>
                        <Ionicons name="storefront" size={36} color="#FF6600" />
                      </View>
                      <Text style={styles.nearbyName} numberOfLines={1}>
                        {shop.shopName || shop.merchantName || 'Shop'}
                      </Text>
                      <Text style={styles.nearbyMeta}>
                        {shop.businessCategory || 'General'}
                      </Text>
                      <View style={styles.nearbyFooter}>
                        <View style={styles.nearbyRating}>
                          <Ionicons name="star" size={12} color="#FFA500" />
                          <Text style={styles.nearbyRatingText}>
                            {shop.rating ?? '4.0'}
                          </Text>
                        </View>
                        <View style={styles.nearbyDistance}>
                          <Ionicons name="location" size={12} color="#FF6600" />
                          <Text style={styles.nearbyDistanceText}>
                            {formatDistance(
                              typeof shop.distance === 'number' ? shop.distance : null
                            )}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="storefront-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyText}>No nearby shops yet</Text>
              </View>
            )}
          </View>
        )}
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

      {/* Offers Modal */}
      <Modal
        visible={showOffersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOffersModal(false)}
      >
        <View style={styles.supportModalOverlay}>
          <View style={styles.supportModalContent}>
            <Text style={styles.supportTitle}>Offers</Text>
            <Text style={styles.supportText}>Offers will come soon</Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => setShowOffersModal(false)}
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
              <Text style={styles.transactionsModalTitle}>
                {activeTab === 'customer' ? 'All Transactions' : 'All Payments'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllTransactions(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => (
                  <TransactionCard
                    key={`all-${transaction.id}`}
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

            <View style={styles.locationSearchContainerModal}>
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

/* ===============================
   STYLES
================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
    fontSize: 13,
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
  profileInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userPhone: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  searchSection: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 44,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedPlaceholderPrefix: {
    fontSize: 16,
    color: '#999999',
  },
  animatedPlaceholderWord: {
    fontSize: 16,
    color: '#ff6600',
    fontWeight: '500',
  },
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
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
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
  panelAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  tabButtonActive: {
    backgroundColor: '#FFF3E0',
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabLabelActive: {
    color: '#FF6600',
  },
  content: {
    flex: 1,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  roleSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6600',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  transactionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6600',
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#4CAF50',
  },
  debitAmount: {
    color: '#F44336',
  },
  transactionStatus: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  statusPending: {
    color: '#FF9800',
  },
  statusFailed: {
    color: '#F44336',
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
  autoScrollContainer: { overflow: 'hidden' },
  autoScrollContent: { flexDirection: 'row' },
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
  nearbyShopsSection: {
    padding: 16,
  },
  nearbyScroll: {
    paddingRight: 8,
  },
  nearbyCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  nearbyImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  nearbyMeta: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  nearbyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nearbyRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyRatingText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666666',
  },
  nearbyDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyDistanceText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#FF6600',
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
  locationSearchContainerModal: {
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
