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
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getPlans, getCategories, getShops } from '../utils/api';

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
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5 },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8 },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2 },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3 },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5 },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0 },
];

export default function UserDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { location } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  
  // Animation for auto-scrolling shops
  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172; // 160 + 12 (margin)
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  useEffect(() => {
    loadData();
    startAutoScroll();
  }, []);

  const startAutoScroll = () => {
    // Duplicate shops for seamless loop
    const animationDuration = TOTAL_WIDTH * 50; // Speed: lower = faster
    
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
      const [plansData, categoriesData] = await Promise.all([
        getPlans(),
        getCategories(),
      ]);
      setPlans(plansData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
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
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>INtown</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={24} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Grocery, Salon, Fashion..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999999"
            />
          </View>
          <Text style={styles.searchHint}>
            Search and click "View" to register as Member or Merchant
          </Text>
        </View>

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => setShowRegistrationModal(true)}
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

        {/* Membership Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Plans</Text>
          
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

        {/* Register as Merchant */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.merchantButton}
            onPress={() => router.push('/register-merchant')}
          >
            <Ionicons name="storefront" size={24} color="#FFFFFF" />
            <Text style={styles.merchantButtonText}>Register as Merchant</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Shops Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Shops</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DUMMY_NEARBY_SHOPS.map((shop) => (
              <TouchableOpacity
                key={shop.id}
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
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTagline}>
            Shop Local, Save Instantly! Connecting Communities Through Personal Bond.
          </Text>
          <Text style={styles.footerDescription}>
            India's most trusted local savings network, helping customers save instantly while enabling small businesses to thrive.
          </Text>
          <Text style={styles.footerCopyright}>
            Copyright © 2025, Yagnavihar Lifestyle Pvt. Ltd.
          </Text>
        </View>
      </ScrollView>

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
              <Text style={styles.modalButtonText}>Register as Member</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6600',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 12,
    color: '#666666',
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
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
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
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '500',
  },
  themeSection: {
    backgroundColor: '#FF6600',
    padding: 24,
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  themeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
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
    backgroundColor: '#EEEEEE',
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
