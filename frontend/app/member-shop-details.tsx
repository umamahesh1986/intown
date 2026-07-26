import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Dimensions, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/formatDistance';
import { extractImageUrls, INTOWN_API_BASE, getAllProducts } from '../utils/api';
import { getNavShop } from '../utils/navCache';
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
  openAt?: string;
  closeAt?: string;
  breakStartAt?: string;
  breakEndAt?: string;
  weekOff?: string;
  offer?: string;
}

export default function MemberShopDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shopId?: string; categoryId?: string; source?: string; shopData?: string }>();
  const shopId = params.shopId;
  const categoryId = params.categoryId;
  const source = params.source;
  const shopDataParam = params.shopData; // Deprecated — kept for backwards compat with any old deep links

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

  // ================= ORDER FEATURE STATE =================
  const SUPPORTED_ORDER_CATEGORIES = [
    'pharmacy',
    'dairy products',
    'meat',
    'bakery',
    'stationery',
    'bags & accessories',
    'electronics & home appliances',
    'groceries',
  ];

  // Product coming from /IN/products/ grouped by unit-type
  interface OrderProduct {
    id: number;
    name: string;
    groupType: string;          // e.g. LooseByWeight_KG_Grams
    unitOptions: string[];      // fixed unit list from API (e.g. ['100g','250g','500g','1kg'])
  }
  interface SelectedOrderItem {
    id: number;
    name: string;
    groupType: string;
    unit: string;
    quantity: number;
  }

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  // Keyed by productId → SelectedOrderItem
  const [selectedItems, setSelectedItems] = useState<Record<number, SelectedOrderItem>>({});
  // Per-product currently-picked unit (before Add). Persists across increments/decrements.
  const [chosenUnit, setChosenUnit] = useState<Record<number, string>>({});
  // Delivery is not supported yet — default to PICKUP.
  const [orderType, setOrderType] = useState<'PICKUP' | 'DELIVERY' | null>('PICKUP');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [unitPickerFor, setUnitPickerFor] = useState<number | null>(null);

  // Post-submit toast on the shop-details page (shown after modal closes).
  const [orderToast, setOrderToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const orderToastTimerRef = useRef<any>(null);
  const showOrderToast = (kind: 'success' | 'error', message: string) => {
    if (orderToastTimerRef.current) clearTimeout(orderToastTimerRef.current);
    setOrderToast({ kind, message });
    orderToastTimerRef.current = setTimeout(() => setOrderToast(null), 3500);
  };
  useEffect(() => {
    return () => {
      if (orderToastTimerRef.current) clearTimeout(orderToastTimerRef.current);
    };
  }, []);

  // Image carousel state
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [shopImageIndex, setShopImageIndex] = useState(0);
  const shopImageScrollRef = useRef<ScrollView | null>(null);
  const shopImageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const SHOP_IMAGE_WIDTH = Dimensions.get('window').width;
  const isCarouselVisible = useRef(true);

  // Fetch shop details from API
  const fetchShopDetails = async () => {
    setIsLoading(true);
    setError(null);

    // 1. Try in-memory / AsyncStorage nav cache (preferred — no URL bloat)
    try {
      const cached = await getNavShop(shopId);
      if (cached && cached.id) {
        setShop(cached);
        const images = extractImageUrls(cached.s3ImageUrl);
        setShopImages(images);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('[ShopDetails] Failed to read nav cache', e);
    }

    // 2. Legacy fallback: shop data passed via URL param (kept for backward compat)
    if (shopDataParam) {
      try {
        const parsed = JSON.parse(shopDataParam);
        if (parsed && parsed.id) {
          setShop(parsed);
          const images = extractImageUrls(parsed.s3ImageUrl);
          setShopImages(images);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('[ShopDetails] Failed to parse shopData param');
      }
    }

    // 3. Fallback: fetch from API
    try {
      await loadLocationFromStorage();
      const storedLocation = useLocationStore.getState().location;
      const lat = storedLocation?.latitude ?? location?.latitude ?? 17.4939602;
      const lng = storedLocation?.longitude ?? location?.longitude ?? 78.4008412;

      // Build API URL - categoryId is mandatory
      let apiUrl = `${INTOWN_API_BASE}/search/by-product-names?categoryId=${encodeURIComponent(categoryId || '100001')}&customerLatitude=${lat}&customerLongitude=${lng}`;

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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

  // Image carousel auto-scroll — only scroll when carousel is visible
  useEffect(() => {
    if (shopImages.length <= 1) return;
    if (shopImageTimerRef.current) {
      clearInterval(shopImageTimerRef.current);
    }
    shopImageTimerRef.current = setInterval(() => {
      if (isCarouselVisible.current) {
        setShopImageIndex((prev) => (prev + 1) % shopImages.length);
      }
    }, 3000);
    return () => {
      if (shopImageTimerRef.current) {
        clearInterval(shopImageTimerRef.current);
      }
    };
  }, [shopImages]);

  useEffect(() => {
    if (!shopImageScrollRef.current || shopImages.length === 0 || !isCarouselVisible.current) return;
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

  // ================= ORDER FEATURE HANDLERS =================
  const isOrderCategorySupported = (category?: string) => {
    if (!category) return false;
    return SUPPORTED_ORDER_CATEGORIES.includes(category.trim().toLowerCase());
  };

  // Deterministic pastel color per product name (Blinkit-style tile bg)
  const productTileColor = (name: string) => {
    const palette = ['#FFF3E0'];
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };
  const productAccentColor = (name: string) => {
    const palette = ['#FF8A00'];
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };

  const productIconForGroup = (groupType: string): keyof typeof Ionicons.glyphMap => {
    switch (groupType) {
      case 'LooseByWeight_KG_Grams': return 'scale-outline';
      case 'LooseByVolume_ML_Liters': return 'water-outline';
      case 'Packaged_PiecePack': return 'cube-outline';
      default: return 'pricetag-outline';
    }
  };

  const openOrderModal = async () => {
    setOrderError('');
    setSelectedItems({});
    setChosenUnit({});
    setUnitPickerFor(null);
    setOrderType('PICKUP'); // Delivery not supported yet
    setProductSearch('');
    setShowOrderModal(true);
    setIsLoadingProducts(true);
    try {
      const flat = await getAllProducts();
      const list: OrderProduct[] = flat.map((p) => ({
        id: p.id,
        name: p.name,
        groupType: p.groupType || 'Packaged_PiecePack',
        unitOptions: p.unitOptions && p.unitOptions.length > 0 ? p.unitOptions : ['1 unit'],
      }));
      setOrderProducts(list);
    } catch (err: any) {
      console.error('Failed to load products for order:', err);
      setOrderProducts([]);
      setOrderError('Unable to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Returns the unit label currently chosen for a product (falls back to the
  // first unit_option from the API when the user hasn't picked one yet).
  const currentUnitFor = (product: OrderProduct): string => {
    const item = selectedItems[product.id];
    if (item?.unit) return item.unit;
    if (chosenUnit[product.id]) return chosenUnit[product.id];
    return product.unitOptions[0] || '1 unit';
  };

  const pickUnitFor = (product: OrderProduct, unit: string) => {
    setChosenUnit((prev) => ({ ...prev, [product.id]: unit }));
    // If already added, update the selected item's unit too
    setSelectedItems((prev) => {
      if (!prev[product.id]) return prev;
      return { ...prev, [product.id]: { ...prev[product.id], unit } };
    });
    setUnitPickerFor(null);
  };

  const addOrIncrement = (product: OrderProduct) => {
    setSelectedItems((prev) => {
      const existing = prev[product.id];
      if (existing) {
        return { ...prev, [product.id]: { ...existing, quantity: existing.quantity + 1 } };
      }
      const unit = chosenUnit[product.id] || product.unitOptions[0] || '1 unit';
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          groupType: product.groupType,
          unit,
          quantity: 1,
        },
      };
    });
  };

  const decrement = (productId: number) => {
    setSelectedItems((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity - 1;
      const next = { ...prev };
      if (nextQty <= 0) {
        delete next[productId];
      } else {
        next[productId] = { ...existing, quantity: nextQty };
      }
      return next;
    });
  };

  const handleSubmitOrder = async () => {
    setOrderError('');
    if (!customerId) {
      Alert.alert('Login Required', 'Please login again to place an order.');
      return;
    }
    if (!shop?.id) {
      Alert.alert('Error', 'Merchant info missing.');
      return;
    }
    const selectedList = Object.values(selectedItems);
    if (selectedList.length === 0) {
      Alert.alert('Select Products', 'Please add at least one product to order.');
      return;
    }
    if (!orderType) {
      Alert.alert('Order Type', 'Please choose Pickup or Delivery.');
      return;
    }

    // Build items in the shape the pickup-orders API expects:
    // { productName, quantity } where quantity is a STRING combining the count and unit.
    // Example: user picked 3 × "500g" → quantity: "3 × 500g".
    const items = selectedList.map((item) => ({
      productName: item.name,
      quantity: `${item.quantity} × ${item.unit}`,
    }));

    const payload = {
      customerId: Number(customerId),
      merchantId: Number(shop.id),
      items,
    };

    setIsSubmittingOrder(true);
    try {
      const res = await fetch(
        `${INTOWN_API_BASE}/customers/${Number(customerId)}/pickup-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data: any = await res.json().catch(() => ({}));

      const status = String(data?.status || '').toUpperCase();
      const isPlaced = res.ok && status === 'PLACED';

      // Close modal FIRST, then show the toast on the shop-details page.
      setShowOrderModal(false);
      setSelectedItems({});
      setChosenUnit({});
      setUnitPickerFor(null);
      setProductSearch('');

      if (isPlaced) {
        showOrderToast('success', 'Order placed successfully!');
      } else {
        const msg =
          (data && (data.message || data.error)) ||
          (status ? `Order status: ${status}` : `Order submission failed (${res.status})`);
        showOrderToast('error', msg);
      }
    } catch (err: any) {
      console.error('Order submit error:', err);
      setShowOrderModal(false);
      showOrderToast('error', err?.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
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
          nestedScrollEnabled={true}
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
  const userPhone = user?.phone || 'Not available';

  const ShopContent = () => (
    <ScrollView
      onScroll={(e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        isCarouselVisible.current = offsetY < 250;
      }}
      scrollEventThrottle={100}
    >
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

        {/* Order Button — visible only for supported categories */}
          <TouchableOpacity
            style={styles.orderBtn}
            onPress={() => {
              if (isUserFlow) {
                setShowRegistrationModal(true);
                return;
              }
              openOrderModal();
            }}
            testID="open-order-modal-btn"
          >
            <Ionicons name="bag-handle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.orderBtnText}>Order</Text>
          </TouchableOpacity>

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
            <Text style={styles.infoValue}>{shop.phoneNumber || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{shop.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="pin" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {shop.address || 'Address not available'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="keypad" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Pincode:</Text>
            <Text style={styles.infoValue}>{shop.pincode || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Years:</Text>
            <Text style={styles.infoValue}>{shop.fromYears ? `${shop.fromYears} years` : 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="gift" size={20} color="#FF8A00" />
            <Text style={styles.infoLabel}>Offers:</Text>
            <Text style={styles.infoValue}>{shop.offer || 'Guaranty Savings'}</Text>
          </View>
        </View>

        {/* Opening Hours */}
        <View style={styles.infoCard}>
          <Text style={styles.openingHoursTitle}>Opening Hours</Text>

          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={18} color="#4CAF50" />
            <Text style={styles.hoursLabel}>Open:</Text>
            <Text style={styles.hoursValue}>{shop.openAt || 'N/A'}</Text>
          </View>

          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={18} color="#F44336" />
            <Text style={styles.hoursLabel}>Close:</Text>
            <Text style={styles.hoursValue}>{shop.closeAt || 'N/A'}</Text>
          </View>

          <View style={styles.hoursRow}>
            <Ionicons name="cafe-outline" size={18} color="#FF8A00" />
            <Text style={styles.hoursLabel}>Break:</Text>
            <Text style={styles.hoursValue}>
              {shop.breakStartAt && shop.breakEndAt
                ? `${shop.breakStartAt} - ${shop.breakEndAt}`
                : 'No break'}
            </Text>
          </View>

          <View style={styles.hoursRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.hoursLabel}>Week Off:</Text>
            <Text style={styles.hoursValue}>{shop.weekOff || 'None'}</Text>
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

      <ShopContent />

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

      {/* Post-order Toast (floats on top of the shop details page) */}
      {orderToast && (
        <View
          style={[
            styles.orderToast,
            orderToast.kind === 'success' ? styles.orderToastSuccess : styles.orderToastError,
          ]}
          pointerEvents="box-none"
          testID="order-toast"
        >
          <View style={styles.orderToastInner}>
            <Ionicons
              name={orderToast.kind === 'success' ? 'checkmark-circle' : 'close-circle'}
              size={22}
              color={orderToast.kind === 'success' ? '#0C8A4A' : '#D32F2F'}
            />
            <Text
              style={[
                styles.orderToastText,
                { color: orderToast.kind === 'success' ? '#0C8A4A' : '#D32F2F' },
              ]}
              numberOfLines={3}
            >
              {orderToast.message}
            </Text>
            <TouchableOpacity onPress={() => setOrderToast(null)} testID="order-toast-close-btn">
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= ORDER MODAL (Blinkit-style, 90% height) ================= */}
      <Modal
        visible={showOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.orderModalOverlay}>
          <View style={styles.orderModalCard}>
            {/* Fixed Header */}
            <View style={styles.orderModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderModalTitle} numberOfLines={1}>Place Order</Text>
                <Text style={styles.orderModalSubtitle} numberOfLines={1}>{shop.businessName}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOrderModal(false)} style={styles.orderModalCloseBtn} testID="close-order-modal-btn">
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.orderModalScroll}
              contentContainerStyle={styles.orderModalScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {/* Search Products */}
              <View style={styles.productSearchWrap}>
                <Ionicons name="search" size={16} color="#999" />
                <TextInput
                  style={styles.productSearchInput}
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Search products (type 2+ letters)…"
                  placeholderTextColor="#B0B0B0"
                  returnKeyType="search"
                  autoCorrect={false}
                  testID="product-search-input"
                />
                {productSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearch('')} testID="product-search-clear-btn">
                    <Ionicons name="close-circle" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.orderSectionLabel}>Select Products</Text>

              {isLoadingProducts ? (
                <View style={styles.orderProductsLoading}>
                  <ActivityIndicator color="#FF8A00" />
                  <Text style={styles.orderProductsLoadingText}>Loading products...</Text>
                </View>
              ) : orderProducts.length === 0 ? (
                <View style={styles.orderProductsEmpty}>
                  <Ionicons name="cube-outline" size={28} color="#BBB" />
                  <Text style={styles.orderProductsEmptyText}>
                    {orderError || 'No products available.'}
                  </Text>
                  {!!orderError && (
                    <TouchableOpacity style={styles.retryBtn} onPress={openOrderModal} testID="retry-load-products-btn">
                      <Ionicons name="refresh" size={16} color="#FFFFFF" />
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (() => {
                const q = productSearch.trim().toLowerCase();
                // Apply filter only after 2+ characters (per requirement)
                const filtered = q.length >= 2
                  ? orderProducts.filter((p) => p.name.toLowerCase().includes(q))
                  : orderProducts;
                if (q.length >= 2 && filtered.length === 0) {
                  return (
                    <View style={styles.orderProductsEmpty}>
                      <Ionicons name="search" size={24} color="#BBB" />
                      <Text style={styles.orderProductsEmptyText}>
                        No products match "{productSearch}".
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={styles.productsGrid}>
                    {filtered.map((product) => {
                      const item = selectedItems[product.id];
                      const qty = item?.quantity || 0;
                      const tileBg = productTileColor(product.name);
                      const accent = productAccentColor(product.name);
                      const iconName = productIconForGroup(product.groupType);
                      const currentUnit = currentUnitFor(product);
                      return (
                        <View key={product.id} style={styles.productCard} testID={`product-card-${product.id}`}>
                          {/* Image placeholder */}
                          <View style={[styles.productImageWrap, { backgroundColor: tileBg }]}>
                            <Ionicons name={iconName} size={28} color={accent} />
                          </View>

                          {/* Name */}
                          <Text style={styles.productCardName} numberOfLines={2}>{product.name}</Text>

                          {/* Unit picker — uses unit_options straight from the API */}
                          <TouchableOpacity
                            style={styles.unitChip}
                            onPress={() => setUnitPickerFor(unitPickerFor === product.id ? null : product.id)}
                            testID={`unit-picker-${product.id}`}
                          >
                            <Text style={styles.unitChipText} numberOfLines={1}>{currentUnit}</Text>
                            <Ionicons name="chevron-down" size={11} color="#666" />
                          </TouchableOpacity>

                          {unitPickerFor === product.id && (
                            <View style={styles.unitDropdown}>
                              {product.unitOptions.map((u) => {
                                const selected = u === currentUnit;
                                return (
                                  <TouchableOpacity
                                    key={u}
                                    style={[styles.unitOption, selected && styles.unitOptionSelected]}
                                    onPress={() => pickUnitFor(product, u)}
                                    testID={`unit-option-${product.id}-${u}`}
                                  >
                                    <Text style={[styles.unitOptionText, selected && styles.unitOptionTextSelected]}>{u}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}

                          {/* +Add or -/qty/+ control */}
                          {qty === 0 ? (
                            <TouchableOpacity
                              style={[styles.addBtn, { borderColor: accent }]}
                              onPress={() => addOrIncrement(product)}
                              testID={`add-product-${product.id}`}
                            >
                              <Ionicons name="add" size={14} color={accent} />
                              <Text style={[styles.addBtnText, { color: accent }]}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={[styles.qtyControl, { backgroundColor: accent }]}>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => decrement(product.id)}
                                testID={`decrement-product-${product.id}`}
                              >
                                <Ionicons name="remove" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                              <Text style={styles.qtyValue}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => addOrIncrement(product)}
                                testID={`increment-product-${product.id}`}
                              >
                                <Ionicons name="add" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </ScrollView>

            {/* Fixed Bottom Section */}
            <View style={styles.orderModalFooter}>
              {/*
                Order Type (Pickup / Delivery) — commented out for now.
                Delivery is not supported yet; orderType defaults to 'PICKUP'.
                Re-enable this block when delivery goes live.

              <Text style={styles.orderFooterLabel}>Order Type</Text>
              <View style={styles.orderTypeRow}>
                <TouchableOpacity
                  style={[styles.orderTypeChip, orderType === 'PICKUP' && styles.orderTypeChipActive]}
                  onPress={() => setOrderType('PICKUP')}
                  testID="order-type-pickup-btn"
                >
                  <Ionicons name="walk-outline" size={16} color={orderType === 'PICKUP' ? '#FFF' : '#FF8A00'} />
                  <Text style={[styles.orderTypeChipText, orderType === 'PICKUP' && styles.orderTypeChipTextActive]}>Pickup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderTypeChip, orderType === 'DELIVERY' && styles.orderTypeChipActive]}
                  onPress={() => setOrderType('DELIVERY')}
                  testID="order-type-delivery-btn"
                >
                  <Ionicons name="bicycle-outline" size={16} color={orderType === 'DELIVERY' ? '#FFF' : '#FF8A00'} />
                  <Text style={[styles.orderTypeChipText, orderType === 'DELIVERY' && styles.orderTypeChipTextActive]}>Delivery</Text>
                </TouchableOpacity>
              </View>
              */}

              {!!orderError && orderProducts.length > 0 && (
                <View style={styles.orderErrorBanner} testID="order-error-banner">
                  <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                  <Text style={styles.orderErrorText} numberOfLines={2}>{orderError}</Text>
                </View>
              )}

              {(() => {
                const totalItems = Object.values(selectedItems).reduce((sum, i) => sum + (i.quantity || 0), 0);
                const canSubmit = totalItems > 0 && !!orderType && !isSubmittingOrder;
                return (
                  <TouchableOpacity
                    style={[styles.orderSubmitBtn, !canSubmit && styles.orderSubmitBtnDisabled]}
                    onPress={handleSubmitOrder}
                    disabled={!canSubmit}
                    testID="submit-order-btn"
                  >
                    {isSubmittingOrder ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.orderSubmitBtnText}>Submit Order (Pickup)</Text>
                        {totalItems > 0 && (
                          <View style={styles.submitBadge}>
                            <Text style={styles.submitBadgeText}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
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
  openingHoursTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  hoursLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
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

  // ================= ORDER FEATURE STYLES (Blinkit-style) =================
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#FF8A00',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  orderModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
  },
  orderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  orderModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  orderModalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderModalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderModalScroll: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  orderModalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  orderSectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 4,
  },

  // Search bar inside modal
  productSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  productSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 8,
  },

  // Grid of product cards
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 8,
  },
  productCard: {
    width: '32%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  productImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    minHeight: 30,
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  unitChipText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  unitDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
    marginTop: -4,
    overflow: 'hidden',
    position: 'absolute',
    top: 22,
    width: '70%',
  },
  unitOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  unitOptionSelected: {
    backgroundColor: '#FFF3E0',
  },
  unitOptionText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  unitOptionTextSelected: {
    color: '#FF8A00',
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 18,
    textAlign: 'center',
  },

  orderProductsLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  orderProductsLoadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
  },
  orderProductsEmpty: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderProductsEmptyText: {
    marginTop: 8,
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF8A00',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Fixed bottom footer
  orderModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFFFFF',
  },
  orderFooterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  orderTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF8A00',
    backgroundColor: '#FFF8F0',
  },
  orderTypeChipActive: {
    backgroundColor: '#FF8A00',
    borderColor: '#FF8A00',
  },
  orderTypeChipText: {
    color: '#FF8A00',
    fontWeight: '700',
    fontSize: 14,
  },
  orderTypeChipTextActive: {
    color: '#FFFFFF',
  },
  orderErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F5C2C0',
    marginBottom: 8,
  },
  orderErrorText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  orderSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 14,
  },
  orderSubmitBtnDisabled: {
    backgroundColor: '#CCCCCC',
  },
  orderSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  submitBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  submitBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Floating post-order toast on shop-details page
  orderToast: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  orderToastSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#B7E1BF',
  },
  orderToastError: {
    backgroundColor: '#FDECEA',
    borderColor: '#F5C2C0',
  },
  orderToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  orderToastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
