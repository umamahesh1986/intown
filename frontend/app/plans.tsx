import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getPlans } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How do I upgrade my plan?',
    a: 'You can upgrade your plan anytime from this page. The difference will be prorated for the remaining period.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of the billing period.',
  },
  {
    q: "What counts as an 'Eligible Order'?",
    a: "An Eligible Order is any purchase made at an INtown partner store using your active membership at the point of sale. Member-only discounts, Hidden Gems™ offers, and Circles™ group savings all qualify.",
  },
];

interface Plan {
  id: number;
  name: string;
  description: string;
  tagline?: string;     // headline above the card (e.g. "Your Neighborhood Has Better Deals...")
  subhead?: string;     // sub-headline inside the card (e.g. "Explore Local Like Never Before")
  cta?: string;         // button label override (e.g. "Get GO")
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

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
      name: 'INtown Go',
      description: 'Introductory Offer',
      tagline: 'Your Neighborhood Has Better Deals Than You Think.',
      subhead: 'Explore Local Like Never Before',
      cta: 'Get GO',
      price: 399,
      duration: '3 Months',
      savings: 500,
      features: [
        'Exclusive prices at partner stores',
        'Discover Hidden Gem Offers nearby',
        'Reserve products before visiting stores',
        'Save time, money, and effort on every purchase',
        'Access a growing network of trusted local businesses',
      ],
      isPopular: false,
    },
    {
      id: 3,
      name: 'INtown Plus',
      description: 'Best value for families',
      tagline: 'Together We Save More.',
      subhead: 'Unlock the Power of Local Connections',
      cta: 'Get PLUS',
      price: 599,
      duration: '6 Months',
      savings: 1500,
      features: [
        'Everything in GO',
        'Join INtown Circles™ and unlock group savings',
        'Access premium merchant offers',
        'Faster savings across multiple categories',
        'Early access to special campaigns and events',
      ],
      isPopular: true,
    },
    {
      id: 4,
      name: 'INtown Max',
      description: 'Ultimate savings experience',
      tagline: 'The Best of Your City. In One Plan.',
      subhead: "The VIP Pass to Your City's Best Kept Secrets",
      cta: 'Get Max',
      price: 999,
      duration: '12 Months',
      savings: 3000,
      features: [
        'Everything in Plus',
        'Unlimited access to Hidden Gems™ offers',
        'Smart Slots™ for service bookings',
        'Quick Reserve™ for hassle-free product pickup',
        'Priority access to new merchants and exclusive campaigns',
        'Maximum annual savings potential',
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

        {/* Why Subscribe Section (intro only — body broken into separate blocks below) */}
        <View style={styles.whySection}>
          <Text style={styles.whyMainTitle}>Why Subscribe to INtown?</Text>
          <Text style={styles.whyTagline}>Why pay extra for shopping?</Text>
          <Text style={styles.whyIntro}>
            With INtown, you enjoy exclusive discounts at trusted local stores while
            avoiding the hidden costs of modern retail.
          </Text>
        </View>

        {/* What You Save — compact list block */}
        <View style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <View style={[styles.blockHeaderIcon, { backgroundColor: '#FDECEA' }]}>
              <Ionicons name="cash-outline" size={20} color="#D32F2F" />
            </View>
            <Text style={styles.blockHeaderTitle}>What You Save</Text>
          </View>
          {[
            'No Delivery Charges',
            'No Convenience Fees',
            'No Packaging Charges',
            'No Small Order Fees',
            'No Peak-Time Charges',
            'No Parking Costs',
            'No Long Billing Queues',
            'No Waiting for Deliveries',
          ].map((item) => (
            <View key={item} style={styles.compactRow}>
              <Ionicons name="close-circle-outline" size={20} color="#D32F2F" />
              <Text style={styles.compactRowText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* What You Get — compact list block */}
        <View style={styles.blockCard}>
          <View style={styles.blockHeader}>
            <View style={[styles.blockHeaderIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="gift-outline" size={20} color="#0C8A4A" />
            </View>
            <Text style={styles.blockHeaderTitle}>What You Get</Text>
          </View>
          {[
            'Instant Discounts at Local Stores',
            'Order Now, Pick Up Later',
            'Book service slots in advance to avoid waiting',
            'Discover the Best Local Deals Near You',
            'Shop with Friends through Circles & Save More',
            'One Plan, Benefits Across Multiple Categories',
          ].map((item) => (
            <View key={item} style={styles.compactRow}>
              <Ionicons name="checkmark-circle" size={20} color="#0C8A4A" />
              <Text style={styles.compactRowText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Why It Matters — standalone card */}
        <View style={styles.matterCard}>
          <View style={styles.matterIconWrap}>
            <Ionicons name="sparkles" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.matterTitle}>Why It Matters</Text>
          <Text style={styles.matterText}>
            <Text style={styles.whyBoldOrange}>INtown</Text> → Instant savings, faster
            shopping, better local experiences
          </Text>
        </View>

        {/* The INtown Promise — standalone card */}
        <View style={styles.promiseCard}>
          <View style={styles.promiseIconWrap}>
            <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.promiseCardTitle}>The INtown Promise</Text>
          <Text style={styles.promiseCardHighlight}>
            Save More Than Your Subscription Fee — GUARANTEED.
          </Text>
          <Text style={styles.promiseCardText}>
            If not, we'll refund your subscription fee.
          </Text>
          <Text style={styles.promiseCardFooter}>
            For less than the cost of a few deliveries each month, INtown helps you unlock
            year-round savings and convenience at the stores you already trust.
          </Text>
          <Text style={styles.whySlogan}>"You Deserve More. Pay Less. Shop Local."</Text>
        </View>

        {/* Zero Transaction Fees card */}
        <View style={styles.zeroFeeCard}>
          <View style={styles.zeroFeeIconWrap}>
            <Ionicons name="people" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.zeroFeeTitle}>Zero Transaction Fees. Maximum Customer Value.</Text>
          <Text style={styles.zeroFeeText}>
            INtown does not charge merchants any transaction commissions or per-order fees.
            Instead, we encourage our merchant partners to pass those savings directly to
            customers through better prices, exclusive offers, rewards, and cashback. This
            creates a win-win ecosystem where businesses grow, customers save more, and
            local commerce thrives.
          </Text>
        </View>

        {/* Plans Grid */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const showPopular = isRegularUser ? false : plan.isPopular;
            return (
            <View key={plan.id} style={styles.planCardWrap}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  showPopular && styles.planCardPopular,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.85}
              >
                {showPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR • BEST VALUE</Text>
                  </View>
                )}

                {/* Tagline inside the card (top) */}
                {plan.tagline && (
                  <Text style={styles.planTagline}>{plan.tagline}</Text>
                )}

                <Text style={styles.planName}>{plan.name}</Text>
                {plan.subhead && (
                  <Text style={styles.planSubhead}>{plan.subhead}</Text>
                )}
                {plan.description && (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                )}

                <View style={styles.priceContainer}>
                  {plan.price === 0 ? (
                    <Text style={styles.planPrice}>Free</Text>
                  ) : (
                    <>
                      <Text style={styles.planCurrency}>₹</Text>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planGst}> + GST</Text>
                      <Text style={styles.planDuration}>  | {plan.duration}</Text>
                    </>
                  )}
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#0C8A4A" />
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
                >
                  <Text style={styles.subscribeButtonText}>
                    {plan.cta || 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
            );
          })}
        </View>

        {/* Safe & Secure */}
        <View style={styles.safeCard}>
          <Ionicons name="lock-closed" size={22} color="#0C8A4A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safeTitle}>Safe & Secure</Text>
            <Text style={styles.safeText}>
              All transactions are encrypted with bank-grade security protocols.
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          {FAQS.map((item, index) => {
            const open = openFaqIndex === index;
            return (
              <View key={item.q} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleFaq(index)}
                  testID={`faq-toggle-${index}`}
                >
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {open && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Still have questions? */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Our dedicated community success team is here to help you choose the right
            path for your business.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => {
              Linking.openURL('mailto:support@intownlocal.com?subject=INtown%20Support%20Request').catch(() => {});
            }}
            activeOpacity={0.85}
            testID="plans-contact-support-btn"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
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

  // Why Subscribe section (top of page)
  whySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  whyMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 32,
  },
  whyTagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 10,
  },
  whyIntro: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
  },
  whySubHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 12,
  },
  // Card-style row (matches screenshot 2)
  whyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E5C8',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  whyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  whyCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  whyBoldOrange: {
    fontWeight: '800',
    color: '#B45309',
  },
  whyMattersBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FCD9A0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  whyMattersText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 19,
  },
  promiseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#FCD9A0',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  promiseText: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  whyClosing: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 21,
    marginTop: 12,
  },
  whySlogan: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },

  // Generic block card used by "What You Save" / "What You Get"
  blockCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  blockHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  compactRowText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Why It Matters card
  matterCard: {
    backgroundColor: '#FFF7E6',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FCD9A0',
    alignItems: 'center',
  },
  matterIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  matterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  matterText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 21,
  },

  // The INtown Promise card
  promiseCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FCD9A0',
    alignItems: 'center',
  },
  promiseIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0C8A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  promiseCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  promiseCardHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 22,
  },
  promiseCardText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  promiseCardFooter: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  planCardWrap: { marginBottom: 8 },
  planTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#FFF6E5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  planCardSelected: { borderColor: '#FF8A00' },
  planCardPopular: {
    borderColor: '#FF8A00',
    backgroundColor: '#FFFAF5',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#FF8A00',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  popularBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planName: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  planSubhead: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  planDescription: { fontSize: 13, color: '#64748B', marginTop: 4 },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  planCurrency: { fontSize: 18, fontWeight: '700', color: '#FF8A00' },
  planPrice: { fontSize: 36, fontWeight: '800', color: '#FF8A00' },
  planGst: { fontSize: 14, fontWeight: '700', color: '#FF8A00', marginLeft: 4 },
  planDuration: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
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
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 21,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    lineHeight: 21,
  },

  // Zero Transaction Fees card
  zeroFeeCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F5E5C8',
    alignItems: 'center',
  },
  zeroFeeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  zeroFeeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  zeroFeeText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 21,
    textAlign: 'center',
  },

  // Safe & Secure card
  safeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  safeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  safeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  // Still have questions / Contact Support
  contactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 24,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
