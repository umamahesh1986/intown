import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Image,
  Pressable, // 1. ADDED
  Platform,  // 2. ADDED
  Easing,    // 3. ADDED
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getCategories } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontStylesWithFallback } from '../utils/fonts';
import Footer from '../components/Footer';

const { width } = Dimensions.get('window');

const DUMMY_NEARBY_SHOPS = [
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5, rating: 4.5 },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8, rating: 4.7 },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2, rating: 4.3 },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3, rating: 4.8 },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5, rating: 4.2 },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0, rating: 4.6 },
];

interface Category {
  id: string;
  name: string;
  icon: string;
}

// --- SMART SHOP CARD COMPONENT (Matches User Dashboard) ---
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
    animateScale(1.1); // Scale to 1.1
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
        <View style={styles.shopCardFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFA500" />
            <Text style={styles.ratingText}>{shop.rating}</Text>
          </View>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color="#666666" />
            <Text style={styles.distanceText}>{shop.distance} km</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function MemberDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);

  // --- ADVANCED SCROLL STATE ---
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const isHovering = useRef(false);
  
  const CARD_WIDTH = 172;
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  useEffect(() => {
    loadCategories();
    startScrolling(0); // Start the advanced scroll
    return () => {
      scrollAnimation.current?.stop();
    };
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // --- PAUSABLE SCROLL LOGIC ---
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

  const calculateSavings = () => {
    const spend = parseFloat(monthlySpend) || 0;
    const monthlySavings = spend * 0.1;
    const annualSavings = monthlySavings * 12;
    return { monthlySavings, annualSavings };
  };

  const { monthlySavings, annualSavings } = calculateSavings();

  const handleLogout = async () => {
    setShowDropdown(false);
    try {
      await AsyncStorage.clear();
      await logout();
      router.replace('/');
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (error) {
      console.error('🔴 LOGOUT ERROR:', error);
      router.replace('/login');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/member-shop-list', params: { query: searchQuery } });
    }
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
            style={styles.profileButton}
            onPress={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>Member</Text>
              </View>
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
              <Text style={[styles.dropdownText, { color: '#FF0000' }]}>Logout</Text>
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
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/member-shop-list', params: { category: category.name } })}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={32} color="#FF6600" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
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

        {/* Nearby Shops Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Shops</Text>
          {/* --- UPDATE: Visible overflow for scaling --- */}
          <View style={styles.autoScrollContainer}>
            <Animated.View
              style={[
                styles.autoScrollContent,
                { transform: [{ translateX: scrollX }] },
              ]}
            >
              {/* --- UPDATE: Using ShopCard --- */}
              {[...DUMMY_NEARBY_SHOPS, ...DUMMY_NEARBY_SHOPS].map((shop, index) => (
                <ShopCard
                  key={`${shop.id}-${index}`}
                  shop={shop}
                  onInteractionChange={handleInteractionChange}
                  onPress={() => router.push({ pathname: '/member-shop-details', params: { shopId: shop.id } })}
                />
              ))}
            </Animated.View>
          </View>
        </View>

        <Footer />

        </ScrollView>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  logo: { width: 140, height: 50 },
  profileButton: { flexDirection: 'row', alignItems: 'center' },
  profileIconButton: { borderWidth: 2, borderColor: '#fff', padding: 4, borderRadius: 30 },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  memberBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  memberBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  dropdownMenu: { position: 'absolute', top: 70, right: 16, backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, zIndex: 1000, minWidth: 120 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { ...FontStylesWithFallback.body, marginLeft: 12, fontWeight: '500' },
  searchContainer: { padding: 16, backgroundColor: '#FFFFFF' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5FA', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  categoryCard: { width: '33.33%', padding: 8 },
  categoryIcon: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 12, color: '#1A1A1A', textAlign: 'center', fontWeight: '500' },
  themeSection: { backgroundColor: '#FF6600', padding: 24, alignItems: 'center' },
  themeTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  themeSubtitle: { fontSize: 16, color: '#FFFFFF', textAlign: 'center' },
  calculatorCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  calculatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calculatorLabel: { fontSize: 14, color: '#666666', flex: 1 },
  calculatorInput: { fontSize: 18, fontWeight: '600', color: '#FF6600', borderBottomWidth: 1, borderBottomColor: '#FF6600', paddingVertical: 4, paddingHorizontal: 8, minWidth: 100, textAlign: 'right' },
  calculatorValue: { fontSize: 18, fontWeight: '600', color: '#4CAF50' },
  calculatorValueLarge: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  
  // --- UPDATED FOR SCALING ---
  autoScrollContainer: { 
    overflow: 'visible',
    paddingVertical: 40, // Added padding for scale
  },
  autoScrollContent: { flexDirection: 'row' },
  shopCard: { 
    width: 160, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopImagePlaceholder: { width: '100%', height: 100, backgroundColor: '#FFF3E0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shopCardName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  shopCardCategory: { fontSize: 12, color: '#666666', marginBottom: 6 },
  shopCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, color: '#666666', marginLeft: 4, fontWeight: '600' },
  distanceContainer: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 12, color: '#666666', marginLeft: 4 },
});