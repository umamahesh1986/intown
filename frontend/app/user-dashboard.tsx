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
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getPlans, getCategories, getShops } from '../utils/api';
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
}

const { width } = Dimensions.get('window');

// ------------------- RESPONSIVE CAROUSEL DIMENSION ADJUSTMENT -------------------
const slideWidth = width;

const CAROUSEL_NATIVE_HEIGHT = 160;

const CAROUSEL_ASPECT_RATIO = width > 800 ? 3 / 1 : 4 / 3;

const CAROUSEL_HEIGHT = Platform.select({
  web: slideWidth / CAROUSEL_ASPECT_RATIO,
  default: CAROUSEL_NATIVE_HEIGHT,
});
// ---------------------------------------------------------------------------------

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

export default function UserDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const anyUser = user as any; // to safely read optional fields like dob, gender
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

  // NEW states for language options
  const [language, setLanguage] = useState<string>('English');
  const [showLangOptions, setShowLangOptions] = useState<boolean>(false);

  // Dropdown animation value
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Referral states
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);
  const autoPlayTimer = useRef<number | null>(null);

  // Animation for auto-scrolling shops
  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172; // 160 + 12 (margin)
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  // Pulse animation for banner
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Generate simple referral code from user data (fallback safe)
  const referralCode =
    user?.referralCode ??
    (user?.id
      ? `INT${String(user.id).slice(0, 6).toUpperCase()}`
      : user?.phone
      ? `INT${user.phone.slice(-6)}`
      : `INTOWN-000001`);
  const referralLink = `https://intownlocal.example/signup?ref=${encodeURIComponent(
    referralCode
  )}`;

  useEffect(() => {
    loadData();
    startAutoScroll();
    startCarouselAutoplay();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      stopCarouselAutoplay();
    };
  }, []);

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
      setCategories(
        categoriesData && categoriesData.length > 0 ? categoriesData : DUMMY_CATEGORIES
      );
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
    Animated.timing(dropdownAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
      () => {
        setShowDropdown(false);
        router.replace('/login');
      }
    );
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
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 200);
  };

  // ----------------- CAROUSEL AUTOPLAY -----------------
  const startCarouselAutoplay = () => {
    stopCarouselAutoplay();
    autoPlayTimer.current = setInterval(() => {
      setCarouselIndex(prevIndex => {
        const next = (prevIndex + 1) % CAROUSEL_IMAGES.length;
        scrollToIndex(next);
        return next;
      });
    }, 3500) as unknown as number;
  };

  const stopCarouselAutoplay = () => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  };

  const scrollToIndex = (index: number) => {
    setCarouselIndex(index);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ x: index * slideWidth, animated: true });
    }
  };

  const onCarouselScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / slideWidth);
    setCarouselIndex(idx);
  };
  // -----------------------------------------------------

  // -------- Referral helpers ----------
  const copyReferralToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const shareReferral = async () => {
    try {
      setSharing(true);
      await Share.share({
        message: `Join me on IntownLocal! Use my referral code ${referralCode} to sign up and get rewards: ${referralLink}`,
        url: referralLink,
        title: 'Join IntownLocal',
      });
    } catch (err) {
      console.warn('Share failed', err);
    } finally {
      setSharing(false);
    }
  };
  // ------------------------------------

  const bannerPulse = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
    shadowOpacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.18],
    }),
  };

  // language options simple array
  const LANGS = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Marathi'];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPress={() => {
          // close dropdown on outside press
          if (showDropdown) {
            toggleDropdown();
          }
          if (showLangOptions) {
            setShowLangOptions(false);
          }
        }}
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
              onPress={e => {
                e.stopPropagation();
                toggleDropdown(e);
              }}
              style={styles.profileButton}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name}</Text>
                <Text style={styles.userPhone}>{user?.phone}</Text>
              </View>
              <Ionicons
                name="person"
                size={20}
                color="#ffffff"
                style={styles.profileIconButton}
              />
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
                    {user?.phone ?? user?.email ?? ''}
                  </Text>
                </View>
              </View>

             

              {/* MENU ROWS (cleaned) */}
              <TouchableOpacity
                style={styles.userPanelItem}
                onPress={() => {
                  toggleDropdown();
                  router.push('/account');
                }}
              >
                <Ionicons name="person-outline" size={22} color="#444" />
                <Text style={styles.userPanelText}>My Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userPanelItem}
                onPress={() => {
                  toggleDropdown();
                  router.push('/addresses');
                }}
              >
                <Ionicons name="location-outline" size={22} color="#444" />
                <Text style={styles.userPanelText}>My Addresses</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.userPanelItem}
                onPress={() => {
                  toggleDropdown();
                  router.push('/notifications');
                }}
              >
                <Ionicons name="notifications-outline" size={22} color="#444" />
                <Text style={styles.userPanelText}>Notifications</Text>
              </TouchableOpacity>

              {/* Language (kept) */}
              <TouchableOpacity
                style={[styles.userPanelItem, { justifyContent: 'space-between' }]}
                onPress={() => setShowLangOptions(prev => !prev)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="language-outline" size={22} color="#444" />
                  <Text style={[styles.userPanelText, { marginLeft: 12 }]}>Language</Text>
                </View>
                <Text style={{ color: '#777', fontSize: 13 }}>{language}</Text>
              </TouchableOpacity>

              {showLangOptions && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F5F5F5',
                  }}
                >
                  {LANGS.map(lng => (
                    <TouchableOpacity
                      key={lng}
                      style={{ paddingVertical: 8, paddingHorizontal: 6 }}
                      onPress={() => {
                        setLanguage(lng);
                        setShowLangOptions(false);
                      }}
                    >
                      <Text
                        style={{
                          color: language === lng ? '#FF6600' : '#333',
                          fontWeight: language === lng ? '700' : '500',
                        }}
                      >
                        {lng}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.userPanelItem, { marginTop: 6 }]}
                onPress={() => {
                  toggleDropdown();
                  router.push('/register-merchant');
                }}
              >
                <Ionicons name="storefront-outline" size={22} color="#444" />
                <Text style={styles.userPanelText}>Become a Merchant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.userPanelItem, { marginTop: 6 }]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF0000" />
                <Text style={[styles.userPanelText, { color: '#FF0000' }]}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Improved Referral Banner */}
          <View style={styles.bannerRow}>
            <Animated.View style={[styles.referralBannerAlt, bannerPulse]}>
              <View style={styles.referralLeftAlt}>
                <View style={styles.badge}>
                  <Ionicons name="gift" size={18} color="#FFFFFF" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.referralTitleAlt}>Refer & Earn ₹100</Text>
                  <Text style={styles.referralSubtitleAlt}>
                    Share your code — your friend gets a welcome bonus
                  </Text>
                </View>
              </View>

              <View style={styles.referralActionsAlt}>
                <TouchableOpacity style={styles.iconButton} onPress={copyReferralToClipboard}>
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy'}
                    size={18}
                    color="#FF6600"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconButton, { marginLeft: 10 }]}
                  onPress={shareReferral}
                >
                  <Ionicons name="share-social" size={18} color="#FF6600" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={24}
                color="#999999"
                style={styles.searchIcon}
              />
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
              onPress={e => e.stopPropagation()}
            >
              <View style={styles.searchDropdown}>
                {filteredCategories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.searchDropdownItem}
                    onPress={() => setShowRegistrationModal(true)}
                  >
                    <View style={styles.searchDropdownItemContent}>
                      <View style={styles.searchDropdownItemLeft}>
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color="#FF6600"
                        />
                        <Text style={styles.searchDropdownItemText}>
                          {category.name}
                        </Text>
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

          {/* ===================== CAROUSEL ===================== */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={slideWidth}
              decelerationRate="fast"
              onMomentumScrollEnd={e => {
                onCarouselScrollEnd(e);
                startCarouselAutoplay();
              }}
              contentContainerStyle={{}}
              onScrollBeginDrag={stopCarouselAutoplay}
            >
              {CAROUSEL_IMAGES.map((imgSrc, idx) => (
                <View key={idx} style={styles.carouselSlide}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.carouselTouchable}
                    onPress={() => {
                      /* handle click if needed */
                    }}
                  >
                    <Image
                      source={imgSrc}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Dots */}
            <View style={styles.dotsRow}>
              {CAROUSEL_IMAGES.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, carouselIndex === i ? styles.dotActive : null]}
                />
              ))}
            </View>
          </View>
          {/* =================== End Carousel =================== */}

          {/* Popular Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.length > 0 ? (
                categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => setShowRegistrationModal(true)}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={category.icon as any}
                        size={32}
                        color="#FF6600"
                      />
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
                <Text style={styles.calculatorLabel}>
                  Estimated Monthly Savings (10%)
                </Text>
                <Text style={styles.calculatorValue}>
                  ₹{monthlySavings.toFixed(0)}
                </Text>
              </View>
              <View style={styles.calculatorRow}>
                <Text style={styles.calculatorLabel}>Estimated Annual Savings</Text>
                <Text style={styles.calculatorValueLarge}>
                  ₹{annualSavings.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>

          {/* === Improved Referral Card === */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refer & Earn</Text>

            <View style={styles.referralCardAlt}>
              <View style={styles.refHeader}>
                <View>
                  <Text style={styles.referralCardTitleAlt}>
                    Invite friends — get rewarded
                  </Text>
                  <Text style={styles.referralCardSubAlt}>
                    Track referrals & rewards here
                  </Text>
                </View>
                <View style={styles.refBadgeWrap}>
                  <Text style={styles.refBadgeText}>₹100 / successful</Text>
                </View>
              </View>

              <View style={styles.codeBox}>
                <View style={styles.codeLeft}>
                  <Text style={styles.referralCodeLabel}>Your code</Text>
                  <Text style={styles.referralCodeTextAlt}>{referralCode}</Text>
                </View>

                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={styles.copySmall}
                    onPress={copyReferralToClipboard}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy'}
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareSmall}
                    onPress={shareReferral}
                  >
                    <Ionicons
                      name="share-social"
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.linkBox}>
                <Text numberOfLines={1} style={styles.referralLinkTextAlt}>
                  {referralLink}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setStringAsync(referralLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                >
                  <Text style={styles.linkCopyText}>
                    {copied ? 'Copied' : 'Copy link'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.referralStatsRowAlt}>
                <View style={styles.refStatAlt}>
                  <Text style={styles.refStatNumberAlt}>0</Text>
                  <Text style={styles.refStatLabelAlt}>Joined</Text>
                </View>
                <View style={styles.refStatAlt}>
                  <Text style={styles.refStatNumberAlt}>₹0</Text>
                  <Text style={styles.refStatLabelAlt}>Rewards</Text>
                </View>
                <View style={styles.refStatAlt}>
                  <Text style={styles.refStatNumberAlt}>3</Text>
                  <Text style={styles.refStatLabelAlt}>Pending</Text>
                </View>
              </View>
            </View>
          </View>
          {/* === End Improved Referral Card === */}

          {/* Membership Plans (section kept) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membership Plans</Text>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
                onPress={() => setActiveTab('customer')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'customer' && styles.activeTabText,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'merchant' && styles.activeTab]}
                onPress={() => setActiveTab('merchant')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'merchant' && styles.activeTabText]}
                >
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
                    Premium individual membership with exclusive benefits and unlimited
                    access to all partner stores.
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
                    Premium couple membership with exclusive benefits and unlimited
                    access to all partner stores.
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
                    Grow your business with our merchant friendly platform that puts you in
                    your control.
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
                    <Text style={styles.registerMerchantButtonText}>
                      Register as Merchant
                    </Text>
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
                      <Text style={styles.shopCardDistanceText}>
                        {shop.distance} km
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTagline}>
              Shop Local, Save Instantly! Connecting Communities Through Personal Bond.
            </Text>
            <Text style={styles.footerDescription}>
              India's most trusted local savings network, helping customers save instantly
              while enabling small businesses to thrive.
            </Text>
            <Text style={styles.footerCopyright}>
              Copyright © 2025, Yagnavihar Lifestyle Pvt. Ltd.
            </Text>
          </View>
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

// -------------------- styles --------------------
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

  /* --- userPanel styles --- */
  userPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 300,
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

  userDetailsBox: {
    marginTop: 12,
    backgroundColor: '#FFF7F0',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },

  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  userDetailLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginLeft: 6,
    width: 70,
  },

  userDetailValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 4,
  },
  /* --- end userPanel styles --- */

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

  // referral banner (improved)
  bannerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  referralBannerAlt: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FFF1E6',
  },
  referralLeftAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6600',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  referralTitleAlt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  referralSubtitleAlt: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },

  referralActionsAlt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE5D1',
  },

  // ---------- CAROUSEL STYLES ----------
  carouselWrapper: {
    marginTop: 12,
    marginBottom: 8,
    height: (CAROUSEL_HEIGHT as number) + 16,
  },
  carouselSlide: {
    width: slideWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselTouchable: {
    width: '100%',
    alignItems: 'center',
  },
  carouselImage: {
    width: slideWidth - 32,
    ...Platform.select({
      web: {
        aspectRatio: CAROUSEL_ASPECT_RATIO,
        maxHeight: 260,
      },
      default: {
        height: CAROUSEL_NATIVE_HEIGHT,
        maxHeight: 180,
      },
    }),
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
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
  // -------------------------------------

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

  // referral card styles (improved)
  referralCardAlt: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  refHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralCardTitleAlt: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  referralCardSubAlt: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  refBadgeWrap: {
    backgroundColor: '#FFF7F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE5D1',
  },
  refBadgeText: {
    color: '#FF6600',
    fontWeight: '700',
  },

  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF9F6',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFF0E6',
  },
  codeLeft: {
    flex: 1,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: '#777',
  },
  referralCodeTextAlt: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6600',
    marginTop: 6,
  },

  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  copySmall: {
    backgroundColor: '#FF6600',
    padding: 8,
    borderRadius: 10,
    marginLeft: 6,
  },
  shareSmall: {
    backgroundColor: '#FF6600',
    padding: 8,
    borderRadius: 10,
    marginLeft: 8,
  },

  linkBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  referralLinkTextAlt: {
    flex: 1,
    color: '#333',
    marginRight: 12,
  },
  linkCopyText: {
    color: '#FF6600',
    fontWeight: '700',
  },

  referralStatsRowAlt: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  refStatAlt: {
    alignItems: 'center',
    flex: 1,
  },
  refStatNumberAlt: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  refStatLabelAlt: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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

