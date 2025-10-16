import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
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

  const handleShopPress = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleViewShop = () => {
    if (selectedShop) {
      router.push({
        pathname: '/shop-details',
        params: {
          shopId: selectedShop.id,
          shopData: JSON.stringify(selectedShop),
        },
      });
    }
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

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* User Location Marker */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />

          {/* Shop Markers */}
          {shops.map((shop) => (
            <Marker
              key={shop.id}
              coordinate={{
                latitude: shop.lat,
                longitude: shop.lng,
              }}
              title={shop.name}
              description={shop.category}
              pinColor="red"
              onPress={() => handleShopPress(shop)}
            />
          ))}

          {/* Route Line */}
          {selectedShop && (
            <Polyline
              coordinates={[
                {
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
                {
                  latitude: selectedShop.lat,
                  longitude: selectedShop.lng,
                },
              ]}
              strokeColor="#FF6600"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* Shop List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6600" />
          </View>
        ) : (
          <FlatList
            data={shops}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.shopCard,
                  selectedShop?.id === item.id && styles.shopCardSelected,
                ]}
                onPress={() => handleShopPress(item)}
              >
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.shopCategory}>{item.category}</Text>
                  <View style={styles.shopDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={14} color="#666666" />
                      <Text style={styles.detailText}>{item.distance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag" size={14} color="#4CAF50" />
                      <Text style={styles.savingsText}>Save ₹{item.savings}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* View Shop Button */}
      {selectedShop && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.viewButton} onPress={handleViewShop}>
            <Text style={styles.viewButtonText}>View Shop Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  shopCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 240,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shopCardSelected: {
    borderColor: '#FF6600',
    backgroundColor: '#FFF3E0',
  },
  shopInfo: {},
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  shopCategory: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  shopDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewButton: {
    backgroundColor: '#FF6600',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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