import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Image,
  Pressable,
  Platform,
  Easing,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getPlans, getCategories, getShops } from '../utils/api';
import { FontStylesWithFallback } from '../utils/fonts';
import Footer from '../components/Footer';

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
}

const { width } = Dimensions.get('window');

const DUMMY_NEARBY_SHOPS = [
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5, rating: 4.5 },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8, rating: 4.7 },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2, rating: 4.3 },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3, rating: 4.8 },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5, rating: 4.2 },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0, rating: 4.6 },
];

const DUMMY_CATEGORIES = [
  { id: '1', name: 'Grocery', icon: 'storefront' },
  { id: '2', name: 'Salon', icon: 'cut' },
  { id: '3', name: 'Restaurant', icon: 'restaurant' },
  { id: '4', name: 'Pharmacy', icon: 'medical' },
  { id: '5', name: 'Fashion', icon: 'shirt' },
  { id: '6', name: 'Electronics', icon: 'phone-portrait' },
];

// --- SMART SHOP CARD COMPONENT ---
const ShopCard = ({ 
  shop, 
  onPress, 
  onInteractionChange 
}: { 
  shop: any, 
  onPress: () => void,
  onInteractionChange: (isInteracting: boolean) => void 
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [zIndex, setZIndex] = useState(0); 

  const animateScale = (toValue: number) => {
    Animated.timing(scaleValue, {
      toValue: toValue,
      duration: 300, 
      useNativeDriver: Platform.OS !== 'web',
      easing: Easing.out(Easing.ease), 
    }).start();
  };

  const handleIn = () => {
    setZIndex(100); // Bring to front
    onInteractionChange(true);
    // --- UPDATED: Reduced scale from 1.35 to 1.1 ---
    animateScale(1.1);
  };

  const handleOut = () => {
    onInteractionChange(false);
    animateScale(1);
    setTimeout(() => setZIndex(0), 300);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onHoverIn={handleIn}
      onHoverOut={handleOut}
      style={{ zIndex: zIndex }} 
    >
      <Animated.View 
        style={[
          styles.shopCard, 
          { transform: [{ scale: scaleValue }] }
        ]}
      >
        <View style={styles.shopImagePlaceholder}>
          <Ionicons name="storefront" size={40} color="#FF6600" />
        </View>
        <Text style={styles.shopCardName} numberOfLines={1}>
          {shop.name}
        </Text>
        <Text style={styles.shopCardCategory}>{shop.category}</Text>
        <View style={styles.shopCardDistance}>
          <Ionicons name="location" size={14} color="#666666" />
          <Text style={styles.shopCardDistanceText}>{shop.distance} km</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function UserDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { location } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>(DUMMY_CATEGORIES);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  
  // --- ADVANCED SCROLL STATE ---
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isHovering = useRef(false);
  
  const CARD_WIDTH = 172; 
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  useEffect(() => {
    loadData();
    startScrolling(0);
    return () => {
      scrollAnimation.current?.stop();
    };
  }, []);

  useEffect(() => {
    // Close dropdown when user changes
    setShowDropdown(false);
  }, [user]);

  const startScrolling = (startValue: number) => {
    if (isHovering.current) return;

    if (startValue <= -TOTAL_WIDTH) {
      startValue = 0;
      scrollX.setValue(0);
    }

    const BASE_DURATION = 10000; // 10 seconds for full loop
    const remainingDistance = TOTAL_WIDTH + startValue;
    const duration = (remainingDistance / TOTAL_WIDTH) * BASE_DURATION;

    const animation = Animated.timing(scrollX, {
      toValue: -TOTAL_WIDTH,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    scrollAnimation.current = animation;

    animation.start(({ finished }) => {
      if (finished) {
        startScrolling(0);
      }
    });
  };

  const handleInteractionChange = (interacting: boolean) => {
    isHovering.current = interacting;
    if (interacting) {
      scrollAnimation.current?.stop();
    } else {
      scrollX.stopAnimation((currentValue) => {
        startScrolling(currentValue);
      });
    }
  };

  const loadData = async () => {
    try {
      const [plansData, categoriesData] = await Promise.all([
        getPlans(),
        getCategories(),
      ]);
      setPlans(plansData || []);
      setCategories(categoriesData && categoriesData.length > 0 ? categoriesData : DUMMY_CATEGORIES);
    } catch (error) {
      console.error('Error loading data:', error);
      // Use dummy data as fallback
      setPlans([]);
      setCategories(DUMMY_CATEGORIES);
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
    setShowDropdown(false);
    router.replace('/login');
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
      setFilteredCategories([]);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow for button clicks
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={() => setShowDropdown(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/intown-logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }} 
            style={styles.profileButton}
          >

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
            <Ionicons name="person" size={20} color="#ffffff" style={styles.profileIconButton} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showDropdown && (
          <TouchableOpacity 
            style={styles.dropdownMenu}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF0000" />
              <Text style={[styles.dropdownText, {color: '#FF0000'}]}>Logout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={24} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Grocery, Salon, Fashion..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        {/* Search Dropdown */}
        {showSearchDropdown && filteredCategories.length > 0 && (
          <TouchableOpacity 
            style={styles.searchDropdownContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.searchDropdown}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.searchDropdownItem}
                  onPress={() => setShowRegistrationModal(true)}
                >
                  <View style={styles.searchDropdownItemContent}>
                    <View style={styles.searchDropdownItemLeft}>
                      <Ionicons name={category.icon as any} size={20} color="#FF6600" />
                      <Text style={styles.searchDropdownItemText}>{category.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => setShowRegistrationModal(true)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => setShowRegistrationModal(true)}
                    >
                      <Text style={styles.viewButtonNavigate}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>

            {categories.length > 0 ? (
              categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => setShowRegistrationModal(true)}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon as any} size={32} color="#FF6600" />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noCategoriesText}>No categories available</Text>
            )}

          </View>
        </View>

        {/* Theme Section */}
        <View style={styles.themeSection}>
          <Text style={styles.themeTitle}>Transform Local Retail</Text>
          <Text style={styles.themeSubtitle}>
            Present Local Retail Shops to Digital Presence
          </Text>
        </View>

        {/* Savings Calculator */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Savings Calculator</Text>
          <View style={styles.calculatorCard}>
            <View style={styles.calculatorRow}>
              <Text style={styles.calculatorLabel}>Estimated Monthly Spend</Text>
              <TextInput
                style={styles.calculatorInput}
                value={monthlySpend}
                onChangeText={setMonthlySpend}
                keyboardType="numeric"
                placeholder="10000"
              />
            </View>
            <View style={styles.calculatorRow}>
              <Text style={styles.calculatorLabel}>Estimated Monthly Savings (10%)</Text>
              <Text style={styles.calculatorValue}>₹{monthlySavings.toFixed(0)}</Text>
            </View>
            <View style={styles.calculatorRow}>
              <Text style={styles.calculatorLabel}>Estimated Annual Savings</Text>
              <Text style={styles.calculatorValueLarge}>₹{annualSavings.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Membership Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Plans</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
              onPress={() => setActiveTab('customer')}
            >
              <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'merchant' && styles.activeTab]}
              onPress={() => setActiveTab('merchant')}
            >
              <Text style={[styles.tabText, activeTab === 'merchant' && styles.activeTabText]}>
                Merchant
              </Text>
            </TouchableOpacity>
          </View>

          {/* Customer Tab Content */}
          {activeTab === 'customer' && (
            <View style={styles.tabContent}>
              {/* IT Max Plan */}
              <View style={styles.planCard}>
                <Text style={styles.planName}>IT Max</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>₹999</Text>
                  <Text style={styles.planPeriod}>/Year</Text>
                </View>
                <Text style={styles.planDescription}>
                  Premium individual membership with exclusive benefits and unlimited access to all partner stores.
                </Text>
                <TouchableOpacity
                  style={styles.purchaseButton}
                  onPress={() => router.push('/register-member')}
                >
                  <Text style={styles.purchaseButtonText}>Purchase Now</Text>
                </TouchableOpacity>
              </View>

              {/* IT Max Plus Plan */}
              <View style={[styles.planCard, styles.popularPlan]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
                <Text style={styles.planName}>IT Max Plus</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>₹1499</Text>
                  <Text style={styles.planPeriod}>/Year</Text>
                </View>
                <Text style={styles.planDescription}>
                  Premium couple membership with exclusive benefits and unlimited access to all partner stores.
                </Text>
                <TouchableOpacity
                  style={[styles.purchaseButton, styles.purchaseButtonPrimary]}
                  onPress={() => router.push('/register-member')}
                >
                  <Text style={styles.purchaseButtonText}>Purchase Now</Text>
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
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Zero Commissions</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>No Joining Fee</Text>
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
                    <Text style={styles.featureText}>Free Promotion</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Shops</Text>
          <View style={styles.autoScrollContainer}>
            <Animated.View
              style={[
                styles.autoScrollContent,
                { transform: [{ translateX: scrollX }] },
              ]}
            >
              {/* Render shops twice for seamless loop */}
              {[...DUMMY_NEARBY_SHOPS, ...DUMMY_NEARBY_SHOPS].map((shop, index) => (
                <ShopCard
                  key={`${shop.id}-${index}`}
                  shop={shop}
                  onInteractionChange={handleInteractionChange}
                  onPress={() => setShowRegistrationModal(true)}
                />
              ))}
            </Animated.View>
          </View>
        </View>

        <Footer />

        </ScrollView>
      </TouchableOpacity>

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
              <Ionicons name="person" size={24} color="#FF6600" />
              <Text style={styles.modalButtonText}>Register as Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront" size={24} color="#FF6600" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fe6f09',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  logo: {
    width: 140,
    height: 50,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconButton: {
    borderWidth: 2,
    borderColor: '#fff',
    padding: 4,
    borderRadius: 30,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    color: '#fff',
    fontWeight: '700',
  },
  userPhone: {
    ...FontStylesWithFallback.caption,
    color: '#fff',
    fontSize: 10,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: '#FF6600',
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    ...FontStylesWithFallback.h4,
    color: '#1A1A1A',
    marginBottom: 16,
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
    backgroundColor: '#FF6600',
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
    color: '#FF6600',
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
    backgroundColor: '#FF6600',
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: '33.33%',
    padding: 8,
  },
  categoryIcon: {
    backgroundColor: '#ebd7d7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  categoryName: {
    ...FontStylesWithFallback.caption,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,

  },
  noCategoriesText: {
    ...FontStylesWithFallback.body,
    color: '#666666',
    textAlign: 'center',
    padding: 20,

  },
  themeSection: {
    backgroundColor: '#e6e6e6',
    padding: 24,
    alignItems: 'center',
  },
  themeTitle: {
    ...FontStylesWithFallback.h2,
    color: '#fe6f09',
    marginBottom: 8,
    fontWeight: '800',
    fontSize: 30,
  },
  themeSubtitle: {
    ...FontStylesWithFallback.body,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  calculatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calculatorLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  calculatorInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6600',
    borderBottomWidth: 1,
    borderBottomColor: '#FF6600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 100,
    maxWidth: 110,
    textAlign: 'right',
  },
  calculatorValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  calculatorValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    borderColor: '#FF6600',
    borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: '#FF6600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6600',
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
    color: '#1A1A1A',
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
    marginBottom: 16,
  },
  purchaseButton: {
    backgroundColor: '#f2b949',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  purchaseButtonPrimary: {
    backgroundColor: '#FF6600',
  },
  purchaseButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
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
    overflow: 'visible',
    paddingVertical: 40, // Room to scale
  },
  autoScrollContent: {
    flexDirection: 'row',
  },
  shopCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#FF6600',
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
});