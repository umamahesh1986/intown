import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Only import MapView on native platforms
let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function LocationPickerScreen() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
  });

  const handleConfirmLocation = () => {
    // In a real app, you would pass this location back to the registration form
    // For now, we'll just go back
    Alert.alert('Location Selected', `Lat: ${selectedLocation.latitude}, Lng: ${selectedLocation.longitude}`, [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
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

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            <Text style={styles.confirmButtonText}>Use Default Location</Text>
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
          style={styles.map}
          initialRegion={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
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
});
