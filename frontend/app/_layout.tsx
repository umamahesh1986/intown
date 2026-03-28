import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import CommonBottomTabs from '../components/CommonBottomTabs';
import { Fonts } from '../utils/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DASHBOARD_KEY = 'last_visited_dashboard';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const [lastDashboard, setLastDashboard] = useState<string | null>(null);

  useEffect(() => {
    loadAuth();

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
    { name: 'Plans', icon: 'pricetag', link: '/plans' },
    { name: 'Profile', icon: 'person', link: '/account' },
  ];

  const tabs = isMerchant 
    ? allTabs.filter(tab => tab.name !== 'Savings' && tab.name !== 'Plans')
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
      </Stack>

      {/* Conditionally render the bar with dynamic tabs */}
     {showTabs && (
  <CommonBottomTabs tabs={tabs} />
)}
    </View>
  );
}