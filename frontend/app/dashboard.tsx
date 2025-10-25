import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
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
  savings: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { location } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }
    router.push({ pathname: '/map', params: { category: searchQuery } });
  };

  const handleFindShops = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location to find nearby shops');
      return;
    }
    router.push('/map');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
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
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#FF6600" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={24} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for categories or shops..."
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
                onPress={() => router.push({ pathname: '/map', params: { category: category.name } })}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={32} color="#FF6600" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>₹{plan.pricePerMonth}/mo</Text>
              </View>
              <View style={styles.planBenefits}>
                {plan.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.savingsBox}>
                <Text style={styles.savingsText}>
                  Estimated Savings: ₹{plan.savings}/month
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planButton}
                onPress={() =>
                  router.push({
                    pathname: '/payment',
                    params: { planId: plan.id, amount: plan.pricePerMonth, type: 'plan' },
                  })
                }
              >
                <Text style={styles.planButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Find Nearby Shops Button */}
        <TouchableOpacity style={styles.findShopsButton} onPress={handleFindShops}>
          <Ionicons name="location" size={24} color="#FFFFFF" />
          <Text style={styles.findShopsText}>Find Nearby Shops</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerLeft: {},
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userPhone: {
    fontSize: 12,
    color: '#666666',
  },
  logoutButton: {
    marginTop: 4,
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
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6600',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  planBenefits: {
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  savingsBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  planButton: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  findShopsButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findShopsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
