import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getPlans } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
  savings: number;
  features: string[];
  isPopular?: boolean;
}

export default function Plans() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isRegularUser, setIsRegularUser] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      const storedType = await AsyncStorage.getItem('user_type');
      const userType = user?.userType || storedType || '';
      const lower = userType.toLowerCase();
      if (lower === 'user' || lower === 'new_user' || lower === 'new' || lower === '') {
        setIsRegularUser(true);
      }
    };
    checkUserType();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const plansData = await getPlans();
      if (plansData && Array.isArray(plansData) && plansData.length > 0) {
        setPlans(plansData);
      } else {
        // Fallback plans if API doesn't return data or returns empty
        setPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Set fallback plans on error
      setPlans(getDefaultPlans());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getDefaultPlans = (): Plan[] => [
    // {
    //   id: 1,
    //   name: 'Basic',
    //   description: 'Perfect for getting started',
    //   price: 0,
    //   duration: ' Free',
    //   savings: 100,
    //   features: ['Access to partner stores', 'Basic savings', 'Transaction history'],
    // },
    {
      id: 2,
      name: 'Silver',
      description: 'Introductory Offer',
      price: 399,
      duration: ' 3 Months',
      savings: 500,
      features: [
        // 'All Basic features',
        // '5% extra savings',
        // 'Priority support',
        // 'Exclusive deals',
      ],
      isPopular: true,
    },
    {
      id: 3,
      name: 'Gold',
      description: 'Best value for families',
      price: 599,
      duration: ' 6 Months',
      savings: 1500,
      features: [
        // 'All Silver features',
        // '10% extra savings',
        // 'Family sharing (up to 4)',
        // 'Premium partner access',
        // 'Cashback rewards',
      ],
      isPopular: false,
    },
    {
      id: 4,
      name: 'Platinum',
      description: 'Ultimate savings experience',
      price: 999,
      duration: ' Year',
      savings: 3000,
      features: [
        // 'All Gold features',
        // '15% extra savings',
        // 'Unlimited family members',
        // 'VIP merchant access',
        // 'Personal savings advisor',
        // 'Early access to new features',
      ],
    },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlans();
  }, []);

  const handleSelectPlan = (planId: number) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = (plan: Plan) => {
    router.push({
      pathname: '/checkout',
      params: {
        planId: String(plan.id),
        planName: plan.name,
        planPrice: String(plan.price),
        planDuration: plan.duration,
        planCode: plan.id === 2 ? 'QUARTERLY' : plan.id === 3 ? 'SEMI_ANNUAL' : 'ANNUAL',
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A00']} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="diamond" size={48} color="#FF8A00" />
          <Text style={styles.heroTitle}>Unlock More Savings</Text>
          <Text style={styles.heroSubtitle}>
            Choose a plan that fits your needs and start saving more on every purchase
          </Text>
        </View>

        {/* Plans Grid */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const showPopular = isRegularUser ? false : plan.isPopular;
            return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                showPopular && styles.planCardPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              activeOpacity={0.8}
            >
              {showPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Current Plan</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              {/* <Text style={styles.planDescription}>{plan.description}</Text> */}

              <View style={styles.priceContainer}>
                {plan.price === 0 ? (
                  <Text style={styles.planPrice}>Free</Text>
                ) : (
                  <>
                    <Text style={styles.planCurrency}>₹</Text>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planDuration}>/{plan.duration}</Text>
                  </>
                )}
              </View>

              {/* <View style={styles.savingsContainer}>
                <Ionicons name="trending-up" size={16} color="#4CAF50" />
                <Text style={styles.savingsText}>
                  Est. Savings: ₹{plan.savings}/month
                </Text>
              </View> */}

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  plan.price === 0 && styles.subscribeButtonFree,
                  showPopular && styles.subscribeButtonPopular,
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={showPopular}
              >
                <Text
                  style={[
                    styles.subscribeButtonText,
                    showPopular && styles.subscribeButtonTextFree,
                  ]}
                >
                  {showPopular ? 'Subscribed Plan' : 'Subscribe Now'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
            );
          })}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Subscribe?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="cash" size={24} color="#FF8A00" />
              </View>
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Extra Savings</Text>
                <Text style={styles.benefitText}>
                  Get additional discounts on top of regular savings
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="people" size={24} color="#FF8A00" />
              </View>
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Family Sharing</Text>
                <Text style={styles.benefitText}>
                  Share benefits with your family members
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="star" size={24} color="#FF8A00" />
              </View>
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Exclusive Deals</Text>
                <Text style={styles.benefitText}>
                  Access members-only offers and promotions
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name="headset" size={24} color="#FF8A00" />
              </View>
              <View style={styles.benefitInfo}>
                <Text style={styles.benefitTitle}>Priority Support</Text>
                <Text style={styles.benefitText}>
                  Get faster responses from our support team
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Why do I upgrade my plan?</Text>
            <Text style={styles.faqAnswer}>
              You get a privilage access at your local stores in entire year.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I upgrade my plan?</Text>
            <Text style={styles.faqAnswer}>
              You can upgrade your plan anytime from this page. The difference will be
              prorated for the remaining period.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. Your benefits will
              continue until the end of the billing period.
            </Text>
          </View>

          {/* <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is my payment secure?</Text>
            <Text style={styles.faqAnswer}>
              Yes, all payments are processed through secure payment gateways with
              end-to-end encryption.
            </Text>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  content: { flex: 1 },
  heroSection: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginTop: 12 },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  plansContainer: { padding: 16, gap: 16 },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: { borderColor: '#FF8A00' },
  planCardPopular: {
    borderColor: '#FF8A00',
    backgroundColor: '#FFFAF5',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  planDescription: { fontSize: 14, color: '#666', marginTop: 4 },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  planCurrency: { fontSize: 18, fontWeight: '600', color: '#FF8A00' },
  planPrice: { fontSize: 36, fontWeight: 'bold', color: '#FF8A00' },
  planDuration: { fontSize: 14, color: '#999', marginLeft: 4 },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  savingsText: { fontSize: 12, color: '#4CAF50', marginLeft: 6, fontWeight: '500' },
  featuresContainer: { marginTop: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 14, color: '#666', marginLeft: 10, flex: 1 },
  subscribeButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  subscribeButtonFree: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  subscribeButtonPopular: { backgroundColor: '#F7EFE6' },
  subscribeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  subscribeButtonTextFree: { color: '#FF8A00' },
  benefitsSection: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  benefitsList: { gap: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'flex-start' },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitInfo: { marginLeft: 12, flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  benefitText: { fontSize: 14, color: '#666', marginTop: 4 },
  faqSection: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  faqTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 16,
    marginBottom: 16,
  },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  faqAnswer: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 22 },
});
