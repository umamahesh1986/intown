import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { getCategories } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from '../components/Footer'
import { CATEGORY_ICON_MAP } from '../utils/categoryIconMap';



const { width } = Dimensions.get('window');
import { Platform } from 'react-native';

// ===== MEMBER CAROUSEL CONFIG =====
const SLIDE_WIDTH = Math.round(width);
const CAROUSEL_HEIGHT = 160;

const MEMBER_CAROUSEL_IMAGES = [
  require('../assets/images/1.jpg'),
  require('../assets/images/2.jpg'),
  require('../assets/images/3.jpg'),
  require('../assets/images/4.jpg'),
  require('../assets/images/5.jpg'),
  require('../assets/images/6.jpg'),
];
// =================================

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


const DUMMY_NEARBY_SHOPS = [
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5, rating: 4.5 },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8, rating: 4.7 },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2, rating: 4.3 },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3, rating: 4.8 },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5, rating: 4.2 },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0, rating: 4.6 },
];
const SEARCH_ITEMS = [
  'Grocery',
  'Vegetables',
  'Fruits',
  'Salon',
  'Restaurant',
  'Pharmacy',
  'Fashion',
  'Electronics',
];


const SEARCH_PRODUCTS = [
  'Tomato',
  'Onion',
  'Potato',
  'Apple',
  'Banana',
  'Milk',
  'Bread',
  'Rice',
  'Shampoo',
  'Soap',
];


interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function MemberDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userType?: string }>();
  const { user, logout } = useAuthStore();
  const [userType, setUserType] = useState<string>('Customer');

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [isSearchFocused, setIsSearchFocused] = useState(false);



  // photo state and uploading indicator
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172;
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // ===== MEMBER CAROUSEL STATE =====
const [carouselIndex, setCarouselIndex] = useState(0);
const carouselRef = useRef<ScrollView | null>(null);
// ================================


  useEffect(() => {
    loadCategories();
    startAutoScroll();
    loadUserType();
    // load cached local photo if exists
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('member_photo_uri');
        if (saved) setPhotoUri(saved);
      } catch (e) {
        // ignore
      }
      
    })();

    // ===== MEMBER CAROUSEL AUTO SLIDE =====
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
  return 'Customer';
};
 
 
  

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

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
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/');
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    } catch (error) {
      console.error('LOGOUT ERROR:', error);
      router.replace('/login');
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/member-shop-list', params: { query: searchQuery } });
    }
  };

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => setShowDropdown(false));
  };

  const toggleDropdown = () => {
    if (showDropdown) closeDropdown();
    else openDropdown();
  };

  const rawPlan = (user as any)?.membershipPlan;
  const currentPlan =
    rawPlan === 'IT Max' || rawPlan === 'IT Max Plus' ? rawPlan : 'IT Max';

  const memberId = (user as any)?.membershipId || 'ITM-9876-1234';
  const membershipValidTill =
    (user as any)?.membershipValidTill || '31 Dec 2025';

  // -------------- IMAGE PICKER HANDLERS ----------------
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Please grant photo library permissions to upload a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
aspect: [1, 1],
      });

      // handle new expo result shape (assets)
      const pickedUri =
        (result as any).assets?.[0]?.uri ??
        (result as any).uri ??
        null;

      // ✅ use .canceled (new API), not .cancelled
      if (!result.canceled && pickedUri) {
        setPhotoUri(pickedUri);
        await AsyncStorage.setItem('member_photo_uri', pickedUri); // cache locally
        uploadPhotoToServer(pickedUri);
      }
    } catch (err) {
      console.error('Image pick error', err);
    }
  };

  const uploadPhotoToServer = async (uri: string) => {
    setUploading(true);
    try {
      const form = new FormData();
      const filename = uri.split('/').pop() ?? 'photo.jpg';

      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // @ts-ignore — FormData file object
      form.append('photo', {
        uri,
        name: filename,
        type,
      });

      // Replace with your real API if needed
      const uploadUrl = 'https://your-api.example.com/members/upload-photo';

      /*
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: form,
      });
      const json = await res.json();
      console.log('Upload result', json);
      */

      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error('Upload error', err);
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../assets/images/intown-logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

           <TouchableOpacity onPress={toggleDropdown} style={styles.avatarButton}>
  {photoUri ? (
    <Image source={{ uri: photoUri }} style={styles.headerAvatar} />
  ) : (
    <View style={styles.headerAvatarPlaceholder}>
      <Ionicons name="person" size={20} color="#fff" />
    </View>
  )}
</TouchableOpacity>

          </View>

          {/* Membership Banner */}
          <View style={styles.membershipBanner}>
            <Ionicons name="ribbon-outline" size={18} color="#FF6600" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.membershipBannerTitle}>{currentPlan} Member</Text>
              <Text style={styles.membershipBannerSubtitle}>
                Enjoy instant savings at partnered local shops.
              </Text>
            </View>
          </View>

          

        {/* SEARCH */}
<TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
  <View style={styles.searchContainer}>

    <View style={styles.searchBox}>
      <Ionicons name="search" size={24} color="#999" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search for Grocery, Salon, Fashion..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);

          if (text.trim().length > 0) {
            const combined = [...SEARCH_ITEMS, ...SEARCH_PRODUCTS];
            const filtered = combined.filter(item =>
              item.toLowerCase().includes(text.toLowerCase())
            );

            setSuggestions(filtered);
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        }}
        onFocus={() => {
  router.push('/search');
}}

        onBlur={() => {
          setIsSearchFocused(false);
        }}
        onSubmitEditing={handleSearch}
        placeholderTextColor="#999"
      />
    </View>
    {showSuggestions && suggestions.length > 0 && (
      <View style={styles.suggestionBox}>
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={styles.suggestionItem}
            onPress={() => {
              setSearchQuery(item);
              setShowSuggestions(false);

              router.push({
                pathname: '/member-shop-list',
                params: { query: item },
              });
            }}
          >
            <Ionicons name="search" size={16} color="#666" />
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
</TouchableWithoutFeedback>

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




          {/* CATEGORIES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({
                      pathname: '/member-shop-list',
                      params: { category: category.name },
                    })
                  }
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
              ))}
            </View>
          </View>

          {/* THEME SECTION */}
          <View style={styles.themeSection}>
            <Text style={styles.themeTitle}>Transform Local Retail</Text>
            <Text style={styles.themeSubtitle}>
              Present Local Retail Shops to Digital Presence
            </Text>
          </View>

          {/* SAVINGS CALCULATOR */}
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
                />
              </View>

              <View style={styles.calculatorRow}>
                <Text style={styles.calculatorLabel}>Estimated Monthly Savings (10%)</Text>
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

          {/* NEARBY SHOPS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Shops</Text>

            <View style={styles.autoScrollContainer}>
              <Animated.View
                style={[
                  styles.autoScrollContent,
                  { transform: [{ translateX: scrollX }] },
                ]}
              >
                {[...DUMMY_NEARBY_SHOPS, ...DUMMY_NEARBY_SHOPS].map((shop, index) => (
                  <TouchableOpacity
                    key={`${shop.id}-${index}`}
                    style={styles.shopCard}
                    onPress={() =>
                      router.push({
                        pathname: '/member-shop-details',
                        params: { shopId: shop.id },
                      })
                    }
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
                        <Ionicons name="location" size={14} color="#666" />
                        <Text style={styles.distanceText}>{shop.distance} km</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* FOOTER */}
         <Footer/>
        </ScrollView>

        {/* BACKDROP */}
        {showDropdown && (
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}

        {/* MEMBER DROPDOWN PANEL */}
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
                ],
              },
            ]}
          >
            
              <View style={styles.userPanelHeader}>
  {photoUri ? (
    <Image source={{ uri: photoUri }} style={styles.panelAvatar} />
  ) : (
    <View style={styles.panelAvatarPlaceholder}>
      <Ionicons name="person" size={22} color="#fff" />
    </View>
  )}


              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userPanelName}>{user?.name ?? 'Member'}</Text>
                <Text style={styles.userPanelPhone}>{(user as any)?.phone ?? (user as any)?.email ?? ''}
</Text>
                <Text style={styles.userPanelTag}>Plan: {currentPlan}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push({ pathname: '/account' as any });

              }}
            >
              <Ionicons name="person-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>My Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
  style={styles.userPanelItem}
  onPress={() => {
    closeDropdown();
    router.push('/member-card');
  }}
>
  <Ionicons name="card-outline" size={22} color="#1A237E" />
  <Text style={styles.userPanelText}>Member Card</Text>
