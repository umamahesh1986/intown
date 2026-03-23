import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { searchUserByPhone } from '../utils/api';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user, loadAuth, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await loadAuth();
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(async () => {
      try {
        if (isAuthenticated && user?.phone) {
          // Verify user still exists in the database
          console.log('=== VERIFYING USER IN DATABASE ===', user.phone);
          try {
            const phoneDigits = user.phone.replace(/\D/g, '').slice(-10);
            const response = await searchUserByPhone(phoneDigits);
            const hasCustomer = response?.customer && Object.keys(response.customer).length > 0;
            const hasMerchant = response?.merchant && Object.keys(response.merchant).length > 0;

            if (!hasCustomer && !hasMerchant && !response?.user) {
              // User no longer exists in the database — force logout
              console.log('=== USER NOT FOUND IN DB — LOGGING OUT ===');
              await logout();
              router.replace('/login');
              return;
            }
            console.log('=== USER VERIFIED ===');
          } catch (verifyErr) {
            // Network error — allow cached login (don't block offline users)
            console.log('=== DB verify failed (network?), using cached auth ===', verifyErr);
          }

          const userType = user?.userType?.toLowerCase();
          if (userType === 'member' || userType === 'in_member' || userType === 'customer') {
            router.replace('/member-dashboard');
          } else if (userType === 'merchant' || userType === 'in_merchant') {
            router.replace('/merchant-dashboard');
          } else if (userType === 'dual' || userType === 'in_dual') {
            router.replace('/dual-dashboard');
          } else {
            router.replace('/user-dashboard');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Navigation error:', error);
        router.replace('/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/app_logo/intown-logo.jpg'}} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Local Savings Made Easy</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 100,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});