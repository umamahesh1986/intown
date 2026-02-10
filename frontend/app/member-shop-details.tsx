import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/formatDistance';
import { getNearbyShops } from '../utils/api';
import { useLocationStore } from '../store/locationStore';
import PaymentModal from '../components/PaymentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MemberShopDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shopId?: string; shop?: string; source?: string }>();
  const shopId = params.shopId as string | undefined;
  const shopFromParams = (() => {
    if (!params.shop) return null;
    try {
      return JSON.parse(params.shop);
    } catch {
      return null;
    }
  })();
  const [fetchedShop, setFetchedShop] = useState<any | null>(null);
  const [isShopLoading, setIsShopLoading] = useState(false);
  const location = useLocationStore((state) => state.location);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);
  const shop = shopFromParams || fetchedShop;
  const resolvedMerchantId =
    shop?.merchantId ??
    shop?.merchant?.id ??
    shop?.id ??
    shop?.merchant_id;
  const redirectTo = params.source === 'dual' ? '/dual-dashboard' : '/member-dashboard';
  const isUserFlow = params.source === 'user';
  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [shopLoadError, setShopLoadError] = useState<string | null>(null);

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
  };

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

  // Load shop from API if not provided in params
  useEffect(() => {
    if (shopFromParams || !shopId) return;
    let isActive = true;
    const loadShopFromApi = async () => {
      try {
        setIsShopLoading(true);
        setShopLoadError(null);
        await loadLocationFromStorage();
        const storedLocation = useLocationStore.getState().location;
        const lat = storedLocation?.latitude ?? location?.latitude;
        const lng = storedLocation?.longitude ?? location?.longitude;
        if (lat == null || lng == null) {
          throw new Error('Missing customer location');
        }
        const data = await getNearbyShops(lat, lng);
        const list = Array.isArray(data) ? data : [];
        const match = list.find((item) => String(item?.id) === String(shopId));
        if (isActive) {
          setFetchedShop(match ?? null);
          if (!match) {
            setShopLoadError('Shop not found');
          }
        }
      } catch (error: any) {
        console.error('Failed to load shop details', error);
        if (isActive) {
          setShopLoadError(error?.message || 'Failed to load shop details');
        }
      } finally {
        if (isActive) {
          setIsShopLoading(false);
        }
      }
    };
    loadShopFromApi();
    return () => {
      isActive = false;
    };
  }, [shopFromParams, shopId, location?.latitude, location?.longitude]);

  const getCategoryBadge = (category?: string) => {
    const icons: Record<string, string> = {
      restaurant: 'restaurant',
      grocery: 'cart',
      salon: 'cut',
      pharmacy: 'medical',
      electronics: 'phone-portrait',
    };
    const key = (category ?? '').toLowerCase();
    return icons[key] ?? 'storefront';
  };

  // Show loading/error state if shop is not available
  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="storefront" size={40} color="#FF6600" />
          <Text style={styles.loadingText}>
            {isShopLoading ? 'Loading shop details...' : shopLoadError || 'Shop not found'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { flexDirection: 'row', alignItems: 'center', width: 'auto' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
    const value = (category || '').toLowerCase();
    if (value.includes('grocery') || value.includes('kirana')) {
      return { label: 'Grocery', bg: '#E3F2FD', color: '#1565C0' };
    }
    if (value.includes('salon') || value.includes('spa')) {
      return { label: 'Salon', bg: '#FCE4EC', color: '#C2185B' };
    }
    if (value.includes('restaurant') || value.includes('food')) {
      return { label: 'Restaurant', bg: '#FFF3E0', color: '#E65100' };
    }
    if (value.includes('pharmacy') || value.includes('medical')) {
      return { label: 'Pharmacy', bg: '#E8F5E9', color: '#2E7D32' };
    }
    if (value.includes('fashion') || value.includes('apparel')) {
      return { label: 'Fashion', bg: '#F3E5F5', color: '#6A1B9A' };
    }
    if (value.includes('electronics') || value.includes('tech')) {
      return { label: 'Electronics', bg: '#E0F7FA', color: '#006064' };
    }
    return { label: category || 'General', bg: '#ECEFF1', color: '#455A64' };
  };

  const badge = getCategoryBadge(shop.category || shop.businessCategory);
  const ratingValue =
    typeof shop.rating === 'number' ? shop.rating : Number(shop.rating) || 0;
  const addressText =
    shop.address ||
    shop.fullAddress ||
    [shop.area, shop.city].filter(Boolean).join(', ') ||
    'Not available';
  const phoneText = shop.phone || shop.phoneNumber || shop.contactNumber || 'Not available';
  const offerText = shop.offers || shop.offer || 'Guaranty Savings';

  const handleUserTap = () => {
    if (isUserFlow) setShowRegistrationModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Details</Text>
        <View style={{width:40}} />
      </View>

      {isUserFlow ? (
        <Pressable style={styles.userFlowPressable} onPress={handleUserTap}>
          <ScrollView>
            <View style={styles.shopImage}>
              {shop.image || shop.s3ImageUrl ? (
                <Image
                  source={{ uri: shop.image || shop.s3ImageUrl }}
                  style={styles.shopImageFull}
                />
              ) : (
                <Ionicons name="storefront" size={100} color="#FF6600" />
              )}
            </View>

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.shopName}>{shop}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name={i <= ratingValue ? "star" : "star-outline"} size={20} color="#FFA500" />
                ))}
                <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
              </View>

            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {shop.description || 'No description available'}
              </Text>
            </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Category:</Text>
                  <Text style={styles.infoValue}>{shop.category || 'General'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Distance:</Text>
                  <Text style={styles.infoValue}>
                    {formatDistance(
                      shop.distance != null ? Number(shop.distance) : null
                    )}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="star" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Rating:</Text>
                  <Text style={styles.infoValue}>{ratingValue.toFixed(1)} / 5</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{phoneText}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="pin" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{addressText}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="gift" size={20} color="#FF6600" />
                  <Text style={styles.infoLabel}>Offers:</Text>
                  <Text style={styles.infoValue}>{offerText}</Text>
                </View>
              </View>

              <View style={styles.savingsCard}>
                <Ionicons name="gift" size={32} color="#4CAF50" />
                <Text style={styles.savingsTitle}>Special Offer</Text>
                <Text style={styles.savingsText}>Get INtown Guaranty instant savings on your purchases!</Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      ) : (
        <ScrollView>
          <View style={styles.shopImage}>
            {shop.image || shop.s3ImageUrl ? (
              <Image
                source={{ uri: shop.image || shop.s3ImageUrl }}
                style={styles.shopImageFull}
              />
            ) : (
              <Ionicons name="storefront" size={100} color="#FF6600" />
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.shopName}>{shop.shopName || shop.name}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name={i <= ratingValue ? "star" : "star-outline"} size={20} color="#FFA500" />
              ))}
              <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
            </View>

            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {shop.description || 'No description available'}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{shop.category || 'General'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Distance:</Text>
                <Text style={styles.infoValue}>
                  {formatDistance(
                    shop.distance != null ? Number(shop.distance) : null
                  )}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="star" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Rating:</Text>
                <Text style={styles.infoValue}>{ratingValue.toFixed(1)} / 5</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{phoneText}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="pin" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{addressText}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="gift" size={20} color="#FF6600" />
                <Text style={styles.infoLabel}>Offers:</Text>
                <Text style={styles.infoValue}>{offerText}</Text>
              </View>
            </View>

            <View style={styles.savingsCard}>
              <Ionicons name="gift" size={32} color="#4CAF50" />
              <Text style={styles.savingsTitle}>Special Offer</Text>
              <Text style={styles.savingsText}>Get INtown Guaranty instant savings on your purchases!</Text>
            </View>
          </View>
        </ScrollView>
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
                shopId,
                source: params.source,
                shop: JSON.stringify(shop),
                shopLat: String(
                  shop?.latitude ?? shop?.lat ?? shop?.shopLatitude ?? ''
                ),
                shopLng: String(
                  shop?.longitude ?? shop?.lng ?? shop?.shopLongitude ?? ''
                ),
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
        merchantId={resolvedMerchantId}
        customerId={customerId ?? shop.customerId}
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

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#F5F5F5'},
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666', textAlign: 'center' },
  backButtonText: { marginLeft: 6, color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#FFF', borderBottomWidth:1, borderBottomColor:'#EEE'},
  backButton: {width:40, height:40, justifyContent:'center'},
  headerTitle: {fontSize:18, fontWeight:'600', color:'#1A1A1A'},
  shopImage: {width:'100%', height:250, backgroundColor:'#FFF3E0', alignItems:'center', justifyContent:'center'},
  shopImageFull: { width: '100%', height: '100%', resizeMode: 'cover' },
  content: {padding:16},
  userFlowPressable: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  shopName: {fontSize:28, fontWeight:'bold', color:'#1A1A1A'},
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  ratingContainer: {flexDirection:'row', alignItems:'center', marginBottom:16},
  ratingText: {fontSize:18, fontWeight:'600', color:'#666', marginLeft:8},
  descriptionCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  descriptionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#666666', lineHeight: 20 },
  infoCard: {backgroundColor:'#FFF', borderRadius:12, padding:16, marginBottom:16},
  infoRow: {flexDirection:'row', alignItems:'center', marginBottom:12},
  infoLabel: {fontSize:14, color:'#666', marginLeft:8, width:80},
  infoValue: {fontSize:16, fontWeight:'600', color:'#1A1A1A'},
  savingsCard: {backgroundColor:'#E8F5E9', borderRadius:12, padding:20, alignItems:'center'},
  savingsTitle: {fontSize:20, fontWeight:'bold', color:'#2E7D32', marginTop:8},
  savingsText: {fontSize:14, color:'#2E7D32', textAlign:'center', marginTop:8},
  bottomButtons: {flexDirection:'row', padding:16, backgroundColor:'#FFF', borderTopWidth:1, borderTopColor:'#EEE', gap:12},
  navigateBtn: {flex:1, backgroundColor:'#2196F3', borderRadius:12, paddingVertical:16, flexDirection:'row', alignItems:'center', justifyContent:'center'},
  navigateBtnText: {color:'#FFF', fontSize:16, fontWeight:'bold', marginLeft:8},
  payBtn: {flex:1, backgroundColor:'#FF6600', borderRadius:12, paddingVertical:16, flexDirection:'row', alignItems:'center', justifyContent:'center'},
  payBtnText: {color:'#FFF', fontSize:16, fontWeight:'bold', marginLeft:8},
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