</TouchableOpacity>


            <TouchableOpacity
  style={styles.userPanelItem}
  onPress={() => {
    closeDropdown();
    router.push('/register-merchant');
  }}
>
  <Ionicons name="storefront-outline" size={22} color="#444" />
  <Text style={styles.userPanelText}>Become a Merchant</Text>
</TouchableOpacity>


           

        

            

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#FF0000" />
              <Text style={[styles.userPanelText, { color: '#FF0000' }]}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: { width: 140, height: 50 },
  userTypeBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  userTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
profileButton: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { alignItems: 'flex-end', marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  memberBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  memberBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },

  membershipBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBannerTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  membershipBannerSubtitle: { fontSize: 11, color: '#555' },

  memberCard: {
    margin: 16,
    backgroundColor: '#1A237E',
    borderRadius: 16,
    padding: 16,
  },
  memberCardLeft: { flex: 1 },
  memberCardLabel: { fontSize: 11, color: '#C5CAE9' },
  memberCardValue: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // avatar + upload
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#283593',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4C53A1',
  },
  avatar: { width: '100%', height: '100%' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

  searchContainer: { padding: 16, backgroundColor: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16 },

  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1A1A1A' },

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

  themeSection: {
    backgroundColor: '#FF6600',
    padding: 24,
    alignItems: 'center',
  },
  themeTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  themeSubtitle: { fontSize: 16, color: '#fff', marginTop: 6 },

  calculatorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calculatorLabel: { fontSize: 14, color: '#555', flex: 1 },
  calculatorInput: {
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#FF6600',
    paddingVertical: 4,
    textAlign: 'right',
    width: 100,
  },
  calculatorValue: { fontSize: 18, color: '#4CAF50', fontWeight: '600' },
  calculatorValueLarge: { fontSize: 24, color: '#4CAF50', fontWeight: '700' },

  autoScrollContainer: { overflow: 'hidden' },
  autoScrollContent: { flexDirection: 'row' },

  shopCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCardName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginTop: 8 },
  shopCardCategory: { fontSize: 12, color: '#777', marginTop: 2 },
  shopCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, marginLeft: 4 },
  distanceContainer: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 12, marginLeft: 4 },

  footer: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    alignItems: 'center',
  },
  footerTagline: { fontSize: 18, color: '#FF6600', fontWeight: '700', textAlign: 'center' },
  footerDescription: { color: '#ccc', fontSize: 14, textAlign: 'center', marginVertical: 16 },
  footerCopyright: { fontSize: 12, color: '#999' },

  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },

  userPanel: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2000,
  },

  userPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userPanelName: { fontSize: 16, fontWeight: '700' },
  userPanelPhone: { fontSize: 12, color: '#888', marginTop: 2 },
  userPanelTag: { fontSize: 12, color: '#FF6600', marginTop: 2, fontWeight: '600' },

  userPanelItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 6,
  borderRadius: 8,
},
 userPanelText: { fontSize: 15, marginLeft: 12, color: '#333' },
  suggestionBox: {
  backgroundColor: '#fff',
  borderRadius: 10,
  marginTop: 6,
  borderWidth: 1,
  borderColor: '#eee',
  overflow: 'hidden',
  zIndex: 20,
},
suggestionItem: {
  padding: 14,
  borderBottomWidth: 1,
  borderBottomColor: '#f2f2f2',
},
suggestionText: {
  fontSize: 15,
  color: '#333',
},
sectionLabel: {
  fontSize: 12,
  fontWeight: '600',
  color: '#999',
  marginVertical: 8,
},
avatarButton: {
  width: 38,
  height: 38,
  borderRadius: 19,
  overflow: 'hidden',
},

headerAvatar: {
  width: '100%',
  height: '100%',
  borderRadius: 19,
},

headerAvatarPlaceholder: {
  width: '100%',
  height: '100%',
  borderRadius: 19,
  backgroundColor: '#FF6600',
  alignItems: 'center',
  justifyContent: 'center',
},
panelAvatar: {
  width: 48,
  height: 48,
  borderRadius: 24,
},

panelAvatarPlaceholder: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#FF6600',
  alignItems: 'center',
  justifyContent: 'center',
},

// ===== MEMBER CAROUSEL STYLES =====
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
// =================================




});
