import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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



interface Payment {
  id: string;
  customerAmount: number;
  discountAmount: number;
  totalReceived: number;
  date: string;
  status: 'pending' | 'completed';
}

export default function MerchantDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string }>();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userType, setUserType] = useState<string>('Merchant');

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
    name: user?.name || 'My Shop',
    category: 'Retail Store',
    rating: 4.5,
    totalPayments: payments.length,
  };

  useEffect(() => {
    loadPayments();
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

  const formatUserType = (type: string): string => {
    const lower = type.toLowerCase();
    if (lower === 'new_user' || lower === 'new' || lower === 'user') return 'User';
    if (lower.includes('customer')) return 'Customer';
    if (lower.includes('merchant')) return 'Merchant';
    if (lower === 'dual') return 'Customer & Merchant';
    return 'Merchant';
  };

  const loadPayments = async () => {
    try {
      const stored = await AsyncStorage.getItem('merchant_payments');
      if (stored) {
        setPayments(JSON.parse(stored));
      } else {
        // Demo payments
        const demoPayments: Payment[] = [
          {
            id: '1',
            customerAmount: 1000,
            discountAmount: 100,
            totalReceived: 900,
            date: new Date().toISOString(),
            status: 'pending',
          },
          {
            id: '2',
            customerAmount: 500,
            discountAmount: 50,
            totalReceived: 450,
            date: new Date().toISOString(),
            status: 'pending',
          },
        ];
        setPayments(demoPayments);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const savePayments = async (updatedPayments: Payment[]) => {
    try {
      await AsyncStorage.setItem('merchant_payments', JSON.stringify(updatedPayments));
      setPayments(updatedPayments);
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  };

  const handlePaymentComplete = (paymentId: string) => {
    Alert.alert(
      'Mark as Completed',
      'Confirm that you have received this payment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            const updated = payments.map((p) =>
              p.id === paymentId ? { ...p, status: 'completed' as const } : p
            );
            savePayments(updated);
            Alert.alert('Success', 'Payment marked as completed!');
          },
        },
      ]
    );
  };

  const getTotalStats = () => {
    const completed = payments.filter((p) => p.status === 'completed');
    const totalCustomerAmount = completed.reduce((sum, p) => sum + p.customerAmount, 0);
    const totalDiscountAmount = completed.reduce((sum, p) => sum + p.discountAmount, 0);
    const totalReceived = completed.reduce((sum, p) => sum + p.totalReceived, 0);
    return { totalCustomerAmount, totalDiscountAmount, totalReceived };
  };

  const stats = getTotalStats();

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
          <View style={styles.headerLeft}>
            <Image 
              source={require('../assets/images/intown-logo.jpg')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* Location Display */}
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="location" size={16} color="#FF6600" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Your Location</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText} numberOfLines={1}>
                  {getLocationDisplayText()}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#333" />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Ionicons name="person" size={20} color="#fff" />
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="cash" size={32} color="#2196F3" />
                <Text style={styles.summaryLabel}>Customer Amount</Text>
                <Text style={styles.summaryValue}>₹{stats.totalCustomerAmount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="pricetag" size={32} color="#FF6600" />
                <Text style={styles.summaryLabel}>Discount Amount</Text>
                <Text style={styles.summaryValue}>₹{stats.totalDiscountAmount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="wallet" size={32} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Total Received</Text>
                <Text style={styles.summaryValueLarge}>₹{stats.totalReceived}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {payments.map((payment) => (
            <View
              key={payment.id}
              style={[
                styles.paymentCard,
                payment.status === 'completed' && styles.paymentCardCompleted,
              ]}
            >
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentDate}>
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    payment.status === 'completed' && styles.statusBadgeCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      payment.status === 'completed' && styles.statusTextCompleted,
                    ]}
                  >
                    {payment.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Customer Amount:</Text>
                  <Text style={styles.paymentAmount}>₹{payment.customerAmount}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Discount Amount:</Text>
                  <Text style={styles.paymentDiscount}>-₹{payment.discountAmount}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabelBold}>Total Received:</Text>
                  <Text style={styles.paymentTotal}>₹{payment.totalReceived}</Text>
                </View>
              </View>

              {payment.status === 'pending' && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handlePaymentComplete(payment.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.completeButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Footer/>
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
                <Ionicons name="close" size={24} color="#333" />
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
    padding: 16,
    backgroundColor: '#FF6600',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: { width: 140, height: 50 },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 12,
    maxWidth: 200,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  profileButton: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  merchantBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  merchantBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: '#666666', marginTop: 8, textAlign: 'center' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 4 },
  summaryValueLarge: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginTop: 4 },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  paymentCardCompleted: { borderColor: '#4CAF50', opacity: 0.8 },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentDate: { fontSize: 14, color: '#666666', fontWeight: '600' },
  statusBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusBadgeCompleted: { backgroundColor: '#E8F5E9' },
  statusText: { fontSize: 12, color: '#FF6600', fontWeight: '600' },
  statusTextCompleted: { color: '#4CAF50' },
  paymentDetails: { marginBottom: 12 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: '#666666' },
  paymentAmount: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  paymentDiscount: { fontSize: 16, fontWeight: '600', color: '#FF6600' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 8 },
  paymentLabelBold: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  paymentTotal: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
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

});