import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import Footer from '../components/Footer';
import { 
  getUserLocationWithDetails, 
  searchLocations, 
  setManualLocation 
} from '../utils/location';

const { width } = Dimensions.get('window');

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

const DUMMY_NEARBY_SHOPS = [
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5, rating: 4.5 },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8, rating: 4.7 },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2, rating: 4.3 },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3, rating: 4.8 },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5, rating: 4.2 },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0, rating: 4.6 },
];

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
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
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

  /* ===============================
     LOAD USER DATA
  ================================ */
  useEffect(() => {
    loadUserData();
    loadTransactions();
    loadUserType();
    requestLocationOnMount();
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
    await logout();
    router.replace('/login');
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
    return user?.phone || 'User';
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
            <Text style={styles.locationText} numberOfLines={1}>
              {getLocationDisplayText()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={(e) => {
            e.stopPropagation();
            handleLogout();
          }}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
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

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder=""
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
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
      </View>

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
            <TouchableOpacity>
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
            currentTransactions.map((transaction) => (
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
                  onPress={() => router.push('/user-dashboard')}
                >
                  <Ionicons name="search" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Find Shops</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="gift" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>My Rewards</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="card" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="help-circle" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Support</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/merchant-dashboard')}
                >
                  <Ionicons name="bar-chart" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="pricetag" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Offers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="wallet" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Payouts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="settings" size={24} color="#FF6600" />
                  <Text style={styles.actionText}>Settings</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {/* Nearby Shops */}
        <View style={styles.nearbyShopsSection}>
          <Text style={styles.sectionTitle}>Nearby Shops</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyScroll}
          >
            {DUMMY_NEARBY_SHOPS.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={styles.nearbyCard}
                onPress={() => router.push('/user-dashboard')}
              >
                <View style={styles.nearbyImagePlaceholder}>
                  <Ionicons name="storefront" size={36} color="#FF6600" />
                </View>
                <Text style={styles.nearbyName} numberOfLines={1}>
                  {shop.name}
                </Text>
                <Text style={styles.nearbyMeta}>{shop.category}</Text>
                <View style={styles.nearbyFooter}>
                  <View style={styles.nearbyRating}>
                    <Ionicons name="star" size={12} color="#FFA500" />
                    <Text style={styles.nearbyRatingText}>{shop.rating}</Text>
                  </View>
                  <View style={styles.nearbyDistance}>
                    <Ionicons name="location" size={12} color="#666" />
                    <Text style={styles.nearbyDistanceText}>{shop.distance} km</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <Footer />
      </ScrollView>

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
    color: '#333',
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
    color: '#666666',
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
