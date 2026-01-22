import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  FlatList,
  Platform,
  Image,
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
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [userTypeLabel, setUserTypeLabel] = useState<string>('Dual');
  const [searchQuery, setSearchQuery] = useState('');

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
    // TODO: Replace with actual API calls
    // For now, using dummy data
    setCustomerTransactions([
      {
        id: '1',
        date: '2025-01-05',
        amount: 250.00,
        description: 'Purchase at Fresh Mart',
        type: 'debit',
        status: 'completed',
      },
      {
        id: '2',
        date: '2025-01-04',
        amount: 50.00,
        description: 'Cashback Reward',
        type: 'credit',
        status: 'completed',
      },
      {
        id: '3',
        date: '2025-01-03',
        amount: 1200.00,
        description: 'Shopping at Fashion Hub',
        type: 'debit',
        status: 'completed',
      },
      {
        id: '4',
        date: '2025-01-02',
        amount: 100.00,
        description: 'Referral Bonus',
        type: 'credit',
        status: 'pending',
      },
    ]);

    setMerchantTransactions([
      {
        id: '1',
        date: '2025-01-05',
        amount: 5000.00,
        description: 'Daily Sales Settlement',
        type: 'credit',
        status: 'completed',
      },
      {
        id: '2',
        date: '2025-01-04',
        amount: 150.00,
        description: 'Platform Fee',
        type: 'debit',
        status: 'completed',
      },
      {
        id: '3',
        date: '2025-01-03',
        amount: 3500.00,
        description: 'Daily Sales Settlement',
        type: 'credit',
        status: 'completed',
      },
      {
        id: '4',
        date: '2025-01-02',
        amount: 200.00,
        description: 'Advertisement Fee',
        type: 'debit',
        status: 'completed',
      },
    ]);
  };

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
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{getWelcomeName()}</Text>
          </View>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeBadgeText}>{userTypeLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6600" />
        </TouchableOpacity>
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
              ₹{activeTab === 'customer' ? '1,550' : '8,350'}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer' ? 'Total Spent' : 'Total Earnings'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activeTab === 'customer' ? '150' : '45'}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer' ? 'Reward Points' : 'Orders'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {activeTab === 'customer' ? '₹50' : '₹350'}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'customer' ? 'Cashback' : 'Fees Paid'}
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

          {currentTransactions.length > 0 ? (
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
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  userTypeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  logoutButton: {
    padding: 8,
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
});
