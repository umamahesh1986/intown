import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useLocationStore } from '../store/locationStore';
import { Ionicons } from '@expo/vector-icons';

export default function LocationScreen() {
  const router = useRouter();
  const { setLocation, setPermission } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setPermission(true);
        router.replace('/login');
      } else {
        setPermission(false);
        Alert.alert(
          'Permission Denied',
          'Location permission is required for the best experience. You can still continue with limited functionality.',
          [
            { text: 'Try Again', onPress: requestLocationPermission },
            { text: 'Continue Anyway', onPress: () => router.replace('/login') },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location:', error);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={100} color="#FF6600" />
        </View>
        
        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.description}>
          We need your location to show nearby shops and provide personalized deals in your area.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestLocationPermission}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Getting Location...' : 'Allow Location Access'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FF6600',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
  },
  skipText: {
    color: '#FF6600',
    fontSize: 16,
    fontWeight: '600',
  },
});