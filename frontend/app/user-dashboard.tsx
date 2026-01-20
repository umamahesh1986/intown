// user-dashboard.tsx
import { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';


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
  
  Platform,
  
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getPlans, getCategories } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FontStylesWithFallback } from '../utils/fonts';

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

// Category images from Unsplash/Pexels - mapped to API category names
const CATEGORY_IMAGES: { [key: string]: string } = {
  // API Categories
  'Groceries & Kirana': 'https://images.unsplash.com/photo-1609952578538-3d454550301d?w=400&h=300&fit=crop',
  'Bakery, Sweets & Snacks': 'https://images.unsplash.com/photo-1645597454210-c97f9701257a?w=400&h=300&fit=crop',
  'Dairy & Milk Products': 'https://images.pexels.com/photos/3735192/pexels-photo-3735192.jpeg?w=400&h=300&fit=crop',
  'Fruits & Vegetables': 'https://images.unsplash.com/photo-1553799262-a37c45961038?w=400&h=300&fit=crop',
  'Meat, Chicken & Fish Shops': 'https://images.unsplash.com/photo-1704303923171-d6839e4784c3?w=400&h=300&fit=crop',
  'Pharmacy / Medical Stores': 'https://images.pexels.com/photos/8657301/pexels-photo-8657301.jpeg?w=400&h=300&fit=crop',
  'General Stores / Provision Stores': 'https://images.unsplash.com/photo-1739066598279-1297113f5c6a?w=400&h=300&fit=crop',
  'Water Can Suppliers': 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=400&h=300&fit=crop',
  "Men's Salons": 'https://images.unsplash.com/photo-1654097801176-cb1795fd0c5e?w=400&h=300&fit=crop',
  "Women's Salons / Beauty Parlors": 'https://images.pexels.com/photos/3738340/pexels-photo-3738340.jpeg?w=400&h=300&fit=crop',
  // Legacy/fallback names
  'Grocery': 'https://images.unsplash.com/photo-1609952578538-3d454550301d?w=400&h=300&fit=crop',
  'Salon': 'https://images.unsplash.com/photo-1654097801176-cb1795fd0c5e?w=400&h=300&fit=crop',
  'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'Pharmacy': 'https://images.pexels.com/photos/8657301/pexels-photo-8657301.jpeg?w=400&h=300&fit=crop',
  'Fashion': 'https://images.unsplash.com/photo-1641440615976-d4bc4eb7dab8?w=400&h=300&fit=crop',
  'Electronics': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=300&fit=crop',
};

const MEMBER_CAROUSEL_IMAGES = [
  require('../assets/images/1.jpg'),
  require('../assets/images/2.jpg'),
  require('../assets/images/3.jpg'),
  require('../assets/images/4.jpg'),
  require('../assets/images/5.jpg'),
  require('../assets/images/6.jpg'),
];
// =====================================

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
const CAROUSEL_IMAGES_RAW = [
  require('../assets/images/1.jpg'),
  require('../assets/images/2.jpg'),
  require('../assets/images/3.jpg'),
  require('../assets/images/4.jpg'),
  require('../assets/images/5.jpg'),
  require('../assets/images/6.jpg'),
];

