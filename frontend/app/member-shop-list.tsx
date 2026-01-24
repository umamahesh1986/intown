import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchByProductNames } from '../utils/api';
import { useLocationStore } from '../store/locationStore';

const DUMMY_SHOPS = [
  { id: '1', name: 'Fresh Mart Grocery', category: 'Grocery', distance: 0.5, rating: 4.5, image: null },
  { id: '2', name: 'Style Salon & Spa', category: 'Salon', distance: 0.8, rating: 4.7, image: null },
  { id: '3', name: 'Quick Bites Restaurant', category: 'Restaurant', distance: 1.2, rating: 4.3, image: null },
  { id: '4', name: 'Wellness Pharmacy', category: 'Pharmacy', distance: 0.3, rating: 4.8, image: null },
  { id: '5', name: 'Fashion Hub', category: 'Fashion', distance: 1.5, rating: 4.2, image: null },
  { id: '6', name: 'Tech Store', category: 'Electronics', distance: 2.0, rating: 4.6, image: null },
];

export default function MemberShopList() {
  const router = useRouter();
  const { category, query } = useLocalSearchParams<{ category?: string; query?: string }>();
  const { location } = useLocationStore();

  const [shops, setShops] = useState<any[]>([]);

  // 🔹 PRODUCT SEARCH (EXISTING LOGIC + FALLBACK)
  const fetchRealShops = async () => {
    try {
      if (!query || !location) return;

      const data = await searchByProductNames(
        query,
        location.latitude,
        location.longitude
      );

      const mappedShops = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id.toString(),
            name: item.shopName,
            category: item.businessCategory,
            distance: item.distance,
            image: item.s3ImageUrl,
          }))
        : [];

      if (mappedShops.length > 0) {
        // ✅ Product found
        setShops(mappedShops);
      } else {
        // ✅ Product NOT found (Rice case)
        fetchNearbyShops();
      }
    } catch (error) {
      console.error('Failed to fetch shops', error);
      fetchNearbyShops(); // fallback on error
    }
  };

  // 🔹 FALLBACK: NEARBY SHOPS
  const fetchNearbyShops = async () => {
    try {
      if (!location) return;

      // TEMP fallback (replace later with real nearby API)
      setShops(DUMMY_SHOPS);
    } catch (error) {
      console.error('Failed to fetch nearby shops', error);
      setShops([]);
    }
  };

  // 🔹 RUN SEARCH WHEN QUERY CHANGES
  useEffect(() => {
    fetchRealShops();
  }, [query]);

  const handleViewShop = (shopId: string) => {
    router.push({ pathname: '/member-shop-details', params: { shopId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {category || query || 'Nearby Shops'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
        <View style={styles.shopCard}>

  {/* TOP ROW */}
  <View style={styles.shopRow}>

    {/* LEFT: ICON */}
    <View style={styles.shopImageContainer}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={{ width: 80, height: 80, borderRadius: 10 }}
        />
      ) : (
        <Ionicons name="storefront" size={60} color="#FF6600" />
      )}
    </View>

    {/* RIGHT: INFO */}
    <View style={styles.shopInfoRight}>
      <Text style={styles.shopName}>{item.name}</Text>
      <Text style={styles.categoryText}>{item.category}</Text>

      <View style={styles.distanceRow}>
        <Ionicons name="location" size={14} color="#666" />
        <Text style={styles.distanceText}>
          {item.distance.toFixed(1)} km
        </Text>
      </View>
    </View>

  </View>

  {/* BUTTON */}
  <View style={styles.buttonContainer}>
    <TouchableOpacity
      style={styles.viewButton}
      onPress={() => handleViewShop(item.id)}
    >
      <Text style={styles.viewButtonText}>View</Text>
    </TouchableOpacity>
  </View>

</View>

        )}
      />
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
  placeholder: { width: 40 },
  listContent: { padding: 16 },
  shopCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  shopImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shopInfo: { marginBottom: 12 },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  distanceText: { fontSize: 14, color: '#666', marginLeft: 4 },
  categoryText: { fontSize: 14, color: '#999' },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  viewButton: {
    flex: 1,
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  shopRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 12,
},

shopInfoRight: {
  flex: 1,
  marginLeft: 12,
  minHeight: 100,
},

distanceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 'auto', // pushes distance to bottom-right
},

});
