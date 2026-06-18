import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getUserLocationWithDetails } from '../utils/location';
import CommonBottomTabs from '../components/CommonBottomTabs';
import ForceUpdateModal from '../components/ForceUpdateModal';
import { Fonts } from '../utils/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DASHBOARD_KEY = 'last_visited_dashboard';

// Module-level flag — ensures location is bootstrapped only ONCE per app session
let __locationBootstrapped = false;

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const loadLocationFromStorage = useLocationStore((s) => s.loadFromStorage);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const [lastDashboard, setLastDashboard] = useState<string | null>(null);

  useEffect(() => {
    loadAuth();

    // Bootstrap location ONCE per app session:
    //  1. Hydrate from AsyncStorage so previous selection appears instantly
    //  2. Only if nothing was stored, request fresh GPS (first launch)
    if (!__locationBootstrapped) {
      __locationBootstrapped = true;
      (async () => {
        try {
          await loadLocationFromStorage();
          const persisted = useLocationStore.getState().location;
          if (!persisted) {
            await getUserLocationWithDetails();
          }
        } catch (e) {
          console.warn('[RootLayout] location bootstrap failed:', e);
        }
      })();
    }

    // Inject critical CSS for web to ensure full-height layout
    // This is needed because expo start --web (dev server) may not use +html.tsx
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'intown-root-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            overflow: hidden;
          }
          #root {
            display: flex;
            flex-direction: column;
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Load last visited dashboard
    const loadLastDashboard = async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_DASHBOARD_KEY);
        if (saved) {
          setLastDashboard(saved);
        }
      } catch (error) {
        console.error('Error loading last dashboard:', error);
      }
    };
    loadLastDashboard();

    // Apply Inter as the default font for all Text and TextInput components
    try {
      const defaultFontFamily = Fonts.regular;

      const RNText: any = Text;
      const RNTextInput: any = TextInput;

      if (!RNText.defaultProps) {
        RNText.defaultProps = {};
      }
      if (!RNTextInput.defaultProps) {
        RNTextInput.defaultProps = {};
      }

      RNText.defaultProps.style = [
        { fontFamily: defaultFontFamily },
        RNText.defaultProps.style,
      ];

      RNTextInput.defaultProps.style = [
        { fontFamily: defaultFontFamily },
        RNTextInput.defaultProps.style,
      ];
    } catch (error) {
      console.error('Error setting default fonts:', error);
    }
  }, []);

  // Update last dashboard when on a dashboard page
  useEffect(() => {
    const dashboardPaths = ['/user-dashboard', '/member-dashboard', '/merchant-dashboard', '/dual-dashboard'];
    if (dashboardPaths.includes(pathname)) {
      setLastDashboard(pathname);
    }
  }, [pathname]);

  // 1. Define all screens that should show the navigation bar
  const showTabs = [
    '/member-dashboard',
    '/merchant-dashboard',
    '/dual-dashboard',
    '/search',
    '/member-shop-list',
    '/account',
    '/payment',
    '/member-card',
    '/near-by',
    '/savings',
    '/plans'
  ].includes(pathname);

  // Check if user is merchant (by current path, last dashboard, or user type)
  const isMerchant = 
    pathname === '/merchant-dashboard' || 
    lastDashboard === '/merchant-dashboard' ||
    user?.userType?.toLowerCase() === 'merchant' ||
    user?.userType?.toLowerCase() === 'in_merchant';

  // Define tabs - filter out Savings and Plans for merchant
  const allTabs = [
    { name: 'Home', icon: 'home', link: '/user-dashboard' },
    { name: 'Savings', icon: 'wallet', link: '/savings' },
    { name: 'Privilege', icon: 'pricetag', link: '/plans' },
    { name: 'Profile', icon: 'person', link: '/account' },
  ];

  const tabs = isMerchant 
    ? allTabs.filter(tab => tab.name !== 'Savings' && tab.name !== 'Privilege')
    : allTabs;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}) } as any}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="location" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="user-dashboard" />
        <Stack.Screen name="register-member" />
        <Stack.Screen name="register-merchant" />
        <Stack.Screen name="location-picker" />
        <Stack.Screen name="member-dashboard" />
        <Stack.Screen name="merchant-dashboard" />
        <Stack.Screen name="dual-dashboard" />
        <Stack.Screen name="search" />
        <Stack.Screen name="member-shop-list" />
        <Stack.Screen name="member-shop-details" />
        <Stack.Screen name="member-navigate" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="map" />
        <Stack.Screen name="shop-details" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="account" />
        <Stack.Screen name="savings" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="payment-history" />
      </Stack>

      {/* Conditionally render the bar with dynamic tabs */}
     {showTabs && (
  <CommonBottomTabs tabs={tabs} />
)}

      {/* Force Update Modal — checks Play Store / App Store version on mount */}
      <ForceUpdateModal />
    </View>
  );
}