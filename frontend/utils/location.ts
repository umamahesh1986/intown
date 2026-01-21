import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

/**
 * Ensures location exists.
 * - Reads from AsyncStorage
 * - If missing, fetches fresh location
 * - Works on Android, iOS, Web
 */
export const getUserLocation = async (): Promise<UserLocation | null> => {
  try {
    // 1️⃣ Try cache first
    const cached = await AsyncStorage.getItem('member_location');
    if (cached) {
      return JSON.parse(cached);
    }

    // 2️⃣ Web fallback (no GPS permission popup)
    if (Platform.OS === 'web') {
      const fallback = { latitude: 17.385, longitude: 78.4867 }; // Hyderabad default
      await AsyncStorage.setItem('member_location', JSON.stringify(fallback));
      return fallback;
    }

    // 3️⃣ Ask permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    // 4️⃣ Get location
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // 5️⃣ Save for reuse
    await AsyncStorage.setItem(
      'member_location',
      JSON.stringify(location)
    );

    return location;
  } catch (error) {
    console.error('getUserLocation error:', error);
    return null;
  }
};
