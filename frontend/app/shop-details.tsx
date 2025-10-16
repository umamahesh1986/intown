import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';

interface Shop {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  price: number;
  savings: number;
  address: string;
}

export default function ShopDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location } = useLocationStore();
  
  const shop: Shop = JSON.parse(params.shopData as string);

  const handlePayNow = () => {
    router.push({
      pathname: '/payment',
      params: {
        shopId: shop.id,
        amount: shop.price,
        savings: shop.savings,
        type: 'shop',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map with Route */}
        {location && (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: (location.latitude + shop.lat) / 2,
                longitude: (location.longitude + shop.lng) / 2,
                latitudeDelta: Math.abs(location.latitude - shop.lat) * 2 + 0.01,
                longitudeDelta: Math.abs(location.longitude - shop.lng) * 2 + 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Your Location"
                pinColor="blue"
              />
              <Marker
                coordinate={{
                  latitude: shop.lat,
                  longitude: shop.lng,
                }}
                title={shop.name}
                pinColor="red"
              />
              <Polyline
                coordinates={[
                  {
                    latitude: location.latitude,
                    longitude: location.longitude,
                  },
                  {
                    latitude: shop.lat,
                    longitude: shop.lng,
                  },
                ]}
                strokeColor="#FF6600"
                strokeWidth={3}
              />
            </MapView>
          </View>
        )}

        {/* Shop Information */}
        <View style={styles.infoContainer}>
          <View style={styles.nameSection}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{shop.category}</Text>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>{shop.distance.toFixed(1)} km</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="home" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{shop.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color="#666666" />
              <Text style={styles.detailLabel}>Avg. Price:</Text>
              <Text style={styles.detailValue}>₹{shop.price}</Text>
            </View>
          </View>

          {/* Savings Card */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsHeader}>
              <Ionicons name="pricetag" size={24} color="#4CAF50" />
              <Text style={styles.savingsTitle}>Merchant Savings</Text>
            </View>
            <Text style={styles.savingsAmount}>₹{shop.savings}</Text>
            <Text style={styles.savingsDescription}>
              Save ₹{shop.savings} on your purchases at this merchant
            </Text>
          </View>

          {/* Pay Now Button */}
          <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
            <Ionicons name="card" size={24} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
  },
  nameSection: {
    marginBottom: 16,
  },
  shopName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#FF6600',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
  },
  savingsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 8,
  },
  savingsAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  savingsDescription: {
    fontSize: 14,
    color: '#2E7D32',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});