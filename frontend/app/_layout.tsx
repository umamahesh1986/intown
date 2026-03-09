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

  const tabs = [
  { name: 'Home', icon: 'home', link: '/user-dashboard' },
  { name: 'Savings', icon: 'wallet', link: '/savings' },
  { name: 'Plans', icon: 'pricetag', link: '/plans' },
  { name: 'Profile', icon: 'person', link: '/profile-menu' },
];

  return (
    <View style={{ flex: 1, backgroundColor: '#ff0000' }}>
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
  <CommonBottomTabs tabs={tabs} />
)}
    </View>
  );
}