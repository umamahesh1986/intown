import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import PaymentModal from '../components/PaymentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const shop = SHOP_DATA[shopId] || SHOP_DATA['1'];
  const { location } = useLocationStore();
  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const handleOpenMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${shop.lat},${shop.lng}`;
      Linking.openURL(url);
    }
  };

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shop.name}</Text>
        <View style={{width:40}} />
      </View>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={100} color="#2196F3" />
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>Route from your location to shop</Text>
        
        <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={24} color="#FFF" />
          <Text style={styles.openMapsText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={24} color="#2196F3" />
          <View style={{flex:1, marginLeft:12}}>
            <Text style={styles.infoLabel}>Destination</Text>
            <Text style={styles.infoValue}>{shop.name}</Text>
          </View>
        </View>
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
        customerId={customerId}
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
  mapPlaceholder: {flex:1, backgroundColor:'#E3F2FD', alignItems:'center', justifyContent:'center', padding:32},
  mapText: {fontSize:24, fontWeight:'bold', color:'#1976D2', marginTop:16},
  mapSubtext: {fontSize:14, color:'#1976D2', marginTop:8, textAlign:'center'},
  openMapsButton: {flexDirection:'row', backgroundColor:'#2196F3', borderRadius:12, paddingVertical:14, paddingHorizontal:24, marginTop:24, alignItems:'center'},
  openMapsText: {color:'#FFF', fontSize:16, fontWeight:'600', marginLeft:8},
  infoCard: {backgroundColor:'#FFF', margin:16, borderRadius:12, padding:16},
  infoRow: {flexDirection:'row', alignItems:'center'},
  infoLabel: {fontSize:12, color:'#999', marginBottom:4},
  infoValue: {fontSize:16, fontWeight:'600', color:'#1A1A1A'},
  payButton: {flexDirection:'row', backgroundColor:'#FF6600', margin:16, borderRadius:12, paddingVertical:16, alignItems:'center', justifyContent:'center'},
  payButtonText: {color:'#FFF', fontSize:18, fontWeight:'bold', marginLeft:8},
});
