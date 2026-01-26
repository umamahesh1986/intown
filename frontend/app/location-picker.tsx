import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserLocationWithDetails } from '../utils/location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web-safe placeholder components
const WebMapPlaceholder = () => null;
const WebMarkerPlaceholder = () => null;

// Only import MapView on native platforms using lazy loading
const getMapComponents = () => {
  if (Platform.OS === 'web') {
    return { MapView: WebMapPlaceholder, Marker: WebMarkerPlaceholder };
  }
  // Dynamic import only on native
  try {
    const maps = require('react-native-maps');
    return { MapView: maps.default, Marker: maps.Marker };
  } catch (e) {
    console.warn('react-native-maps not available');
    return { MapView: WebMapPlaceholder, Marker: WebMarkerPlaceholder };
  }
};

const { MapView, Marker } = Platform.OS === 'web' 
  ? { MapView: WebMapPlaceholder, Marker: WebMarkerPlaceholder }
  : getMapComponents();

export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? '/register-member';
  const getLocationStorageKey = () => {
    if (returnTo === '/register-merchant') {
      return 'location_picker_register_merchant';
    }
    if (returnTo === '/register-member') {
      return 'location_picker_register_member';
    }
    return 'location_picker_default';
  };
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const loadCurrentLocation = async () => {
      setIsLocating(true);
      try {
        const result = await getUserLocationWithDetails();
        if (result?.latitude && result?.longitude) {
          const nextLocation = {
            latitude: result.latitude,
            longitude: result.longitude,
          };
          setSelectedLocation(nextLocation);
          setMapRegion((prev) => ({
            ...prev,
            latitude: nextLocation.latitude,
            longitude: nextLocation.longitude,
          }));
          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(
              {
                latitude: nextLocation.latitude,
                longitude: nextLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              400
            );
          }
        }
      } catch (error) {
        console.error('Failed to load current location on mount', error);
      } finally {
        setIsLocating(false);
      }
    };

    loadCurrentLocation();
  }, []);

  const handleConfirmLocation = async () => {
    await AsyncStorage.setItem(
      getLocationStorageKey(),
      JSON.stringify({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      })
    );
    router.back();
  };

  const handleUseDefaultLocation = async () => {
    setIsLocating(true);
    try {
      const result = await getUserLocationWithDetails();
      if (result) {
        const nextLocation = {
          latitude: result.latitude,
          longitude: result.longitude,
        };
        setSelectedLocation(nextLocation);
        setMapRegion((prev) => ({
          ...prev,
          latitude: nextLocation.latitude,
          longitude: nextLocation.longitude,
        }));
        await AsyncStorage.setItem(
          getLocationStorageKey(),
          JSON.stringify({
            latitude: nextLocation.latitude,
            longitude: nextLocation.longitude,
          })
        );
        router.back();
      } else {
        Alert.alert('Location', 'Unable to fetch current location');
      }
    } catch (error) {
      console.error('Failed to get current location', error);
      Alert.alert('Location', 'Unable to fetch current location');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setMapRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
  };

  // Web fallback UI
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Web Message */}
        <View style={styles.webMessageContainer}>
          <Ionicons name="map" size={64} color="#FF6600" />
          <Text style={styles.webMessageTitle}>Map View Not Available</Text>
          <Text style={styles.webMessageText}>
            Maps are only available on mobile devices (iOS/Android).
          </Text>
          <Text style={styles.webMessageText}>
            Please test this feature on your phone using the Expo Go app.
          </Text>
          
          {/* Show coordinates input for web testing */}
          <View style={styles.coordinatesCard}>
            <Text style={styles.coordinatesLabel}>Default Location:</Text>
            <Text style={styles.coordinatesValue}>
              Latitude: {selectedLocation.latitude}
            </Text>
            <Text style={styles.coordinatesValue}>
              Longitude: {selectedLocation.longitude}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleUseDefaultLocation}
            disabled={isLocating}
          >
            <Text style={styles.confirmButtonText}>
              {isLocating ? 'Getting Location...' : 'Use Default Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Native (iOS/Android) UI with actual map
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map */}
      {MapView && (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
        >
          {Marker && <Marker coordinate={selectedLocation} />}
        </MapView>
      )}

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsText}>Tap on the map to select your location</Text>
        <Text style={styles.coordinatesText}>
          Lat: {selectedLocation.latitude.toFixed(4)}, Lng: {selectedLocation.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Use Current Location */}
      <TouchableOpacity
        style={styles.useDefaultButton}
        onPress={handleUseDefaultLocation}
        disabled={isLocating}
      >
        <Text style={styles.useDefaultButtonText}>
          {isLocating ? 'Getting Location...' : 'Use Default Location'}
        </Text>
      </TouchableOpacity>

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
        <Text style={styles.confirmButtonText}>Confirm Location</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  map: {
    flex: 1,
  },
  instructionsCard: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600',
  },
  useDefaultButton: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9B3',
  },
  useDefaultButtonText: {
    color: '#FF6600',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#FF6600',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Web-specific styles
  webMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  coordinatesCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordinatesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  coordinatesValue: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
});
