import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useAuthStore } from '../store/authStore';
import CommonBottomTabs from '../components/CommonBottomTabs';
import { Fonts } from '../utils/fonts';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const pathname = usePathname();

  useEffect(() => {
    loadAuth();

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
    '/near-by',
    '/savings',
    '/plans'
  ].includes(pathname);

  const tabs = [
  { name: 'Home', icon: 'home', link: '/user-dashboard' },
  { name: 'Savings', icon: 'wallet', link: '/savings' },
  { name: 'Plans', icon: 'pricetag', link: '/plans' },
  { name: 'Profile', icon: 'person', link: '/account' },
];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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