import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationDetails {
  latitude: number;
  longitude: number;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  fullAddress: string;
}

interface LocationState {
  location: LocationDetails | null;
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
  setLocation: (location: LocationDetails) => void;
  setPermission: (hasPermission: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearLocation: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: (location: LocationDetails) => Promise<void>;
}

const LOCATION_STORAGE_KEY = 'user_location_details';

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  hasPermission: null,
  isLoading: false,
  error: null,
  
  setLocation: (location) => {
    set({ location, error: null });
    // Also save to storage
    get().saveToStorage(location);
  },
  
  setPermission: (hasPermission) => set({ hasPermission }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearLocation: () => {
    set({ location: null, hasPermission: null, error: null });
    AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  },
  
  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const location = JSON.parse(stored) as LocationDetails;
        set({ location, hasPermission: true });
      }
    } catch (error) {
      console.error('Error loading location from storage:', error);
    }
  },
  
  saveToStorage: async (location) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  },
}));

// Helper function to get location for API calls
export const getLocationForAPI = (): { latitude: number; longitude: number } | null => {
  const { location } = useLocationStore.getState();
  if (location) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }
  return null;
};
