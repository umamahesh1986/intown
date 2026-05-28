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
 * Helper: add timeout to any promise
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

/**
 * Get current device location coordinates
 */
export const getCurrentCoordinates = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    if (Platform.OS === 'web') {
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
    
    // Mobile: Use expo-location with timeout
    // Try last known position first (instant, no GPS wait)
    try {
      const lastKnown = await withTimeout(
        Location.getLastKnownPositionAsync(),
        3000,
        null
      );
      if (lastKnown) {
        console.log('Using last known position');
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }
    } catch (e) {
      console.log('getLastKnownPositionAsync not available, using getCurrentPositionAsync');
    }

    // Fall back to getCurrentPositionAsync with timeout - use High accuracy
    // so we get an exact lat/lng that yields a proper area name (not a coarse
    // Plus Code) on reverse geocoding.
    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      20000,
      null as any
    );
    
    if (position) {
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }

    console.warn('getCurrentPositionAsync timed out');
    return null;
  } catch (error) {
    console.error('Error getting current coordinates:', error);
    return null;
  }
};

/**
 * Detect Google Plus Code / Open Location Code strings such as
 * "G99X+4VF", "7JVW96FF+QQ" — these are NOT human-readable and must
 * never be shown to the user as their area / city.
 */
export const isPlusCode = (value: string | null | undefined): boolean => {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  // Compact / short Plus Codes contain a "+" and only Plus-Code alphabet chars
  if (!trimmed.includes('+')) return false;
  return /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,8}$/i.test(trimmed);
};

/** Returns the first non-empty, non-plus-code value from a list */
const pickHumanReadable = (...candidates: Array<string | null | undefined>): string => {
  for (const c of candidates) {
    if (typeof c === 'string') {
      const t = c.trim();
      if (t.length > 0 && !isPlusCode(t)) return t;
    }
  }
  return '';
};

/**
 * Reverse geocode using Nominatim API (works on all platforms)
 */
const reverseGeocodeWithNominatim = async (
  latitude: number,
  longitude: number
): Promise<LocationDetails | null> => {
  try {
    const response = await withTimeout(
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
        {
          headers: {
            'User-Agent': 'InTownApp/1.0',
          },
        }
      ),
      8000,
      null as any
    );
    
    if (response && response.ok) {
      const data = await response.json();
      const address = data.address || {};
      
      const area = pickHumanReadable(
        address.suburb,
        address.neighbourhood,
        address.hamlet,
        address.village,
        address.town,
        address.city_district,
        address.residential,
        address.quarter,
      );
      const city = pickHumanReadable(
        address.city,
        address.town,
        address.village,
        address.municipality,
        address.county,
      );

      return {
        latitude,
        longitude,
        area,
        city,
        state: address.state || '',
        country: address.country || 'India',
        pincode: address.postcode || '',
        fullAddress: data.display_name || '',
      };
    }
  } catch (e) {
    console.warn('Nominatim API error:', e);
  }
  return null;
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
      const result = await reverseGeocodeWithNominatim(latitude, longitude);
      if (result) return result;
      
      return {
        ...DEFAULT_LOCATION,
        latitude,
        longitude,
      };
    }
    
    // Mobile: Try expo-location reverse geocoding first — but only use it
    // if it returns a HUMAN-READABLE name (not a Plus Code).
    try {
      const addresses = await withTimeout(
        Location.reverseGeocodeAsync({ latitude, longitude }),
        8000,
        null as any
      );
      
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const area = pickHumanReadable(
          addr.subregion,
          addr.district,
          (addr as any).subLocality,
          addr.street,
          addr.name,
        );
        const city = pickHumanReadable(addr.city, addr.region);

        if (area || city) {
          return {
            latitude,
            longitude,
            area,
            city,
            state: addr.region || '',
            country: addr.country || 'India',
            pincode: addr.postalCode || '',
            fullAddress: [addr.name, addr.street, area, city, addr.region, addr.postalCode, addr.country]
              .filter((p) => !!p && !isPlusCode(String(p)))
              .join(', '),
          };
        }
      }
    } catch (e) {
      console.warn('expo-location reverseGeocode failed, trying Nominatim:', e);
    }

    // Fallback: Use Nominatim API on mobile too (much better for Indian addresses)
    const nominatimResult = await reverseGeocodeWithNominatim(latitude, longitude);
    if (nominatimResult) return nominatimResult;
    
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
 * Search for locations by query (for manual location selection).
 *
 * Robust multi-strategy search that works for:
 *  - Area names (Madhapur, Kukatpally)
 *  - Streets (MG Road)
 *  - Landmarks (Charminar, Tank Bund)
 *  - Cities (Hyderabad)
 *  - 6-digit Indian pincodes (500081)
 *
 * Uses Nominatim free/forward search + a fallback structured pincode
 * query when the input is a 6-digit number. Results are deduped by
 * coordinate so the same place appearing in multiple searches is
 * shown only once.
 */
export const searchLocations = async (query: string): Promise<Array<{
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}>> => {
  try {
    const q = (query || '').trim();
    if (!q || q.length < 3) return [];

    const isPincode = /^\d{6}$/.test(q);

    const baseHeaders: Record<string, string> = {
      'User-Agent': 'InTownApp/1.0',
      'Accept-Language': 'en-IN,en;q=0.9',
    };

    const buildResults = (data: any[]): Array<{
      name: string;
      fullAddress: string;
      latitude: number;
      longitude: number;
    }> => {
      if (!Array.isArray(data)) return [];
      return data
        .map((item: any) => {
          const address = item.address || {};
          const friendlyName = pickHumanReadable(
            address.suburb,
            address.neighbourhood,
            address.hamlet,
            address.village,
            address.town,
            address.city_district,
            address.residential,
            address.quarter,
            address.road,
            address.city,
            (item.display_name as string)?.split(',')[0],
          );
          return {
            name: friendlyName || ((item.display_name as string)?.split(',')[0] ?? q),
            fullAddress: item.display_name || '',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        })
        .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
    };

    const fetchWithTimeout = (url: string) =>
      withTimeout(fetch(url, { headers: baseHeaders }), 8000, null as any);

    // Strategy 1: free-text query (primary)
    const queries: string[] = [
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=10`,
    ];

    // Strategy 2: structured pincode query if input is a 6-digit number
    if (isPincode) {
      queries.push(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(q)}&country=India&addressdetails=1&limit=10`,
      );
    } else {
      // Strategy 3: suggest within India explicitly (helps short queries)
      queries.push(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', India')}&countrycodes=in&addressdetails=1&limit=10`,
      );
    }

    const responses = await Promise.all(queries.map(fetchWithTimeout));
    const merged: Array<{
      name: string;
      fullAddress: string;
      latitude: number;
      longitude: number;
    }> = [];

    for (const res of responses) {
      if (!res || !(res as Response).ok) continue;
      try {
        const data = await (res as Response).json();
        merged.push(...buildResults(data));
      } catch {
        // ignore parse errors per strategy
      }
    }

    // Dedupe by ~3-decimal coord (~110m precision)
    const seen = new Set<string>();
    const out: Array<{
      name: string;
      fullAddress: string;
      latitude: number;
      longitude: number;
    }> = [];
    for (const r of merged) {
      const key = `${r.latitude.toFixed(3)}_${r.longitude.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
      if (out.length >= 10) break;
    }
    return out;
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

export { DEFAULT_LOCATION };
