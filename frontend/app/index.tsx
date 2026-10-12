import { View, Text, StyleSheet, Image, Platform, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { searchUserByPhone, determineUserRole } from '../utils/api';
import { persistProfileImagesFromSearchResponse } from '../utils/profileImage';
import { ShopImageCarousel } from '../components/ShopImageCarousel';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, user, loadAuth, logout, setUserType, setGuest } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCarousel, setShowCarousel] = useState(false);

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

            // Re-derive role from the fresh response so a cached userType that
            // pre-dates the user gaining merchant access (or vice versa) self-corrects.
            const freshRole = determineUserRole(response);
            const freshUserType: 'merchant' | 'member' | 'user' | 'dual' =
              freshRole.role === 'dual'
                ? 'dual'
                : freshRole.role === 'merchant'
                ? 'merchant'
                : freshRole.role === 'customer'
                ? 'member'
                : 'user';
            if (user?.userType !== freshUserType) {
              await setUserType(freshUserType);
            }

            // Refresh role-keyed profile images from the latest response so
            // newly uploaded photos appear without re-login.
            await persistProfileImagesFromSearchResponse(response);

            router.replace(freshRole.dashboard as any);
            return;
          } catch (verifyErr) {
            // Network error — fall through to cached-userType routing below.
            console.log('=== DB verify failed (network?), using cached auth ===', verifyErr);
          }

          const userType = user?.userType?.toLowerCase();
          if (userType === 'dual' || userType === 'in_dual') {
            router.replace('/dual-dashboard');
          } else if (userType === 'merchant' || userType === 'in_merchant') {
            router.replace('/merchant-dashboard');
          } else if (userType === 'member' || userType === 'in_member' || userType === 'customer') {
            router.replace('/member-dashboard');
          } else {
            router.replace('/user-dashboard');
          }
        } else {
          // No active session - show the auto-playing shop carousel;
          // tapping anywhere continues into the OTP login flow.
          setShowCarousel(true);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setShowCarousel(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, isLoading]);

  const handleContinue = () => {
    router.replace('/login');
  };

  const handleBrowse = async () => {
    await setGuest(true);
    router.replace('/user-dashboard');
  };

  if (showCarousel) {
    return (
      <View style={styles.carouselContainer}>
        <ShopImageCarousel />
        <View style={styles.carouselFooter}>
          <Text style={styles.carouselTagline}>Shop Local, Save Instantly</Text>
          <Pressable style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Get Started</Text>
          </Pressable>
          <Pressable style={styles.browseButton} onPress={handleBrowse}>
            <Text style={styles.browseButtonText}>Explore</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
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
  carouselContainer: {
    flex: 1,
    backgroundColor: '#FFF6ED',
  },
  carouselFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  carouselTagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FF8A00',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  browseButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});