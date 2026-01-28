import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { getUserLocationWithDetails } from '../utils/location';
import PaymentModal from '../components/PaymentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

const SHOP_DATA: any = {
  '1': { name: 'Fresh Mart Grocery', lat: 12.9716, lng: 77.5946 },
  '2': { name: 'Style Salon & Spa', lat: 12.9720, lng: 77.5950 },
  '3': { name: 'Quick Bites Restaurant', lat: 12.9705, lng: 77.5935 },
  '4': { name: 'Wellness Pharmacy', lat: 12.9725, lng: 77.5955 },
  '5': { name: 'Fashion Hub', lat: 12.9730, lng: 77.5960 },
  '6': { name: 'Tech Store', lat: 12.9700, lng: 77.5930 },
};

export default function MemberNavigate() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shopId = params.shopId as string;
  const redirectTo = params.source === 'dual' ? '/dual-dashboard' : '/member-dashboard';
  const shopFromParams = (() => {
    if (!params.shop) return null;
    try {
      return JSON.parse(params.shop as string);
    } catch {
      return null;
    }
  })();
  const fallbackShop = SHOP_DATA[shopId] || SHOP_DATA['1'];
  const shopName = shopFromParams?.shopName || shopFromParams?.name || fallbackShop.name;
  const destinationLat =
    shopFromParams?.latitude ?? shopFromParams?.lat ?? fallbackShop.lat;
  const destinationLng =
    shopFromParams?.longitude ?? shopFromParams?.lng ?? fallbackShop.lng;
  const location = useLocationStore((state) => state.location);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const originLat = Number(location?.latitude);
  const originLng = Number(location?.longitude);
  const hasOrigin = Number.isFinite(originLat) && Number.isFinite(originLng);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${hasOrigin ? `${originLat},${originLng}` : 'Current+Location'}&destination=${destinationLat},${destinationLng}&travelmode=driving`;

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
  };

  useEffect(() => {
    const ensureLocation = async () => {
      setIsLoadingLocation(true);
      await loadLocationFromStorage();
      const storedLocation = useLocationStore.getState().location;
      if (!storedLocation) {
        await getUserLocationWithDetails();
      }
      setIsLoadingLocation(false);
    };
    ensureLocation();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shopName}</Text>
        <View style={{width:40}} />
      </View>

      <View style={styles.mapContainer}>
        {hasOrigin ? (
          <WebView
            source={{ uri: directionsUrl }}
            style={styles.mapWebView}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.mapLoadingText}>Loading route...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.mapSubtext}>
              {isLoadingLocation
                ? 'Getting your location...'
                : 'Waiting for location permission...'}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.payButton} onPress={() => setShowPayment(true)}>
        <Ionicons name="card" size={24} color="#FFF" />
        <Text style={styles.payButtonText}>Pay at Shop</Text>
      </TouchableOpacity>

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        merchantId={shopId}
        customerId={customerId ?? undefined}
        redirectTo={redirectTo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#F5F5F5'},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#2196F3'},
  backButton: {width:40, height:40, justifyContent:'center'},
  headerTitle: {fontSize:18, fontWeight:'600', color:'#FFF'},
  mapContainer: {flex:1, backgroundColor:'#E3F2FD'},
  mapWebView: {flex:1},
  mapLoading: {flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#E3F2FD'},
  mapLoadingText: {marginTop:8, color:'#1976D2', fontSize:14},
  mapPlaceholder: {flex:1, backgroundColor:'#E3F2FD', alignItems:'center', justifyContent:'center', padding:32},
  mapText: {fontSize:24, fontWeight:'bold', color:'#1976D2', marginTop:16},
  mapSubtext: {fontSize:14, color:'#1976D2', marginTop:8, textAlign:'center'},
  payButton: {flexDirection:'row', backgroundColor:'#FF6600', margin:16, borderRadius:12, paddingVertical:16, alignItems:'center', justifyContent:'center'},
  payButtonText: {color:'#FFF', fontSize:18, fontWeight:'bold', marginLeft:8},
});
