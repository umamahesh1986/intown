// member-dashboard.tsx — Expo + Image Picker + Member Photo
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { getCategories } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function MemberDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlySpend, setMonthlySpend] = useState('10000');
  const [showDropdown, setShowDropdown] = useState(false);

  // photo state and uploading indicator
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const CARD_WIDTH = 172;
  const TOTAL_WIDTH = DUMMY_NEARBY_SHOPS.length * CARD_WIDTH;

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCategories();
    startAutoScroll();
    // load cached local photo if exists
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('member_photo_uri');
        if (saved) setPhotoUri(saved);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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
      const filename = uri.split('/').pop() ?? `photo.jpg`;
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
            <Image
              source={require('../assets/images/intown-logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            <TouchableOpacity style={styles.profileButton} onPress={toggleDropdown}>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name ?? 'Member'}</Text>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>Member</Text>
                </View>
              </View>
              <Ionicons name="person" size={22} color="#fff" />
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

          {/* DIGITAL MEMBER CARD (with avatar) */}
          <View style={styles.memberCard}>
            <View style={styles.memberCardLeft}>
              <View style={styles.row}>
                {/* avatar */}
                <View style={styles.avatarWrap}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={28} color="#fff" />
                    </View>
                  )}
                </View>

                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.memberCardLabel}>Member Name</Text>
                  <Text style={styles.memberCardValue}>{user?.name ?? 'Member'}</Text>
                  <Text style={[styles.memberCardLabel, { marginTop: 6 }]}>Plan</Text>
                  <Text style={styles.memberCardValue}>{currentPlan}</Text>
                </View>
              </View>

              <Text style={[styles.memberCardLabel, { marginTop: 12 }]}>Member ID</Text>
              <Text style={styles.memberCardValue}>{memberId}</Text>

              <Text style={[styles.memberCardLabel, { marginTop: 8 }]}>Valid Till</Text>
              <Text style={styles.memberCardValue}>{membershipValidTill}</Text>

              {/* upload button */}
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading}>
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={16} color="#fff" />
                      <Text style={styles.uploadBtnText}> Upload Photo</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadBtn, { marginLeft: 10, backgroundColor: '#eee' }]}
                  onPress={async () => {
                    setPhotoUri(null);
                    await AsyncStorage.removeItem('member_photo_uri');
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#333" />
                  <Text style={[styles.uploadBtnText, { color: '#333' }]}> Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={24} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for Grocery, Salon, Fashion..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholderTextColor="#999"
              />
            </View>
          </View>

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
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon as any} size={32} color="#FF6600" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
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
              <Ionicons name="person-circle" size={48} color="#FF6600" />

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userPanelName}>{user?.name ?? 'Member'}</Text>
                <Text style={styles.userPanelPhone}>{user?.phone ?? user?.email}</Text>
                <Text style={styles.userPanelTag}>Plan: {currentPlan}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/account');
              }}
            >
              <Ionicons name="person-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>My Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/register-member');
              }}
            >
              <Ionicons name="card-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>Membership Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/addresses');
              }}
            >
              <Ionicons name="location-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>My Addresses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
                router.push('/notifications');
              }}
            >
              <Ionicons name="notifications-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userPanelItem}
              onPress={() => {
                closeDropdown();
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color="#444" />
              <Text style={styles.userPanelText}>Help & Support</Text>
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
  logo: { width: 140, height: 50 },
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

  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  categoryCard: { width: '33%', padding: 8 },
  categoryIcon: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: { fontSize: 12, textAlign: 'center', color: '#1A1A1A' },

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
  },
  userPanelText: { fontSize: 15, marginLeft: 12, color: '#333' },
});
