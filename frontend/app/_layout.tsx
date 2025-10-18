import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="location" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="user-dashboard" />
      <Stack.Screen name="register-member" />
      <Stack.Screen name="register-merchant" />
      <Stack.Screen name="member-dashboard" />
      <Stack.Screen name="member-shop-list" />
      <Stack.Screen name="member-shop-details" />
      <Stack.Screen name="member-navigate" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="map" />
      <Stack.Screen name="shop-details" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}