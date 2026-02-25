import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import CommonBottomTabs from '../components/CommonBottomTabs';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const pathname = usePathname();

  useEffect(() => {
    loadAuth();
  }, []);

  // 1. Define all screens that should show the navigation bar
  const showTabs = [
    '/user-dashboard',
    '/member-dashboard',
    '/merchant-dashboard',
    '/dual-dashboard',
    '/search',
    '/member-shop-list',
    '/account',
    '/payment',
    '/member-card',
    '/near-by'
  ].includes(pathname);

  const getDynamicTabs = () => {
    // --- 1. DUAL DASHBOARD FLOW ---
    if (pathname === '/dual-dashboard') {
      return [
        { name: 'Home', icon: 'home', link: '/dual-dashboard' },
        { name: 'Member', icon: 'people', link: '/member-dashboard' },
        { name: 'Merchant', icon: 'business', link: '/merchant-dashboard' },
        { name: 'Profile', icon: 'person', link: '/account' },
      ];
    }

    // --- 2. MERCHANT DASHBOARD FLOW ---
    // If the path relates to merchant activities
    else if (pathname === '/merchant-dashboard') {
      return [
        { name: 'Home', icon: 'home', link: '/merchant-dashboard' },
        { name: 'Transactions', icon: 'swap-horizontal', link: '/payment' },
        { name: 'Profile', icon: 'person', link: '/account' },
      ];
    }

    // --- 3. MEMBER DASHBOARD FLOW ---
    // Includes member home, card, and payment (if accessed from member side)
    else if (
      pathname === '/member-dashboard' || 
      pathname === '/member-card' || 
      (pathname === '/payment' && !pathname.includes('merchant'))
    ) {
      return [
        { name: 'Home', icon: 'home', link: '/member-dashboard' },
        { name: 'Card', icon: 'card', link: '/member-card' },
        { name: 'Search', icon: 'search', link: '/search' },
        { name: 'Transactions', icon: 'list', link: '/payment' },
        { name: 'Profile', icon: 'person', link: '/account' },
      ];
    }

    // --- 4. DEFAULT USER DASHBOARD FLOW ---
    // Used for /user-dashboard, /search, /member-shop-list, and /account
    else {
      return [
        { name: 'Home', icon: 'home', link: '/user-dashboard' },
        { name: 'Search', icon: 'search', link: '/search' },
        { name: 'Nearby', icon: 'location', link: '/member-shop-list' },
        { name: 'Profile', icon: 'person', link: '/account' },
      ];
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
      </Stack>

      {/* Conditionally render the bar with dynamic tabs */}
      {showTabs && (
        <CommonBottomTabs tabs={getDynamicTabs()} />
      )}
    </View>
  );
}