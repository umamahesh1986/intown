import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore } from '../store/locationStore';
import { getUserLocationWithDetails } from '../utils/location';
import PaymentModal from '../components/PaymentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function MemberNavigate() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    shopId?: string;
    shop?: string;
    source?: string;
    shopLat?: string;
    shopLng?: string;
  }>();
  const shopId = params.shopId as string;
  const redirectTo = params.source === 'dual' ? '/dual-dashboard' : '/member-dashboard';
  const shopFromParams = (() => {
    if (!params.shop) return null;
    try {
      return JSON.parse(params.shop as string);
    } catch {
      return null;
    }
  })();
  const shopName = shopFromParams?.shopName || shopFromParams?.name || 'Shop';
  const parsedShopLat = Number(params.shopLat);
  const parsedShopLng = Number(params.shopLng);
  const destinationLat =
    (Number.isFinite(parsedShopLat) ? parsedShopLat : null) ??
    shopFromParams?.latitude ??
    shopFromParams?.lat ??
    shopFromParams?.shopLatitude ??
    null;
  const destinationLng =
    (Number.isFinite(parsedShopLng) ? parsedShopLng : null) ??
    shopFromParams?.longitude ??
    shopFromParams?.lng ??
    shopFromParams?.shopLongitude ??
    null;
  const location = useLocationStore((state) => state.location);
  const loadLocationFromStorage = useLocationStore((state) => state.loadFromStorage);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [originCoords, setOriginCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [autoFitRoute, setAutoFitRoute] = useState(true);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const originLat = Number(originCoords?.latitude);
  const originLng = Number(originCoords?.longitude);
  const hasOrigin = Number.isFinite(originLat) && Number.isFinite(originLng);
  const hasDestination =
    Number.isFinite(destinationLat) && Number.isFinite(destinationLng);
  const directionsUrl = hasOrigin && hasDestination
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`
    : '';

  const handlePaymentSuccess = (amount: number, savings: number, method: string) => {
    console.log('Payment successful:', { amount, savings, method });
  };

  useEffect(() => {
    const ensureLocation = async () => {
      setIsLoadingLocation(true);
      const liveCoords = await (async () => {
        try {
          if (Platform.OS === 'web') {
            return await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
              if (!navigator.geolocation) return resolve(null);
              navigator.geolocation.getCurrentPosition(
                (position) =>
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  }),
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
              );
            });
          }
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status !== 'granted') return null;
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          return null;
        }
      })();

      if (liveCoords) {
        setOriginCoords(liveCoords);
      } else {
        await loadLocationFromStorage();
        const storedLocation = useLocationStore.getState().location;
        if (storedLocation?.latitude != null && storedLocation?.longitude != null) {
          setOriginCoords({
            latitude: storedLocation.latitude,
            longitude: storedLocation.longitude,
          });
        }
      }

      // Keep location store updated for other screens
      await getUserLocationWithDetails();
      setIsLoadingLocation(false);
    };
    ensureLocation();

    const loadCustomerId = async () => {
      try {
        const storedCustomerId = await AsyncStorage.getItem('customer_id');
        if (storedCustomerId) {
          setCustomerId(storedCustomerId);
        }
      } catch (error) {
        console.error('Error loading customer id:', error);
      }
    };

    loadCustomerId();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!hasOrigin || !hasDestination) return;
      setIsRouteLoading(true);
      setRouteError(null);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Route fetch failed: ${res.status}`);
        }
        const data = await res.json();
        const route = data?.routes?.[0];
        const points = route?.geometry?.coordinates ?? [];
        if (!Array.isArray(points) || points.length === 0) {
          throw new Error('No route found');
        }
        const mapped = points.map((point: number[]) => ({
          latitude: point[1],
          longitude: point[0],
        }));
        setRouteCoords(mapped);
        
        // Extract distance and duration
        if (route?.distance) {
          const distanceKm = (route.distance / 1000).toFixed(1);
          setRouteDistance(`${distanceKm} km`);
        }
        if (route?.duration) {
          const durationMin = Math.round(route.duration / 60);
          if (durationMin < 60) {
            setRouteDuration(`${durationMin} min`);
          } else {
            const hours = Math.floor(durationMin / 60);
            const mins = durationMin % 60;
            setRouteDuration(`${hours} hr ${mins} min`);
          }
        }
      } catch (error: any) {
        console.error('Route fetch error', error);
        setRouteError(error?.message || 'Unable to load route');
      } finally {
        setIsRouteLoading(false);
      }
    };
    fetchRoute();
  }, [hasOrigin, hasDestination, originLat, originLng, destinationLat, destinationLng]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length === 0 || !autoFitRoute) return;
    mapRef.current.fitToCoordinates(routeCoords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [routeCoords, autoFitRoute]);

  const handleStartNavigation = async () => {
    if (!hasOrigin || !hasDestination) return;
    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(directionsUrl);
      } catch (error) {
        console.error('Failed to open maps', error);
      }
      return;
    }
    setAutoFitRoute(false);
    setFollowUser(true);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: originLat,
          longitude: originLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shopName}</Text>
        <View style={{width:40}} />
      </View>

      <View style={styles.mapContainer}>
        {hasOrigin && hasDestination ? (
          Platform.OS === 'web' ? (
            <WebView
              source={{ uri: directionsUrl }}
              style={styles.mapWebView}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              renderLoading={() => (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.mapLoadingText}>Loading route...</Text>
                </View>
              )}
            />
          ) : (
            <MapView
              ref={mapRef}
              style={styles.mapWebView}
              initialRegion={{
                latitude: (originLat + destinationLat) / 2,
                longitude: (originLng + destinationLng) / 2,
                latitudeDelta: Math.abs(originLat - destinationLat) * 2 + 0.02,
                longitudeDelta: Math.abs(originLng - destinationLng) * 2 + 0.02,
              }}
              showsUserLocation
              followsUserLocation={followUser}
            >
              <Marker coordinate={{ latitude: originLat, longitude: originLng }} title="You" />
              <Marker
                coordinate={{ latitude: destinationLat, longitude: destinationLng }}
                title={shopName}
              />
              {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#2196F3" />
              )}
            </MapView>
          )
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.mapSubtext}>
              {!hasDestination
                ? 'Shop location not available.'
                : isLoadingLocation
                ? 'Getting your location...'
                : 'Waiting for location permission...'}
            </Text>
          </View>
        )}
        {(isRouteLoading || routeError) && hasOrigin && hasDestination ? (
          <View style={styles.routeStatus}>
            {isRouteLoading ? (
              <>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.mapLoadingText}>Loading route...</Text>
              </>
            ) : (
              <Text style={styles.routeErrorText}>{routeError}</Text>
            )}
          </View>
        ) : null}

        {hasOrigin && hasDestination ? (
          <TouchableOpacity
            style={[styles.startButton, followUser && styles.startButtonActive]}
            onPress={handleStartNavigation}
          >
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity style={styles.payButton} onPress={() => setShowPayment(true)}>
        <Ionicons name="card" size={24} color="#FFF" />
        <Text style={styles.payButtonText}>Pay at Shop</Text>
      </TouchableOpacity>

      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        merchantId={shopId}
        customerId={customerId ?? undefined}
        redirectTo={redirectTo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#F5F5F5'},
  header: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#2196F3'},
  backButton: {width:40, height:40, justifyContent:'center'},
  headerTitle: {fontSize:18, fontWeight:'600', color:'#FFF'},
  mapContainer: {flex:1, backgroundColor:'#E3F2FD'},
  mapWebView: {flex:1},
  mapLoading: {flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#E3F2FD'},
  mapLoadingText: {marginTop:8, color:'#1976D2', fontSize:14},
  mapPlaceholder: {flex:1, backgroundColor:'#E3F2FD', alignItems:'center', justifyContent:'center', padding:32},
  mapText: {fontSize:24, fontWeight:'bold', color:'#1976D2', marginTop:16},
  mapSubtext: {fontSize:14, color:'#1976D2', marginTop:8, textAlign:'center'},
  routeStatus: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeErrorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
  },
  startButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#2196F3',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  startButtonActive: {
    backgroundColor: '#1976D2',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  payButton: {flexDirection:'row', backgroundColor:'#FF6600', margin:16, borderRadius:12, paddingVertical:16, alignItems:'center', justifyContent:'center'},
  payButtonText: {color:'#FFF', fontSize:18, fontWeight:'bold', marginLeft:8},
});
