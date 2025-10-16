import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { getShops } from '../utils/api';

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

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category as string | undefined;
  const { location } = useLocationStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, [category]);

  const loadShops = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    setIsLoading(true);
    try {
      const data = await getShops(location.latitude, location.longitude, category);
      setShops(data);
    } catch (error) {
      console.error('Error loading shops:', error);
      Alert.alert('Error', 'Failed to load shops');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewShop = (shop: Shop) => {
    router.push({
      pathname: '/shop-details',
      params: {
        shopId: shop.id,
        shopData: JSON.stringify(shop),
      },
    });
  };

  const handleOpenInMaps = (shop: Shop) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${location?.latitude},${location?.longitude}&destination=${shop.lat},${shop.lng}`;
    Linking.openURL(url);
  };

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color="#999999" />
          <Text style={styles.errorText}>Location not available</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {category ? `${category} Shops` : 'Nearby Shops'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Location Info */}
      <View style={styles.locationBanner}>
        <Ionicons name="location" size={20} color="#FF6600" />
        <Text style={styles.locationText}>
          Showing shops near your location
        </Text>
      </View>

      {/* Shop List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6600" />
          <Text style={styles.loadingText}>Loading nearby shops...</Text>
        </View>
      ) : shops.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#999999" />
          <Text style={styles.emptyText}>No shops found</Text>
          <Text style={styles.emptySubtext}>Try searching a different category</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.shopCard}
              onPress={() => handleViewShop(item)}
            >
              <View style={styles.shopHeader}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{item.name}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => handleOpenInMaps(item)}
                >
                  <Ionicons name="navigate" size={24} color="#FF6600" />
                </TouchableOpacity>
              </View>

              <Text style={styles.shopAddress} numberOfLines={1}>
                <Ionicons name="location-outline" size={14} color="#666666" />
                {' '}{item.address}
              </Text>

              <View style={styles.shopDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="walk" size={16} color="#666666" />
                  <Text style={styles.detailText}>{item.distance.toFixed(1)} km away</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash" size={16} color="#666666" />
                  <Text style={styles.detailText}>Avg. ₹{item.price}</Text>
                </View>
              </View>

              <View style={styles.savingsBar}>
                <Ionicons name="pricetag" size={16} color="#4CAF50" />
                <Text style={styles.savingsText}>
                  Save ₹{item.savings} at this merchant
                </Text>
              </View>

              <View style={styles.viewButtonContainer}>
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={20} color="#FF6600" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
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
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  locationText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#FF6600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  shopDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  savingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  viewButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  viewButtonText: {
    fontSize: 16,
    color: '#FF6600',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF6600',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});