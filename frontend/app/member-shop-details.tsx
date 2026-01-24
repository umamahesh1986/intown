import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PaymentModal from '../components/PaymentModal';

const SHOP_DATA: any = {
  '1': { name: 'Fresh Mart Grocery', rating: 4.5, category: 'Grocery', distance: 0.5 },
  '2': { name: 'Style Salon & Spa', rating: 4.7, category: 'Salon', distance: 0.8 },
  '3': { name: 'Quick Bites Restaurant', rating: 4.3, category: 'Restaurant', distance: 1.2 },
  '4': { name: 'Wellness Pharmacy', rating: 4.8, category: 'Pharmacy', distance: 0.3 },
  '5': { name: 'Fashion Hub', rating: 4.2, category: 'Fashion', distance: 1.5 },
  '6': { name: 'Tech Store', rating: 4.6, category: 'Electronics', distance: 2.0 },
};

export default function MemberShopDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shopId = params.shopId as string;
  const shop = SHOP_DATA[shopId] || SHOP_DATA['1'];
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
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

      <ScrollView>
        <View style={styles.shopImage}>
          <Ionicons name="storefront" size={100} color="#FF6600" />
        </View>

        <View style={styles.content}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.ratingContainer}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name={i <= shop.rating ? "star" : "star-outline"} size={20} color="#FFA500" />
            ))}
            <Text style={styles.ratingText}>{shop.rating}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={20} color="#666" />
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{shop.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Distance:</Text>
              <Text style={styles.infoValue}>{shop.distance} km</Text>
            </View>
          </View>

          <View style={styles.savingsCard}>
            <Ionicons name="gift" size={32} color="#4CAF50" />
            <Text style={styles.savingsTitle}>Special Offer</Text>
            <Text style={styles.savingsText}>Get 10% instant savings on all purchases!</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.navigateBtn} onPress={() => router.push({pathname:'/member-navigate',params:{shopId}})}>
          <Ionicons name="navigate" size={20} color="#FFF" />
          <Text style={styles.navigateBtnText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.payBtn} onPress={() => setShowPayment(true)}>
          <Ionicons name="card" size={20} color="#FFF" />
          <Text style={styles.payBtnText}>Payment Process</Text>
        </TouchableOpacity>
      </View>

      <PaymentModal visible={showPayment} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#F5F5F5'},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#FFF', borderBottomWidth:1, borderBottomColor:'#EEE'},
  backButton: {width:40, height:40, justifyContent:'center'},
  headerTitle: {fontSize:18, fontWeight:'600', color:'#1A1A1A'},
  shopImage: {width:'100%', height:250, backgroundColor:'#FFF3E0', alignItems:'center', justifyContent:'center'},
  content: {padding:16},
  shopName: {fontSize:28, fontWeight:'bold', color:'#1A1A1A', marginBottom:12},
  ratingContainer: {flexDirection:'row', alignItems:'center', marginBottom:16},
  ratingText: {fontSize:18, fontWeight:'600', color:'#666', marginLeft:8},
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
});