const CAROUSEL_IMAGES = CAROUSEL_IMAGES_RAW.map(image =>
  Platform.OS === 'web' && (image as any).default ? (image as any).default : image
);
// ---------------------------------------------------------------------------------


  const location = useLocationStore((state) => state.location);

  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>(DUMMY_CATEGORIES);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Dropdown animation value
  const dropdownAnim = useRef(new Animated.Value(0)).current;

 

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);
  const autoPlayTimer = useRef<number | null>(null);
  


  // Animation for auto-scrolling shops
  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172; // 160 + 12 (margin)
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  

 
  useEffect(() => {
  loadData();
  startAutoScroll();
  loadUserType();

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

  const startAutoScroll = () => {
    const animationDuration = TOTAL_WIDTH * 50;

    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -TOTAL_WIDTH,
        duration: animationDuration,
        useNativeDriver: true,
      })
    ).start();
  };

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
    if (text.length > 0) {
      const filtered = categories.filter((category) =>
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
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };


  

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.container} activeOpacity={1} onPress={() => {
        // close dropdown on outside press
        if (showDropdown) {
          toggleDropdown();
        }
      }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={require('../assets/images/intown-logo.jpg')} style={styles.logo} resizeMode="contain" />
              <View style={styles.userTypeBadge}>
                <Text style={styles.userTypeBadgeText}>{userType}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleDropdown(e);
              }}
              style={styles.profileButton}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userPhone}>{user?.phone}</Text>
              </View>
            <Ionicons name="person" size={20} color="#ffffff" />

 

            </TouchableOpacity>
          </View>

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
              {/* USER HEADER */}
              <View style={styles.userPanelHeader}>
                <Ionicons name="person-circle" size={48} color="#FF6600" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.userPanelName}>{user?.name ?? 'Guest User'}</Text>
                 <Text style={styles.userPanelPhone}>
  {user?.phone ?? ''}
</Text>

                </View>
              </View>
{/* MY ACCOUNT */}
<TouchableOpacity
  style={styles.userPanelItem}
  onPress={() => {
    toggleDropdown();
    router.push('/account');
  }}
>
  <Ionicons name="person-outline" size={20} color="#333" />
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
  <Ionicons name="star-outline" size={20} color="#333" />
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
  <Ionicons name="storefront-outline" size={20} color="#333" />
  <Text style={styles.userPanelText}>Become a Merchant</Text>
</TouchableOpacity>

             

              <TouchableOpacity style={[styles.userPanelItem, { marginTop: 6 }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#FF0000" />
                <Text style={[styles.userPanelText, { color: '#FF0000' }]}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
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
            <TouchableOpacity style={styles.searchDropdownContainer} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
                      <TouchableOpacity style={styles.viewButton} onPress={() => setShowRegistrationModal(true)}>
                        <Text style={styles.viewButtonText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.viewButton} onPress={() => setShowRegistrationModal(true)}>
                        <Text style={styles.viewButtonNavigate}>Navigate</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          )}

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
                    activeOpacity={0.8}
                  >
                    <View style={styles.categoryImageContainer}>
                      <Image 
                        source={{ uri: CATEGORY_IMAGES[category.name] || 'https://images.unsplash.com/photo-1609952578538-3d454550301d?w=400&h=300&fit=crop' }}
                        style={styles.categoryImage}
                        resizeMode="cover"
                      />
                      <View style={styles.categoryGradient} />
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
            <Text style={styles.themeSubtitle}>Present Local Retail Shops to Digital Presence</Text>
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
                <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'merchant' && styles.activeTab]}
                onPress={() => setActiveTab('merchant')}
              >
                <Text style={[styles.tabText, activeTab === 'merchant' && styles.activeTabText]}>Merchant</Text>
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
                  <TouchableOpacity style={styles.purchaseButton} onPress={() => router.push('/register-member')}>
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
                  {
                    transform: [{ translateX: scrollX }],
                  },
                ]}
              >
                {[...DUMMY_NEARBY_SHOPS, ...DUMMY_NEARBY_SHOPS].map((shop, index) => (
                  <TouchableOpacity
                    key={`${shop.id}-${index}`}
                    style={styles.shopCard}
                    onPress={() => setShowRegistrationModal(true)}
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
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* Footer */}
        <Footer/>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 50,
  },
  userTypeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  userTypeBadgeText: {
    color: '#fe6f09',
    fontSize: 12,
    fontWeight: '700',
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
    color: '#fff',
    fontWeight: '700',
  },
  userPhone: {
    ...FontStylesWithFallback.caption,
    color: '#fff',
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  userPanelPhone: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
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
    marginHorizontal: -6,
    paddingHorizontal: 10,
  },
  categoryCard: {
    width: '33.33%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  categoryImageContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? 140 : 110,
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
    position: 'absolute',
    bottom: 10,
    left: 8,
    right: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    overflow: 'hidden',
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
  footer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
  },
  footerTagline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6600',
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
