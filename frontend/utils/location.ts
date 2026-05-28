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
 * Robust autocomplete-style search:
 *  - Area names (Madhapur, Kukatpally)
 *  - Streets (MG Road)
 *  - Landmarks (Charminar, Tank Bund)
 *  - Cities (Hyderabad)
 *  - 6-digit Indian pincodes (500081)
 *
 * Strategy (rate-limit friendly):
 *  1. Photon (Komoot) — autocomplete-grade, no public rate limit.
 *  2. Nominatim — fallback ONLY when Photon yields nothing. One request,
 *     long User-Agent (per OSM policy), result reused across calls via cache.
 *
 *  Results are cached per-query for the session and deduped by coordinate.
 *  Caller-side debouncing is still required (see dashboards).
 */

interface SearchResultItem {
  name: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

const searchCache = new Map<string, SearchResultItem[]>();
let inFlightSearch: Promise<SearchResultItem[]> | null = null;
let inFlightSearchQuery: string | null = null;

const buildDisplayAddress = (props: Record<string, any>): string => {
  const segments = [
    props.name,
    props.street,
    props.suburb,
    props.locality,
    props.district,
    props.city,
    props.county,
    props.state,
    props.postcode,
    props.country,
  ];
  return segments
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .join(', ');
};

const searchWithPhoton = async (q: string): Promise<SearchResultItem[]> => {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=en&limit=10&osm_tag=:!boundary`;
    const res = await withTimeout(
      fetch(url, { headers: { Accept: 'application/json' } }),
      6000,
      null as any,
    );
    if (!res || !(res as Response).ok) return [];
    const data = await (res as Response).json();
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    const items = features
      .map((f) => {
        const p = f.properties || {};
        const c = f.geometry?.coordinates;
        if (!Array.isArray(c) || c.length < 2) return null;
        // Photon returns [lon, lat]
        const longitude = parseFloat(c[0]);
        const latitude = parseFloat(c[1]);
        const friendlyName = pickHumanReadable(
          p.name,
          p.suburb,
          p.locality,
          p.district,
          p.city,
          p.street,
        );
        return {
          name: friendlyName || p.name || q,
          fullAddress: buildDisplayAddress(p),
          latitude,
          longitude,
        };
      })
      .filter(
        (r): r is SearchResultItem =>
          !!r && Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
      );
    // Prefer Indian results first (country filter not exposed by Photon)
    items.sort((a, b) => {
      const aIn = /india/i.test(a.fullAddress) ? 0 : 1;
      const bIn = /india/i.test(b.fullAddress) ? 0 : 1;
      return aIn - bIn;
    });
    return items;
  } catch (e) {
    console.warn('[searchLocations] Photon failed:', e);
    return [];
  }
};

const searchWithNominatim = async (q: string): Promise<SearchResultItem[]> => {
  try {
    const isPincode = /^\d{6}$/.test(q);
    const url = isPincode
      ? `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(q)}&country=India&addressdetails=1&limit=10`
      : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=10`;
    const res = await withTimeout(
      fetch(url, {
        headers: {
          // Nominatim requires a real identifying User-Agent / Referer
          'User-Agent': 'InTownLocal/1.0 (support@intownlocal.com)',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      }),
      8000,
      null as any,
    );
    if (!res || !(res as Response).ok) return [];
    const data = await (res as Response).json();
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
  } catch (e) {
    console.warn('[searchLocations] Nominatim failed:', e);
    return [];
  }
};

export const searchLocations = async (query: string): Promise<SearchResultItem[]> => {
  try {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 3) return [];

    // Session cache
    const cached = searchCache.get(q);
    if (cached) return cached;

    // Coalesce concurrent calls for the same query
    if (inFlightSearch && inFlightSearchQuery === q) {
      return inFlightSearch;
    }

    inFlightSearchQuery = q;
    inFlightSearch = (async () => {
      let merged = await searchWithPhoton(q);

      // If Photon returns nothing useful, fall back to Nominatim (one request)
      if (merged.length === 0) {
        merged = await searchWithNominatim(q);
      }

      // Dedupe by ~110m coord precision, cap to 10
      const seen = new Set<string>();
      const out: SearchResultItem[] = [];
      for (const r of merged) {
        const key = `${r.latitude.toFixed(3)}_${r.longitude.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
        if (out.length >= 10) break;
      }
      searchCache.set(q, out);
      return out;
    })();

    const result = await inFlightSearch;
    inFlightSearch = null;
    inFlightSearchQuery = null;
    return result;
  } catch (error) {
    inFlightSearch = null;
    inFlightSearchQuery = null;
    console.error('Error searching locations:', error);
    return [];
  }
};

export { DEFAULT_LOCATION };
