import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationDetails, useLocationStore } from '../store/locationStore';

// Default location (Hyderabad)
const DEFAULT_LOCATION: LocationDetails = {
  latitude: 17.385,
  longitude: 78.4867,
  area: 'Hyderabad',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  pincode: '500001',
  fullAddress: 'Hyderabad, Telangana, India',
};

/**
 * Request location permission from user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Web uses browser's geolocation API
      return true;
    }
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    useLocationStore.getState().setPermission(granted);
    return granted;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    useLocationStore.getState().setPermission(false);
    return false;
  }
};

/**
 * Check if location permission is granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }
    
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

/**
 * Get current device location coordinates
 */
export const getCurrentCoordinates = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    if (Platform.OS === 'web') {
      // Use browser's geolocation API for web
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          console.warn('Geolocation not supported on this browser');
          resolve({ latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude });
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Browser geolocation error:', error.message);
            resolve({ latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude });
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      });
    }
    
    // Mobile: Use expo-location
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current coordinates:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address details
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<LocationDetails> => {
  try {
    if (Platform.OS === 'web') {
      // For web, use a free geocoding API
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'InTownApp/1.0',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = data.address || {};
          
          return {
            latitude,
            longitude,
            area: address.suburb || address.neighbourhood || address.village || address.town || '',
            city: address.city || address.town || address.village || address.county || '',
            state: address.state || '',
            country: address.country || 'India',
            pincode: address.postcode || '',
            fullAddress: data.display_name || '',
          };
        }
      } catch (e) {
        console.warn('Nominatim API error:', e);
      }
      
      // Fallback for web
      return {
        ...DEFAULT_LOCATION,
        latitude,
        longitude,
      };
    }
    
    // Mobile: Use expo-location reverse geocoding
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    
    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      const area = addr.subregion || addr.district || addr.name || '';
      const city = addr.city || addr.region || '';
      
      return {
        latitude,
        longitude,
        area: area,
        city: city,
        state: addr.region || '',
        country: addr.country || 'India',
        pincode: addr.postalCode || '',
        fullAddress: [addr.name, addr.street, area, city, addr.region, addr.postalCode, addr.country]
          .filter(Boolean)
          .join(', '),
      };
    }
    
    return {
      ...DEFAULT_LOCATION,
      latitude,
      longitude,
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      ...DEFAULT_LOCATION,
      latitude,
      longitude,
    };
  }
};

/**
 * Get user's current location with full details
 * This is the main function to call from components
 */
export const getUserLocationWithDetails = async (): Promise<LocationDetails | null> => {
  const store = useLocationStore.getState();
  
  try {
    store.setLoading(true);
    store.setError(null);
    
    // Request permission first
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      store.setError('Location permission denied');
      store.setLoading(false);
      return null;
    }
    
    // Get coordinates
    const coords = await getCurrentCoordinates();
    
    if (!coords) {
      store.setError('Could not get location');
      store.setLoading(false);
      return null;
    }
    
    // Reverse geocode to get address
    const locationDetails = await reverseGeocode(coords.latitude, coords.longitude);
    
    // Save to store
    store.setLocation(locationDetails);
    store.setLoading(false);
    
    return locationDetails;
  } catch (error: any) {
    console.error('Error getting user location:', error);
    store.setError(error.message || 'Failed to get location');
    store.setLoading(false);
    return null;
  }
};

/**
 * Set location manually (when user selects a location)
 */
export const setManualLocation = async (
  latitude: number,
  longitude: number
): Promise<LocationDetails | null> => {
  const store = useLocationStore.getState();
  
  try {
    store.setLoading(true);
    
    // Reverse geocode the selected coordinates
    const locationDetails = await reverseGeocode(latitude, longitude);
    
    // Save to store
    store.setLocation(locationDetails);
    store.setLoading(false);
    
    return locationDetails;
  } catch (error: any) {
    console.error('Error setting manual location:', error);
    store.setError(error.message || 'Failed to set location');
    store.setLoading(false);
    return null;
  }
};

/**
 * Search for locations by query (for manual location selection)
 */
export const searchLocations = async (query: string): Promise<Array<{
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}>> => {
  try {
    if (!query || query.length < 3) return [];
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
      {
        headers: {
          'User-Agent': 'InTownApp/1.0',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        fullAddress: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

export { DEFAULT_LOCATION };
