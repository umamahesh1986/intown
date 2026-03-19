import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/formatDistance';
import { extractImageUrls } from '../utils/api';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';
import PaymentModal from '../components/PaymentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ShopData {
  id: number;
  businessName: string;
  contactName: string;
  address: string;
  phoneNumber: string;
  email: string;
  pincode: number;
  userType: string;
  businessCategory: string;
  description: string;
  fromYears: string;
  branchesOfBusiness: string;
  longitude: number;
  latitude: number;
  s3ImageUrl: Array<{
    id: string;
    fileName: string;
    isPrimary: boolean;
    s3ImageUrl: string;
  }>;
  distance: number;
}

export default function MemberShopDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shopId?: string; categoryId?: string; source?: string }>();
  const shopId = params.shopId;
  const categoryId = params.categoryId;
  const source = params.source;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocationStore((state) => state.location);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);
  const { user } = useAuthStore();

  const redirectTo = source === 'dual' ? '/dual-dashboard' : '/member-dashboard';
  const isUserFlow = source === 'user';

  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Image carousel state
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [shopImageIndex, setShopImageIndex] = useState(0);
  const shopImageScrollRef = useRef<ScrollView | null>(null);
  const shopImageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SHOP_IMAGE_WIDTH = Dimensions.get('window').width;

  // Fetch shop details from API
  const fetchShopDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadLocationFromStorage();
      const storedLocation = useLocationStore.getState().location;
      // Use stored location or default to Hyderabad coordinates
      const lat = storedLocation?.latitude ?? location?.latitude ?? 17.4939602;
      const lng = storedLocation?.longitude ?? location?.longitude ?? 78.4008412;

      // Build API URL
      let apiUrl = `https://api.intownlocal.com/IN/search/by-product-names?customerLatitude=${lat}&customerLongitude=${lng}`;
      if (categoryId) {
        apiUrl += `&categoryId=${categoryId}`;
      }

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch shop details');
      }

      const data = await res.json();
      const shopList = Array.isArray(data) ? data : [];

      // Find the shop by ID
      const foundShop = shopList.find((s: ShopData) => String(s.id) === String(shopId));

      if (foundShop) {
        setShop(foundShop);
        // Extract images
        const images = extractImageUrls(foundShop.s3ImageUrl);
        setShopImages(images);
      } else {
        setError('Shop not found');
      }
    } catch (err: any) {
      console.error('Error fetching shop details:', err);
      // CORS error on web - show friendly message
      if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Unable to load shop details. Please use the mobile app for full functionality.');
      } else {
        setError(err.message || 'Failed to load shop details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchShopDetails();
    }
  }, [shopId, categoryId]);

  // Load customer ID on mount
  useEffect(() => {
    const loadCustomerId = async () => {
      try {
        const storedCustomerId = await AsyncStorage.getItem('customer_id');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customer id:', error);
      }
    };
    loadCustomerId();
  }, []);

  // Image carousel auto-scroll
  useEffect(() => {
    if (shopImages.length <= 1) return;
    if (shopImageTimerRef.current) {
      clearInterval(shopImageTimerRef.current);
    }
    shopImageTimerRef.current = setInterval(() => {
      setShopImageIndex((prev) => (prev + 1) % shopImages.length);
    }, 3000);
    return () => {
      if (shopImageTimerRef.current) {
        clearInterval(shopImageTimerRef.current);
      }
    };
  }, [shopImages]);

  useEffect(() => {
    if (!shopImageScrollRef.current || shopImages.length === 0) return;
    shopImageScrollRef.current.scrollTo({
      x: shopImageIndex * SHOP_IMAGE_WIDTH,
      animated: true,
    });
  }, [shopImageIndex, shopImages.length, SHOP_IMAGE_WIDTH]);

  const handlePrevShopImage = () => {
    if (shopImages.length === 0) return;
    setShopImageIndex((prev) => (prev === 0 ? shopImages.length - 1 : prev - 1));
  };

  const handleNextShopImage = () => {
    if (shopImages.length === 0) return;
    setShopImageIndex((prev) => (prev + 1) % shopImages.length);
  };

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
  };

  const renderShopImageCarousel = () => {
    if (shopImages.length === 0) {
      return <Ionicons name="storefront" size={100} color="#FF8A00" />;
    }
    return (
      <>
        <ScrollView
          ref={shopImageScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SHOP_IMAGE_WIDTH);
            setShopImageIndex(index);
          }}
        >
          {shopImages.map((img, index) => (
            <TouchableOpacity
              key={`${img}-${index}`}
              activeOpacity={0.9}
              onPress={() => setFullscreenImage(img)}
            >
              <Image
                source={{ uri: img }}
                style={[styles.shopImageFull, { width: SHOP_IMAGE_WIDTH }]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {shopImages.length > 1 && (
          <>
            <TouchableOpacity
              style={[styles.shopArrow, styles.shopArrowLeft]}
              onPress={handlePrevShopImage}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shopArrow, styles.shopArrowRight]}
              onPress={handleNextShopImage}
            >
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}
      </>
    );
  };

  const getCategoryBadge = (category?: string) => {
    const badges: Record<string, { bg: string; color: string; label: string }> = {
      restaurant: { bg: '#FFF3E0', color: '#FF8A00', label: 'Restaurant' },
      grocery: { bg: '#E8F5E9', color: '#4CAF50', label: 'Grocery' },
      salon: { bg: '#F3E5F5', color: '#9C27B0', label: 'Salon' },
      pharmacy: { bg: '#E3F2FD', color: '#2196F3', label: 'Pharmacy' },
      electronics: { bg: '#ECEFF1', color: '#607D8B', label: 'Electronics' },
      dairy: { bg: '#FFF8E1', color: '#FF8F00', label: 'Dairy' },
    };
    const key = (category ?? '').toLowerCase().split(' ')[0];
    return badges[key] ?? { bg: '#FFF3E0', color: '#FF8A00', label: category || 'General' };
  };

  const handleUserTap = () => {
    if (isUserFlow) setShowRegistrationModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading shop details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="storefront" size={40} color="#FF8A00" />
          <Text style={styles.loadingText}>{error || 'Shop not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = getCategoryBadge(shop.businessCategory);
  // Get logged-in user's phone number
  const userPhone = user?.phone || user?.phoneNumber || 'Not available';

  const ShopContent = () => (
    <ScrollView>
      <View style={styles.shopImage}>
        {renderShopImageCarousel()}
      </View>

      <View style={styles.content}>
        {/* Business Name & Category Badge */}
        <View style={styles.titleRow}>
          <Text style={styles.shopName}>{shop.businessName || 'Shop'}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {shop.description || 'No description available'}
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="business" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Business:</Text>
            <Text style={styles.infoValue}>{shop.businessName || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{shop.businessCategory || 'General'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{shop.contactName || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>
              {formatDistance(shop.distance != null ? Number(shop.distance) : null)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{userPhone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pin" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {shop.address || 'Address not available'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Pincode:</Text>
            <Text style={styles.infoValue}>{shop.pincode || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Years:</Text>
            <Text style={styles.infoValue}>{shop.fromYears ? `${shop.fromYears} years` : 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="gift" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Offers:</Text>
            <Text style={styles.infoValue}>Guaranty Savings</Text>
          </View>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <Ionicons name="gift" size={32} color="#4CAF50" />
          <Text style={styles.savingsTitle}>Special Offer</Text>
          <Text style={styles.savingsText}>Get INtown Guaranty instant savings on your purchases!</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {isUserFlow ? (
        <Pressable style={styles.userFlowPressable} onPress={handleUserTap}>
          <ShopContent />
        </Pressable>
      ) : (
        <ShopContent />
      )}

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.navigateBtn}
          onPress={() => {
            if (isUserFlow) {
              setShowRegistrationModal(true);
              return;
            }
            router.push({
              pathname: '/member-navigate',
              params: {
                shopId: String(shop.id),
                source: source,
                shopLat: String(shop.latitude ?? ''),
                shopLng: String(shop.longitude ?? ''),
                shopName: shop.businessName || 'Shop',
              },
            });
          }}
        >
          <Ionicons name="navigate" size={20} color="#FFF" />
          <Text style={styles.navigateBtnText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => {
            if (isUserFlow) {
              setShowRegistrationModal(true);
              return;
            }
            setShowPayment(true);
          }}
        >
          <Ionicons name="card" size={20} color="#FFF" />
          <Text style={styles.payBtnText}>Payment Process</Text>
        </TouchableOpacity>
      </View>

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        merchantId={shop.id}
        customerId={customerId ?? ''}
        merchantName={shop.businessName || 'Shop'}
        redirectTo={redirectTo}
      />

      {/* Registration Modal (User Flow Only) */}
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
              <Ionicons name="person" size={24} color="#FF8A00" />
              <Text style={styles.modalButtonText}>Register as Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront" size={24} color="#FF8A00" />
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

      {/* Fullscreen Image Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}
          >
            <Ionicons name="close-circle" size={36} color="#FFF" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666', textAlign: 'center' },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF8A00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
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
  shopImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopImageFull: { width: '100%', height: 250, resizeMode: 'cover' },
  shopArrow: {
    position: 'absolute',
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },
  shopArrowLeft: { left: 10 },
  shopArrowRight: { right: 10 },
  content: { padding: 16 },
  userFlowPressable: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  shopName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', flex: 1 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  descriptionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#666666', lineHeight: 22 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  infoLabel: { fontSize: 14, color: '#666', marginLeft: 10, width: 80 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  savingsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  savingsTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginTop: 8 },
  savingsText: { fontSize: 14, color: '#2E7D32', textAlign: 'center', marginTop: 8 },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12,
  },
  navigateBtn: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  payBtn: {
    flex: 1,
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
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
    color: '#FF8A00',
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
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
